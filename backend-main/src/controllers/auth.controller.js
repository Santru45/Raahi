import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import passport from "passport";
import nodemailer from "nodemailer";
import { userModel } from "../models/user.model.js";
import Wallet from "../models/wallet.model.js";
import LoyaltyAccount from "../models/loyaltyAccount.model.js";

// Strip sensitive fields before sending user data to client
const sanitizeUser = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.passwordHash;
  delete obj.__v;
  obj._id = obj._id.toString();
  return obj;
};

// Find user by email and validate OTP (shared by verifyOtp + resetPassword)
const validateOtp = async (email, otp) => {
  const user = await userModel.findOne({ email });
  if (!user?.otpHash)
    return { error: "No OTP requested for this email", status: 400 };
  if (new Date() > user.otpExpiry)
    return { error: "OTP has expired", status: 400 };
  const match = await bcrypt.compare(otp, user.otpHash);
  if (!match) return { error: "Invalid OTP", status: 400 };
  return { user };
};

export const signup = async (req, res) => {
  try {
    const { name, email, passwordHash, phone } = req.body;

    if (await userModel.findOne({ email })) {
      return res
        .status(409)
        .json({ message: "An account with this email already exists" });
    }

    if (await userModel.findOne({ phone })) {
      return res
        .status(409)
        .json({ message: "An account with this phone number already exists" });
    }

    const hashedPassword = await bcrypt.hash(passwordHash, 10);
    const loyaltyAccountId =
      "LOY-" + Math.random().toString(36).substring(2, 9).toUpperCase();

    const savedUser = await userModel.create({
      name,
      email,
      phone,
      loyaltyAccountId,
      passwordHash: hashedPassword,
      role: "customer",
    });

    // Create wallet and loyalty account for the new user
    await Promise.all([
      Wallet.create({
        userId: savedUser._id,
        balance: 0,
        currency: "INR",
        transactions: [],
      }),
      LoyaltyAccount.create({
        userId: savedUser._id,
        coinBalance: 0,
        totalEarned: 0,
        tier: "bronze",
        earnMultiplier: 1,
        maxRedeemPercent: 10,
        nextTierAt: 200,
        ledger: [],
      }),
    ]);

    const token = jwt.sign(
      { id: savedUser._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
    );

    res.status(201).json({
      message: "User created successfully",
      user: sanitizeUser(savedUser),
      token,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const login = (req, res) => {
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err)
      return res.status(500).json({ message: "Server error during login" });

    if (!user) {
      const status = info?.message === "Email not registered" ? 404 : 401;
      return res
        .status(status)
        .json({ message: info?.message || "Login failed" });
    }

    const rememberMe = req.body.rememberMe === true;
    const expiresIn = rememberMe ? "30d" : "1d";

    const token = jwt.sign(
      { id: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn },
    );
    return res.json({ token, user: sanitizeUser(user) });
  })(req, res);
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userModel.findOne({ email });
    if (!user) return res.status(404).json({ message: "Email not registered" });

    // Generate OTP, hash it, store with 10-min expiry
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    await userModel.findByIdAndUpdate(user._id, {
      otpHash,
      otpExpiry: new Date(Date.now() + 10 * 60 * 1000),
    });

    // Best-effort email send (SMTP may be blocked on some networks)
    if (process.env.MAIL_USER && process.env.MAIL_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
        });
        await transporter.sendMail({
          from: `"Raahi Travel" <${process.env.MAIL_USER}>`,
          to: email,
          subject: "Your Password Reset OTP",
          html: `<div style="font-family:sans-serif;max-width:480px;margin:auto">
            <h2 style="color:#0d9aaa">Password Reset OTP</h2>
            <p>Expires in <strong>10 minutes</strong>.</p>
            <div style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#0d9aaa;padding:16px 0">${otp}</div>
          </div>`,
        });
      } catch (mailErr) {
        console.warn("[OTP] Email send failed:", mailErr.message);
      }
    }

    // Always return OTP so the frontend can display it (dev convenience)
    res.json({ message: "OTP generated", otp });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { error, status } = await validateOtp(req.body.email, req.body.otp);
    if (error) return res.status(status).json({ message: error });
    res.json({ message: "OTP verified" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const { error, status, user } = await validateOtp(email, otp);
    if (error) return res.status(status).json({ message: error });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await userModel.findByIdAndUpdate(user._id, {
      passwordHash: hashedPassword,
      otpHash: null,
      otpExpiry: null,
    });

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
