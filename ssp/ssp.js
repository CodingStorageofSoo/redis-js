require("dotenv").config();
const { SSP_PORT, DSP_PORT, REDIS_PORT } = process.env;

const express = require("express");
const app = express();
app.use(express.json());

const axios = require("axios");

const Redis = require("ioredis");
const redisClient = new Redis({
  host: "redis-server",
  port: REDIS_PORT,
});

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

app.post("/bidRequest/:people", async (req, res) => {
  const people = req.params.people;
  const urlList = [];
  for (let i = 0; i < people; i++) {
    urlList.push(`http://dsp-server:${DSP_PORT}/processBid/${i}`);
  }
  redisClient
    .multi()
    .del("bidResponses")
    .set("cnt", 0)
    .exec(async () => {
      try {
        //  Send bid Request Simultaneously
        await Promise.all(urlList.map((url) => getBidResponse(url, {})));

        const ranking = await redisClient
          .zrevrange("bidResponses", 0, -1)
          .then((result) => {
            return result.map((data) => JSON.parse(data));
          });

        console.log(ranking);
        res.json(ranking);
      } catch (error) {
        console.error("Error in handling bid request:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });
});

app.listen(SSP_PORT, async () => {
  console.log(`SSP Server Listening on PORT ${SSP_PORT}`);
});
