import redisClient from "./redisClient.js";

import { aggregateViralPosts } from "../controllers/PostsController.js";
async function cacheViralPosts() {
  try {
    const findVirals = await aggregateViralPosts();
    await redisClient.del("viral_posts");
    await redisClient.setEx(
      "viral_posts",
      60 * 60 * 24,
      JSON.stringify(findVirals)
    );
  } catch (err) {
    console.log(err);
  }
}

export default cacheViralPosts;
