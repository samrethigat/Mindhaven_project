import "dotenv/config";
import express from "express";
import http from "http";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { connectDB } from "./config/db.js";
import { corsOptions } from "./config/cors.js";
import { initSocket } from "./socket/index.js";
import { startReminderJob } from "./services/reminderService.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/authRoutes.js";
import counselorRoutes from "./routes/counselorRoutes.js";
import candidateRoutes from "./routes/candidateRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import callRoutes from "./routes/callRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import careRoutes from "./routes/careRoutes.js";
import assessmentRoutes from "./routes/assessmentRoutes.js";
import aiAssistantRoutes from "./routes/aiAssistantRoutes.js";
import musicRoutes from "./routes/musicRoutes.js";
import videoRoutes from "./routes/videoRoutes.js";
import memeRoutes from "./routes/memeRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import parentRoutes from "./routes/parentRoutes.js";

const app = express();
const HTTP_PORT = process.env.PORT || 5000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors(corsOptions()));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date() }));

app.use("/api/auth", authRoutes);
app.use("/api/ai", aiAssistantRoutes);
app.use("/api/music", musicRoutes);
app.use("/api/video", videoRoutes);
app.use("/api/memes", memeRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/parent", parentRoutes);
app.use("/api/counselor", counselorRoutes);
app.use("/api/candidate", candidateRoutes);
app.use("/api/patient", patientRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/calls", callRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/care", careRoutes);
app.use("/api/assessment", assessmentRoutes);

app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);
const io = initSocket(server);
app.set("io", io);

connectDB()
  .then(() => {
    startReminderJob();
    server.listen(HTTP_PORT, () =>
      console.log(`🚀 Server running on http://localhost:${HTTP_PORT}`)
    );
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });

export default app;
