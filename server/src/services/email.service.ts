import nodemailer from "nodemailer";
import { env } from "../config/env";
import logger from "../utils/logger";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: parseInt(env.SMTP_PORT),
  secure: false, // true for 465, false for 587
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

// Verify SMTP connection on startup
transporter
  .verify()
  .then(() => logger.info("✅ SMTP connection ready"))
  .catch((err) => logger.error("❌ SMTP connection failed", { error: err.message }));

export const sendOtpEmail = async (to: string, otp: string): Promise<void> => {
  await transporter.sendMail({
    from: `"ChitkaraCV" <${env.SMTP_USER}>`,
    to,
    subject: "Your ChitkaraCV Verification Code",
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="color: #111; margin-bottom: 4px; font-size: 22px;">ChitkaraCV</h2>
        <p style="color: #666; font-size: 14px; margin-top: 0;">Resume Builder for Chitkara University</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        
        <p style="color: #444; font-size: 15px;">Your verification code is:</p>
        
        <div style="background: #f5f5f5; border-radius: 10px; padding: 24px; text-align: center; margin: 20px 0;">
          <span style="font-size: 36px; font-weight: 700; letter-spacing: 10px; color: #111; font-family: monospace;">
            ${otp}
          </span>
        </div>
        
        <p style="color: #999; font-size: 13px; line-height: 1.5;">
          This code expires in <strong>5 minutes</strong>. Do not share it with anyone.
        </p>
        <p style="color: #999; font-size: 13px;">
          If you didn't request this code, you can safely ignore this email.
        </p>
      </div>
    `,
  });

  logger.info("OTP email sent", { to });
};