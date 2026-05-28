import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  type: { type: String, enum: ['flight', 'train', 'bus'], required: true },
  name: { type: String, required: true },
  city: { type: String, required: true },
  code: String,
  state: String,
});

export default mongoose.model('Location', locationSchema, 'locations');
