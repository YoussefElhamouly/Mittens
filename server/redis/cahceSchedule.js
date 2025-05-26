import cachePersonalizedPosts from "./cachePresonalizedPosts.js";
import cacheViralPosts from "./cachedViralPosts.js";

// cachePersonalizedPosts();

// setInterval(
//   cachePersonalizedPosts
// , 1000 * 60 * 60 * 2);

cacheViralPosts();
setInterval(cacheViralPosts, 60 * 60 * 1000 * 24);
