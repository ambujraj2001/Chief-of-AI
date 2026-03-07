import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendOTP = async (email: string, otp: string) => {
  const fromName = process.env.SMTP_SENDER_NAME || "Chief of AI";
  const fromEmail = process.env.SMTP_SENDER_EMAIL || process.env.SMTP_USER;

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: email,
    subject: "Your Access Code Recovery OTP",
    text: `Your OTP for access code recovery is ${otp}. It will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">Chief of AI</h2>
        <p>Hello,</p>
        <p>You requested an OTP for access code recovery. Please use the following code to proceed:</p>
        <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #007bff; border-radius: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This code will expire in <strong>10 minutes</strong>.</p>
        <p>If you did not request this, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #777; text-align: center;">&copy; 2026 Chief of AI. All rights reserved.</p>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
};

export const sendReminderEmail = async (
  email: string,
  title: string,
  remindAt: string,
) => {
  const fromName = process.env.SMTP_SENDER_NAME || "Chief of AI";
  const fromEmail = process.env.SMTP_SENDER_EMAIL || process.env.SMTP_USER;

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: email,
    subject: `Reminder: ${title}`,
    text: `This is a reminder for: ${title} scheduled at ${remindAt}.`,
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; padding: 12px; background-color: #137fec; border-radius: 12px; margin-bottom: 12px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </div>
          <h2 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 800;">Reminder Notification</h2>
        </div>
        
        <div style="background-color: #f8fafc; padding: 24px; border-radius: 8px; margin-bottom: 24px;">
            <p style="color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 8px 0;">Subject</p>
            <h3 style="color: #1e293b; margin: 0 0 16px 0; font-size: 18px; font-weight: 700;">${title}</h3>
            
            <p style="color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 8px 0;">Scheduled for</p>
            <p style="color: #1e293b; margin: 0; font-size: 16px; font-weight: 500;">${new Date(remindAt).toLocaleString()}</p>
        </div>

        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/dashboard/calendar" style="display: inline-block; background-color: #137fec; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px;">View Calendar</a>
        </div>

        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 32px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">&copy; 2026 Chief of AI. Stay productive.</p>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
};

export const sendRoutineResultEmail = async (
  email: string,
  routineName: string,
  result: string,
) => {
  const fromName = process.env.SMTP_SENDER_NAME || "Chief of AI";
  const fromEmail = process.env.SMTP_SENDER_EMAIL || process.env.SMTP_USER;

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: email,
    subject: `AI Routine: ${routineName}`,
    text: `Your routine "${routineName}" has completed. Result:\n\n${result}`,
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; padding: 12px; background-color: #1a1b1e; border-radius: 12px; margin-bottom: 12px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
            </svg>
          </div>
          <h2 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 800;">Routine Result</h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Automated report for "${routineName}"</p>
        </div>
        
        <div style="background-color: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #f1f5f9; margin-bottom: 24px;">
            <div style="line-height: 1.6; color: #1e293b; font-size: 15px; white-space: pre-wrap;">${result.replace(/\n\n/g, "<br/><br/>")}</div>
        </div>

        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/dashboard/routines" style="display: inline-block; background-color: #1a1b1e; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px;">View All Routines</a>
        </div>

        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 32px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">Sent via Chief of AI Automation Hub</p>
      </div>
    `,
  };

  return await transporter.sendMail(mailOptions);
};
