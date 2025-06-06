const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

const app = express();

dotenv.config();

const PORT = 3000;

async function main() {
  await mongoose.connect(process.env.MONGODB_URL);
}

main()
  .then(() => {
    console.log("database connected successfully");
  })
  .catch((err) => {
    console.log(`Error: ${err}`);
  });

app.get("/", (req, res) => {
  res.send("Home Page");
});

app.listen(PORT, () => {
  console.log(`server listening on http://localhost:${PORT}`);
});
