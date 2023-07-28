// npm init -y
// npm i ioredis

// redis-server
// redis-cli
// PORT 6379

const Redis = require("ioredis");
const redisClient = new Redis(); // Assuming Redis server is running locally

const axios = require("axios");

redisClient.set("count", 0);

async function makePostRequest(url, data) {
  try {
    const response = await axios.get(url);
    await redisClient.incr("count");
    const countValue = await redisClient.get("count");
    console.log(redisClient.get("count"));
    return [response.data, countValue];
  } catch (error) {
    console.error("Error making POST request:", error.message);
  }
}

async function main() {
  const urlList = [
    "http://localhost:3001/processBid",
    "http://localhost:3002/processBid",
    "http://localhost:3003/processBid",
  ];
  const promises = urlList.map((url) => makePostRequest(url, {}));

  try {
    const responses = await Promise.all(promises);
    responses.forEach((response) => {
      console.log(response);
    });
  } catch (error) {
    console.error("Error in making POST requests:", error.message);
  } finally {
    // Close the Redis connection when done
    redisClient.quit();
  }
}

main().catch((err) => {
  console.error("Error:", err);
});

// // Adding data to the sorted set (just for demonstration)
// redisClient.zadd("mySortedSet", 100, "member1");
// redisClient.zadd("mySortedSet", 90, "member2");
// redisClient.zadd("mySortedSet", 80, "member3");
// // Add more members with their respective scores

// // Retrieve the top 10 elements with the highest scores using zrevrange
// redisClient.zrevrange(
//   "mySortedSet",
//   0,
//   9,
//   "WITHSCORES",
//   (err, membersWithScores) => {
//     if (err) {
//       console.error(err);
//     } else {
//       // The result will be an array alternating between member and score [member1, score1, member2, score2, ...]
//       console.log("Top 10 elements with highest scores:");
//       console.log(membersWithScores);
//     }
//   }
// );
