import nodemailer from "nodemailer";
import EmailLog from "../models/EmailLog.js";

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE) === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

export async function sendEmail({ recipientId, to, type, subject, html }) {
  const log = await EmailLog.create({
    recipient: recipientId,
    email: to,
    type,
    subject,
    status: "queued",
  });

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`📧 [Dev Email Mock] To: ${to} | Subject: ${subject}`);
    log.status = "sent";
    log.attempts = 1;
    log.errorMessage = "Dev mock (SMTP credentials not set)";
    await log.save();
    return true;
  }

  try {
    const t = getTransporter();
    await t.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || "MindHaven Support"}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    log.status = "sent";
    log.attempts += 1;
    await log.save();
    return true;
  } catch (error) {
    console.error("Email send failed:", error.message);
    log.status = "failed";
    log.attempts += 1;
    log.errorMessage = error.message;
    await log.save();
    return false;
  }
}

export async function retryFailedEmails() {
  const failed = await EmailLog.find({ status: "failed", attempts: { $lt: 3 } });
  for (const log of failed) {
    // Re-send mail using stored subject/body — we re-run original sendEmail
    // For simplicity we re-mark and attempt a generic resend.
    log.attempts += 1;
    try {
      const t = getTransporter();
      await t.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || "MindHaven Support"}" <${process.env.SMTP_USER}>`,
        to: log.email,
        subject: log.subject,
        html: log.html || "",
      });
      log.status = "sent";
    } catch (error) {
      log.errorMessage = error.message;
    }
    await log.save();
  }
}
