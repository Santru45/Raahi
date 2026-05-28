import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
await mongoose.connect(process.env.MONGO_URI);
const col = mongoose.connection.collection('travelServices');
const docs = await col.find({}).limit(3).toArray();
console.log(
  JSON.stringify(
    docs.map((d) => ({
      _id: d._id,
      _id_type: typeof d._id,
      type: d.type,
      from: d.from,
      to: d.to,
    })),
    null,
    2,
  ),
);
await mongoose.disconnect();
