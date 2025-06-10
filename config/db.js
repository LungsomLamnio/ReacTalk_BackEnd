const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

async function connectDB() {
  await mongoose.connect(process.env.MONGODB_URL);
}

connectDB()
  .then(() => {
    console.log("database connected successfully");
  })
  .catch((err) => {
    console.log(`Error: ${err}`);
  });

module.exports = connectDB;
