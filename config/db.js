const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URI);
    console.log("database connected successfully");
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
};
module.exports = connectDB;
