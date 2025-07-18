const express = require("express");

const app = express();

const PORT = 3000;

app.get("/", (req, res) => {
  res.send("root page");
});

app.listen(PORT, () => {
  console.log(`server running on port http://localhost:${PORT}`);
});
