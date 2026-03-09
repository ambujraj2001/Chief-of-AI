import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import nodemailer from "nodemailer";

export const sendEmailTool = new DynamicStructuredTool({
  name: "send_email",
  description:
    "Send an email to a specific address with a subject and message. ALWAYS call this tool when the user explicitly asks to send an email. Do NOT reply manually or confirm without actually using the tool.",
  schema: z.object({
    to: z.string().describe("The recipient's email address"),
    subject: z.string().describe("The subject of the email"),
    message: z.string().describe("The body of the email (text or HTML)"),
  }),
  func: async ({ to, subject, message }) => {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const fromName = process.env.SMTP_SENDER_NAME || "Chief of AI";
      const fromEmail = process.env.SMTP_SENDER_EMAIL || process.env.SMTP_USER;

      const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject,
        text: message.replace(/<[^>]*>?/gm, ""), // Basic HTML to text fallback
        html: `
          <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #0f172a; margin: 0; font-size: 20px; font-weight: 800;">${subject}</h2>
            </div>
            <div style="color: #1e293b; line-height: 1.6; font-size: 16px;">
              ${message}
            </div>
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 32px 0;" />
            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">Sent via Chief of AI Automation</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      return `Email sent successfully to ${to}.`;
    } catch (error: any) {
      return `Failed to send email: ${error.message}`;
    }
  },
});
