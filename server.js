// npm init -y
// npm i express
const express = require("express");
const app = express();
app.use(express.json());

// npm i axios
const axios = require("axios");

// npm i ioredis
// redis-server
// redis-cli
const Redis = require("ioredis");
const redisClient = new Redis();

async function getBidResponse(url, data) {
  try {
    const response = await axios.get(url, { params: data });

    // Prevent Race Condition using Redis
    const cnt = await redisClient.incr("cnt");

    redisClient
      .multi()
      .zadd(
        "bidResponses",
        response.data.price * 1000 - cnt,
        JSON.stringify({
          id: response.data.id,
          price: response.data.price,
          order: cnt,
        })
      )
      .exec((err, results) => {
        if (err) {
          console.error("Redis Error:", err);
          return;
        }
      });
  } catch (error) {
    console.error("Error making GET request:", error.message);
  }
}

app.post("/bidRequest", async (req, res) => {
  redisClient
    .multi()
    .del("bidResponses")
    .set("cnt", 0)
    .exec(async () => {
      const urlList = [
        "http://localhost:3001/processBid",
        "http://localhost:3002/processBid",
        "http://localhost:3003/processBid",
      ];

      try {
        //  Send bid Request Simultaneously
        await Promise.all(urlList.map((url) => getBidResponse(url, {})));

        const sortedData = await redisClient
          .zrevrange("bidResponses", 0, -1)
          .then((result) => {
            return result.map((data) => JSON.parse(data));
          });

        console.log(sortedData);
        res.json(sortedData);
      } catch (error) {
        console.error("Error in handling bid request:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`SSP Server Listening on PORT ${PORT}`);
});
