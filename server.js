const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

const app = express();

dotenv.config();

const PORT = process.env.PORT || 3001;

connectDB();

app.get("/", (req, res) => {
  res.send("Home Page");
});

app.listen(PORT, () => {
  console.log(`server listening on http://localhost:${PORT}`);
});
