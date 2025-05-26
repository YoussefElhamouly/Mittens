import { createClient } from "redis";
const redisClient = createClient(process.env.REDIS_PORT);
redisClient
  .connect()
  .then(() => {
    console.log("Connected to Redis");
  })
  .catch((err) => {
    console.error("Redis connection error:", err);
  });

export default redisClient;
