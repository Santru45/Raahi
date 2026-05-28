import mongoose from 'mongoose';
import Wallet from '../models/wallet.model.js';

export const getWalletByUser = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({
      userId: new mongoose.Types.ObjectId(req.params.userId),
    });
    if (!wallet) {
      wallet = await Wallet.create({
        userId: new mongoose.Types.ObjectId(req.params.userId),
        balance: 0,
        currency: 'INR',
        transactions: [],
      });
    }
    res.json(wallet);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateWallet = async (req, res) => {
  try {
    const updated = await Wallet.findByIdAndUpdate(
      req.params.walletId,
      { $set: req.body },
      { new: true },
    );
    if (!updated) return res.status(404).json({ message: 'Wallet not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
