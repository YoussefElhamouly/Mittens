import Users from "../models/usersSchema.js";
import { Posts } from "../models/postsSchema.js";
import redisClient from "./redisClient.js";
import { postsAggregationStages } from "../controllers/PostsController.js";

async function fetchPersonalizedPostsForUser(user_id) {
  return new Promise(async (resolve, reject) => {
    try {
      let { algoStage, defaultQuery, projectionSatge, reformingStage } =
        await postsAggregationStages(user_id, [], 300);
      const query = [
        ...defaultQuery,
        ...algoStage,
        ...reformingStage,
        ...projectionSatge,
      ];
      const result = await Posts.aggregate(query, {
        allowDiskUse: true,
      });
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
}
async function cachePersonalizedPosts() {
  try {
    const users = await Users.find({}, { user_id: 1 });
    await Promise.all(
      users.map(async (user) => {
        const user_id = user.user_id;
        const posts = await fetchPersonalizedPostsForUser(user_id);
        if (posts && posts.length > 0) {
          await clearCachedPostsForUser(user_id);
          await cachePostsForUser(user_id, posts);
        } else {
          console.log(`No personalized posts found for user: ${user_id}`);
        }
      })
    );
  } catch (error) {
    console.error("Error caching personalized posts:", error);
  }
}

async function cachePostsForUser(user_id, posts) {
  try {
    const cacheKey = `personalized_posts:${user_id}`;
    await redisClient.setEx(cacheKey, 60 * 60 * 2, JSON.stringify(posts));
    console.log(`Cached personalized posts for user: ${user_id}`);
  } catch (error) {
    console.error(`Error caching posts for user ${user_id}:`, error);
  }
}
async function clearCachedPostsForUser(user_id) {
  try {
    const cacheKey = `personalized_posts:${user_id}`;
    await redisClient.del(cacheKey);
    console.log(`Cleared cache for user: ${user_id}`);
  } catch (err) {
    console.error(`Error clearing cache for user ${user_id}:`, err);
  }
}

export default cachePersonalizedPosts;
// cachePersonalizedPosts();
// setInterval(
//   cachePersonalizedPosts
// , 1000 * 60 * 60 * 2);
