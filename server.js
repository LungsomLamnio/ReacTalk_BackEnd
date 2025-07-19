const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();

const PORT = 3000;

app.get("/", (req, res) => {
  res.send("root page");
});

app.listen(PORT, () => {
  console.log(`server running on port http://localhost:${PORT}`);
});
