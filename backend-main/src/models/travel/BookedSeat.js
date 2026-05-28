import mongoose from 'mongoose';

const bookedSeatSchema = new mongoose.Schema({
  serviceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  seatId: { type: String, required: true },
  gender: { type: String, enum: ['male', 'female'], default: 'male' },
  bookingReference: { type: String, required: true },
});

export default mongoose.model('BookedSeat', bookedSeatSchema, 'bookedseats');
