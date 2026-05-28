import LoyaltyAccount from "../models/loyaltyAccount.model.js";
import mongoose from "mongoose";

const { ObjectId } = mongoose.Types;

// Coin conversion rates
const COINS_PER_RUPEE_EARN = 0.01; // ₹100 = 1 coin
const COINS_PER_COIN_REDEEM = 0.5; // 1 coin = ₹0.50 discount

// Helpers
const toObjectId = (id) => {
  try {
    return new ObjectId(id.toString());
  } catch {
    return id;
  }
};
// helper function to get user id from various possible places
const getUserId = (req) =>
  req.user?._id?.toString() ||
  req.params?.userId ||
  req.body?.userId ||
  req.query?.userId;

const calculateCoins = (bookingAmount, earnMultiplier) =>
  Math.floor(bookingAmount * COINS_PER_RUPEE_EARN * earnMultiplier);

const calcTier = (totalEarned) => {
  if (totalEarned >= 1500) return "platinum";
  if (totalEarned >= 600) return "gold";
  if (totalEarned >= 200) return "silver";
  return "bronze";
};

const getMultiplier = (tier) =>
  ({ bronze: 1, silver: 1.5, gold: 2, platinum: 3 })[tier] ?? 1;

const getNextTierAt = (tier) =>
  ({ bronze: 200, silver: 600, gold: 1500, platinum: 0 })[tier] ?? 0;

const makeLedgerEntry = (ledgerLength, entry, newBalance) => ({
  ...entry,
  id: `led_${String(ledgerLength + 1).padStart(3, "0")}`,
  balanceAfter: newBalance,
  expiresAt:
    entry.action === "earned" || entry.action === "refunded"
      ? (entry.expiresAt ??
        new Date(new Date().setFullYear(new Date().getFullYear() + 1)))
      : undefined,
});

const getTotalRedeemed = (ledger) => {
  const spent = ledger
    .filter((e) => e.action === "redeemed" || e.action === "clawback")
    .reduce((s, e) => s + e.coins, 0);
  const returned = ledger
    .filter((e) => e.action === "refunded")
    .reduce((s, e) => s + e.coins, 0);
  return Math.max(0, spent - returned);
};

const getTotalActualEarned = (ledger) =>
  ledger
    .filter((e) => e.action === "earned" || e.action === "refunded")
    .reduce((s, e) => s + e.coins, 0);

