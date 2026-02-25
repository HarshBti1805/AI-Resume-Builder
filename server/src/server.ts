import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import compression from "compression";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(compression());
app.use(morgan("dev"));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

// Routes (wire up as you build them)
// app.use("/api/auth", authRoutes);
// app.use("/api/resume", resumeRoutes);
// app.use("/api/ai", aiRoutes);
// app.use("/api/upload", uploadRoutes);

app.listen(PORT, () => {
  console.log(`🚀 ChitkaraCV API running on port ${PORT}`);
});

export default app;