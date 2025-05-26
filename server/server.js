import express from "express";
import { initSocketIO } from "./socket.js";
import session from "express-session";
import cookieParser from "cookie-parser";
import posts from "./routes/posts.js";
import auth from "./routes/auth.js";
import users from "./routes/users.js";
import { __uploads } from "./config.js";
import { createServer } from "http";
import comments from "./routes/comments.js";
import chats from "./routes/chats.js";
import MongoStore from "connect-mongo";
import { handleErrors } from "./middlewares/errorHandler.js";
import "./redis/cahceSchedule.js";
import { connectDB, MONGODB_URI } from "./utils/connectDb.js";

import {
  LoadImage,
  throwError,
  LoadMeowment,
  LoadVideo,
} from "./utils/helperFunctions.js";

const SESSION_SECRET = process.env.SESSION_SECRET || "";
const COOKIE_SECRET = process.env.COOKIE_SECRET || "";
const PORT = process.env.PORT || 3000;
const app = express();
const server = createServer(app);
initSocketIO(server);

connectDB(); //db connection

const sessionMiddleware = session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGODB_URI,
    collectionName: "sessions",
  }),
  cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 * 3, httpOnly: true },
});
app.use(sessionMiddleware);

app.use(cookieParser(COOKIE_SECRET));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/posts", posts);
app.use("/posts/:post_id/comments", comments);

app.use("/users", users);
app.use("/auth", auth);
app.use("/chats", chats);
app.get("/loadImage/:type/:id", LoadImage);
app.get("/LoadMeowment/:id/:key", LoadMeowment);
app.get("/loadVideo/:type/:id", LoadVideo);

app.use(handleErrors);
server.listen(PORT);
export { sessionMiddleware };