// GET /api/loyalty/:userId
export const getLoyaltyByUser = async (req, res) => {
  try {
    const userId = getUserId(req);
    let account = await LoyaltyAccount.findOne({ userId: toObjectId(userId) });
    if (!account) {
      account = await LoyaltyAccount.create({
        userId: toObjectId(userId),
        coinBalance: 0,
        totalEarned: 0,
        tier: "bronze",
        earnMultiplier: 1,
        maxRedeemPercent: 10,
        nextTierAt: 200,
        ledger: [],
      });
    }

    // Auto-clean expired coins before returning
    const now = new Date();
    const expiredEntries = account.ledger.filter(
      (e) => e.action === "earned" && e.expiresAt && e.expiresAt < now,
    );

    if (expiredEntries.length > 0) {
      const expiredCoins = expiredEntries.reduce((s, e) => s + e.coins, 0);
      const totalActualEarned = getTotalActualEarned(account.ledger);
      const totalRedeemed = getTotalRedeemed(account.ledger);
      const nonExpiredEarned = totalActualEarned - expiredCoins;
      const alreadySpentFromExpired = Math.max(
        0,
        totalRedeemed - nonExpiredEarned,
      );
      const coinsToDeduct = Math.max(0, expiredCoins - alreadySpentFromExpired);

      account.ledger = account.ledger.filter(
        (e) => !(e.action === "earned" && e.expiresAt && e.expiresAt < now),
      );

      if (coinsToDeduct > 0) {
        const newBalance = Math.max(0, account.coinBalance - coinsToDeduct);
        account.ledger.push({
          id: `led_${String(account.ledger.length + 1).padStart(3, "0")}`,
          bookingReference: "SYSTEM",
          bookingType: "system",
          action: "clawback",
          coins: coinsToDeduct,
          balanceAfter: newBalance,
          note: `${coinsToDeduct} coins expired`,
        });
        account.coinBalance = newBalance;
      }

      await account.save();
    }

    res.json(account);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// POST /api/loyalty/:userId/award
export const awardCoins = async (req, res) => {
  try {
    const { bookingAmount, bookingReference, bookingType } = req.body;
    const userId = getUserId(req);
    const account = await LoyaltyAccount.findOne({
      userId: toObjectId(userId),
    });
    if (!account)
      return res.status(404).json({ message: "Loyalty account not found" });

    const coins = calculateCoins(bookingAmount, account.earnMultiplier);
    const newBalance = account.coinBalance + coins;

    // If the account is in debt (negative balance), earned coins first pay off
    // the debt before counting toward tier progression. Only coins that bring
    // the balance above 0 contribute to totalEarned / tier upgrades.
    const coinsTowardTier =
      Math.max(0, newBalance) - Math.max(0, account.coinBalance);
    // coinsTowardTier = coins that actually move the "positive" balance up
    const newTotal = account.totalEarned + coinsTowardTier;
    const newTier = calcTier(newTotal);

    const entry = makeLedgerEntry(
      account.ledger.length,
      {
        bookingReference,
        bookingType,
        action: "earned",
        coins,
        note: `${bookingType} booking reward`,
      },
      newBalance,
    );

    account.coinBalance = newBalance;
    account.totalEarned = newTotal;
    account.tier = newTier;
    account.earnMultiplier = getMultiplier(newTier);
    account.nextTierAt = getNextTierAt(newTier);
    account.ledger.push(entry);
    await account.save();
    res.json(account);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// POST /api/loyalty/:userId/validate-redeem
export const validateRedeem = async (req, res) => {
  try {
    const { coinsToRedeem, bookingAmount } = req.body;
    const userId = getUserId(req);
    const account = await LoyaltyAccount.findOne({
      userId: toObjectId(userId),
    });
    if (!account)
      return res.status(404).json({ message: "Loyalty account not found" });

    // Check for debt - cannot redeem if in debt
    if (account.coinBalance < 0)
      return res.json({
        valid: false,
        error: `Your balance is ${account.coinBalance} coins. Clear debt before redeeming.`,
        maxAllowed: 0,
        discountAmount: 0,
      });

    // Check sufficient balance
    if (coinsToRedeem > account.coinBalance)
      return res.json({
        valid: false,
        error: `Insufficient coins. You have ${account.coinBalance} coins.`,
        maxAllowed: account.coinBalance,
        discountAmount: account.coinBalance * COINS_PER_COIN_REDEEM,
      });

    const maxDiscountRupees = (bookingAmount * account.maxRedeemPercent) / 100;
    const maxRedeemableCoins = Math.floor(
      maxDiscountRupees / COINS_PER_COIN_REDEEM,
    );

    if (coinsToRedeem > maxRedeemableCoins)
      return res.json({
        valid: false,
        error: `Max redeemable is ${maxRedeemableCoins} coins (${account.maxRedeemPercent}% of ₹${bookingAmount}).`,
        maxAllowed: maxRedeemableCoins,
        discountAmount: maxRedeemableCoins * COINS_PER_COIN_REDEEM,
      });

    res.json({
      valid: true,
      maxAllowed: maxRedeemableCoins,
      discountAmount: coinsToRedeem * COINS_PER_COIN_REDEEM,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// POST /api/loyalty/:userId/redeem
export const redeemCoins = async (req, res) => {
  try {
    const {
      coinsToRedeem,
      bookingReference,
      bookingAmount,
      bookingType = "hotel",
    } = req.body;
    const userId = getUserId(req);
    const account = await LoyaltyAccount.findOne({
      userId: toObjectId(userId),
    });
    if (!account)
      return res.status(404).json({ message: "Loyalty account not found" });

    // Block redemption if in debt
    if (account.coinBalance < 0)
      return res.status(400).json({
        message:
          "Cannot redeem coins while balance is negative. Clear debt first.",
      });

    const maxDiscountRupees = (bookingAmount * account.maxRedeemPercent) / 100;
    const maxRedeemableCoins = Math.floor(
      maxDiscountRupees / COINS_PER_COIN_REDEEM,
    );
    const coins = Math.min(
      coinsToRedeem,
      maxRedeemableCoins,
      account.coinBalance,
    );
    const newBalance = account.coinBalance - coins;

    const entry = makeLedgerEntry(
      account.ledger.length,
      {
        bookingReference,
        bookingType,
        action: "redeemed",
        coins,
        note: "Redeemed at checkout",
      },
      newBalance,
    );

    account.coinBalance = newBalance;
    account.ledger.push(entry);
    await account.save();
    res.json({ account, discountAmount: coins * COINS_PER_COIN_REDEEM });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Called internally on cancellation
export const processLoyaltyCancellation = async (
  userId,
  {
    bookingReference,
    bookingType,
    coinsEarned = 0,
    coinsRedeemed = 0,
    clawbackPct = 100,
  },
) => {
  const coinsToClawback = Math.round((coinsEarned * clawbackPct) / 100);
  const coinsToReinstate = coinsRedeemed;
  if (coinsToClawback === 0 && coinsToReinstate === 0) return null;

  const account = await LoyaltyAccount.findOne({ userId: toObjectId(userId) });
  if (!account) return null;

  const netCoinChange = coinsToReinstate - coinsToClawback; // may be negative (debt)
  account.coinBalance = (account.coinBalance ?? 0) + netCoinChange;

  const newTotalEarned = Math.max(
    0,
    (account.totalEarned ?? 0) - coinsToClawback,
  );
  const newTier = calcTier(newTotalEarned);
  account.totalEarned = newTotalEarned;
  account.tier = newTier;
  account.earnMultiplier = getMultiplier(newTier);
  account.nextTierAt = getNextTierAt(newTier);

  if (coinsToClawback > 0) {
    account.ledger.push(
      makeLedgerEntry(
        account.ledger.length,
        {
          bookingReference,
          bookingType,
          action: "clawback",
          coins: coinsToClawback,
          note: `${clawbackPct}% coins deducted — booking cancelled`,
        },
        account.coinBalance,
      ),
    );
  }

  if (coinsToReinstate > 0) {
    account.ledger.push(
      makeLedgerEntry(
        account.ledger.length,
        {
          bookingReference,
          bookingType,
          action: "refunded",
          coins: coinsToReinstate,
          note: `100% coins reinstated — booking cancelled`,
        },
        account.coinBalance,
      ),
    );
  }

  await account.save();
  return account;
};

// POST /api/loyalty/:userId/cancel
export const handleCancellation = async (req, res) => {
  try {
    const {
      bookingReference,
      bookingType = "hotel",
      coinsEarned = 0,
      coinsRedeemed = 0,
      clawbackPct = 100,
    } = req.body;
    const userId = getUserId(req);
    const account = await processLoyaltyCancellation(userId, {
      bookingReference,
      bookingType,
      coinsEarned,
      coinsRedeemed,
      clawbackPct,
    });
    if (!account)
      return res
        .status(404)
        .json({ message: "Loyalty account not found or nothing to process" });
    res.json(account);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
