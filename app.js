import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import { EventEmitter } from "events";
import { getHealthStatus } from "./healthcheck.js";

// Routes
import transferRoutes from "./routes/transferRoutes.js";
import userRoutes from "./routes/user.js";
import BillRouter from "./routes/bbps.js";
import beneficiaryRoutes from "./routes/beneficiaryRoute.js";
import cashfreeRoutes from "./routes/CashfreeRoutes.js";
import paymentRoutes from "./routes/paymentRoute.js";
import bankAccountVerificationRoutes from "./routes/bankAccountVarification.js";
import walletRoutes from "./routes/walletRoutes.js";

// Services for Nodemailer OTP
import { sendOtpEmail } from "./services/emailService.js";
import { createOtp as generateOtp } from "./services/otpService.js"; // Utils

dotenv.config();
EventEmitter.defaultMaxListeners = 20;

const app = express();
const PORT = process.env.PORT || 3000;

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "x-client-id",
      "x-client-secret",
      "x-api-version",
      "Authorization",
    ],
  })
);

// Serve static assets
app.use("/assets", express.static(path.join(__dirname, "assets")));

// API Routes
app.use("/", BillRouter);
app.use("/api/users", userRoutes);
app.use("/api/transfer", transferRoutes);
app.use("/api/beneficiary", beneficiaryRoutes);
app.use("/api/cashfree", cashfreeRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/bank-verification", bankAccountVerificationRoutes);
app.use("/api/wallets", walletRoutes);

// OTP Endpoint for Email
app.post("/api/send-otp-email", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    const otp = generateOtp(email);
    await sendOtpEmail(email, "User", otp);

    res.json({ success: true, message: `OTP sent to ${email}` });
  } catch (error) {
    console.error(error.stack);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Health Endpoint
app.get("/health", async (req, res) => {
  try {
    const status = await getHealthStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ message: "Health check failed", error: err.message });
  }
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
