import mongoose from "mongoose";

const boardingPointSchema = new mongoose.Schema({
  serviceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  type: { type: String, enum: ["boarding", "drop"], required: true },
  name: { type: String, required: true },
  time: String,
  landmark: String,
});

export default mongoose.model(
  "BoardingPoint",
  boardingPointSchema,
  "boardingpoints",
);
