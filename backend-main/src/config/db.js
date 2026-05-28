import mongoose from "mongoose";

export async function connectDB() {
  try {
    console.log("MongoDB_connection initiated: config/db.js");
    const mongoURL = process.env.MONGO_URI;
    await mongoose.connect(mongoURL);

    console.log(
      "MongoDB_connection success : config/db.js \n URL : ",
      mongoURL,
    );
  } catch (error) {
    console.log("MongoDB_connection failed : config/db.js, Error : ", error);
    process.exit(1);
  }
}
