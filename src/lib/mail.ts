import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendVerificationEmail(email: string, code: string) {
  await transporter.sendMail({
    from: `"Beyond Panels" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Your Beyond Panels Verification Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 2px solid #1a3a5c; border-radius: 8px;">
        <h1 style="color: #1a3a5c; font-size: 24px; margin: 0 0 16px;">Beyond Panels</h1>
        <p style="color: #333; font-size: 14px; line-height: 1.6;">Your verification code is:</p>
        <div style="background: #f5f5f5; padding: 16px; text-align: center; border-radius: 6px; margin: 16px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a3a5c;">${code}</span>
        </div>
        <p style="color: #666; font-size: 12px;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
}
