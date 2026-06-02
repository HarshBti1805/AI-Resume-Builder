import { env } from "../config/env";
import logger from "../utils/logger";

// Brevo transactional email over HTTPS (port 443).
// We use the HTTP API instead of SMTP because most PaaS hosts (Render, Vercel,
// etc.) block outbound SMTP ports (25/465/587), which causes connection timeouts.
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

const otpHtml = (otp: string): string => `
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
`;

export const sendOtpEmail = async (to: string, otp: string): Promise<void> => {
  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "api-key": env.BREVO_API_KEY,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: "ChitkaraCV", email: env.EMAIL_FROM },
      to: [{ email: to }],
      subject: "Your ChitkaraCV Verification Code",
      htmlContent: otpHtml(otp),
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    logger.error("❌ Brevo email send failed", { status: res.status, detail });
    throw new Error(`Failed to send OTP email (status ${res.status})`);
  }

  logger.info("OTP email sent", { to });
};
