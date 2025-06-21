import { Server } from "socket.io";
import { sessionMiddleware } from "./server.js";
import redisClient from "./redis/redisClient.js";
let io;
const usersSockets = new Map();

export function initSocketIO(server) {
  io = new Server(server, {
    transports: ["websocket", "polling"],
  });

  io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
  });

  io.on("connection", (socket) => {
    const session = socket.request.session;
    if (!session?.user_id) {
      return socket.disconnect(true);
    }

    console.log(`User connected: ${session.user_id} (${session.userTag})`);

    // Track users by userTag for easier call routing
    if (session.userTag) {
      // userTag already has @ prefix from database, use as-is
      const cleanUserTag = session.userTag;

      if (!usersSockets.has(cleanUserTag)) {
        usersSockets.set(cleanUserTag, new Set());
      }
      usersSockets.get(cleanUserTag).add(socket.id);

      // Automatically join user's notification room
      socket.join(cleanUserTag);
      console.log(
        `User ${session.userTag} joined their notification room: ${cleanUserTag}`
      );

      // Log all rooms this user is in
      socket.rooms.forEach((room) => {
        console.log(`User ${session.userTag} is in room: ${room}`);
      });
    }

    socket.on("joinPostRoom", (postId) => {
      socket.join(postId);
    });

    socket.on("joinCommentRoom", (commentId) => {
      socket.join(commentId);
    });

    socket.on("joinNotificationsRoom", (userTag) => {
      // userTag should already have @ prefix, use as-is
      const cleanUserTag = userTag;
      socket.join(cleanUserTag);
      console.log(
        `User ${session.userTag} joined notifications room: ${cleanUserTag}`
      );

      // Log updated room membership
      socket.rooms.forEach((room) => {
        console.log(`User ${session.userTag} is now in room: ${room}`);
      });
    });

    socket.on("joinChatRoom", (chatRoom) => {
      if (!chatRoom) return;
      const chatRoomUsers = new Set(chatRoom.split("@").filter(Boolean));
      const currentUserTag = session.userTag.replace("@", "");
      if (!chatRoomUsers.has(currentUserTag)) {
        console.log("Access denied: You don't belong in this chat room.");
        return;
      }

      socket.join(chatRoom);
      console.log(`User ${session.userTag} joined room ${chatRoom}`);
    });

    socket.on("leaveChatRoom", (chatRoom) => {
      console.log(`User ${session.userTag} left room ${chatRoom}`);
      socket.leave(chatRoom);
    });

    // WebRTC Call Events
    socket.on("initiateCall", (data) => {
      const { targetUserTag, callerInfo } = data;
      console.log(`\n📞 CALL INITIATION:`);
      console.log(`From: ${session.userTag}`);
      console.log(`To: ${targetUserTag}`);
      console.log(`Caller info:`, callerInfo);

      // targetUserTag should already have @ prefix, use as-is
      const cleanTargetUserTag = targetUserTag;

      // Check if target user is online
      const targetUserSockets = usersSockets.get(cleanTargetUserTag);
      console.log(
        `Target user ${cleanTargetUserTag} sockets:`,
        targetUserSockets
      );
      console.log(`Target user online: ${targetUserSockets ? "YES" : "NO"}`);

      // Check if target user is in their notification room
      const targetRoom = io.sockets.adapter.rooms.get(cleanTargetUserTag);
      console.log(`Target room ${cleanTargetUserTag} exists:`, !!targetRoom);
      console.log(
        `Target room ${cleanTargetUserTag} members:`,
        targetRoom ? Array.from(targetRoom) : "NONE"
      );

      // Log all connected users
      console.log(`All connected users:`, Array.from(usersSockets.keys()));

      // Emit to the target user's notification room
      io.to(cleanTargetUserTag).emit("incomingCall", {
        callerUserTag: session.userTag,
        callerInfo: callerInfo,
        callId: `${session.userTag}-${cleanTargetUserTag}-${Date.now()}`,
      });

      console.log(`✅ Emitted incomingCall to room: ${cleanTargetUserTag}`);
      console.log(`📞 CALL INITIATION COMPLETE\n`);
    });

    socket.on("answerCall", (data) => {
      const { callerUserTag, answer } = data;
      console.log(`\n📞 CALL ANSWERED:`);
      console.log(`By: ${session.userTag}`);
      console.log(`From: ${callerUserTag}`);
      console.log(`Answer: ${answer ? "ACCEPTED" : "REJECTED"}`);

      // callerUserTag should already have @ prefix, use as-is
      const cleanCallerUserTag = callerUserTag;

      // Check if caller is online
      const callerSockets = usersSockets.get(cleanCallerUserTag);
      console.log(`Caller ${cleanCallerUserTag} sockets:`, callerSockets);
      console.log(`Caller online: ${callerSockets ? "YES" : "NO"}`);

      // Emit back to the caller's notification room
      io.to(cleanCallerUserTag).emit("callAnswered", {
        answererUserTag: session.userTag,
        answer: answer,
      });

      console.log(`✅ Emitted callAnswered to room: ${cleanCallerUserTag}`);
      console.log(`📞 CALL ANSWER COMPLETE\n`);
    });

    socket.on("endCall", (data) => {
      const { targetUserTag } = data;
      console.log(`\n📞 CALL ENDED:`);
      console.log(`By: ${session.userTag}`);
      console.log(`With: ${targetUserTag}`);

      // targetUserTag should already have @ prefix, use as-is
      const cleanTargetUserTag = targetUserTag;

      // Emit to the other participant's notification room
      io.to(cleanTargetUserTag).emit("callEnded", {
        endedBy: session.userTag,
      });

      console.log(`✅ Emitted callEnded to room: ${cleanTargetUserTag}`);
      console.log(`📞 CALL END COMPLETE\n`);
    });

    socket.on("iceCandidate", (data) => {
      const { targetUserTag, candidate } = data;
      // targetUserTag should already have @ prefix, use as-is
      const cleanTargetUserTag = targetUserTag;
      io.to(cleanTargetUserTag).emit("iceCandidate", {
        fromUserTag: session.userTag,
        candidate: candidate,
      });
    });

    socket.on("offer", (data) => {
      const { targetUserTag, offer } = data;
      // targetUserTag should already have @ prefix, use as-is
      const cleanTargetUserTag = targetUserTag;
      io.to(cleanTargetUserTag).emit("offer", {
        fromUserTag: session.userTag,
        offer: offer,
      });
    });

    socket.on("answer", (data) => {
      const { targetUserTag, answer } = data;
      // targetUserTag should already have @ prefix, use as-is
      const cleanTargetUserTag = targetUserTag;
      io.to(cleanTargetUserTag).emit("answer", {
        fromUserTag: session.userTag,
        answer: answer,
      });
    });

    socket.on("disconnect", () => {
      console.log(`\n👤 USER DISCONNECTED:`);
      console.log(`User ID: ${session.user_id}`);
      console.log(`User Tag: ${session.userTag}`);

      if (session.userTag) {
        // userTag already has @ prefix, use as-is
        const cleanUserTag = session.userTag;
        if (usersSockets.has(cleanUserTag)) {
          usersSockets.get(cleanUserTag).delete(socket.id);
          if (usersSockets.get(cleanUserTag).size === 0) {
            usersSockets.delete(cleanUserTag);
            console.log(`Removed user ${cleanUserTag} from tracking`);
          } else {
            console.log(
              `User ${cleanUserTag} still has ${
                usersSockets.get(cleanUserTag).size
              } active connections`
            );
          }
        }
      }

      console.log(`👤 DISCONNECT COMPLETE\n`);
    });
  });
}

function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}

export { getIO, usersSockets };
