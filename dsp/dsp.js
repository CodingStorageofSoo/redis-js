require("dotenv").config();
const { DSP_PORT } = process.env;

const express = require("express");
const app = express();
app.use(express.json());

const randomNumberInRange = (min, max) => {
  return Math.random() * (max - min) + min;
};

app.get("/processBid/:id", (req, res) => {
  const id = req.params.id;
  setTimeout(() => {
    res.send({
      id: id,
      price: randomNumberInRange(0, 100),
    });
  }, randomNumberInRange(0, 2000));
});

app.listen(DSP_PORT, () => {
  console.log(`DSP Server listening on port ${DSP_PORT}`);
});
