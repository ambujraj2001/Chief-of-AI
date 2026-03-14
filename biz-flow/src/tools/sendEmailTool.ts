import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import nodemailer from "nodemailer";

export const sendEmailTool = new DynamicStructuredTool({
  name: "send_email",
  description:
    "Sends an email. Use 'automated' to send silently via the server's SMTP (Brevo). Use 'manual' to open the email draft/pad in the UI for the user to review and send.",
  schema: z.object({
    to: z.string().describe("The recipient's email address"),
    name: z.string().optional().describe("The name of the recipient"),
    subject: z.string().describe("The subject of the email"),
    message: z.string().describe("The body of the email (text or HTML)"),
    type: z
      .enum(["automated", "manual"])
      .default("automated")
      .describe(
        "Whether to send automatically ('automated') or prepare for manual review ('manual').",
      ),
  }),
  func: async ({ to, name, subject, message, type }) => {
    if (type === "manual") {
      return JSON.stringify({
        status: "ready",
        message: `I've prepared the email for ${name || to}. You can review and send it using the button below.`,
        contact: {
          name: name || "Recipient",
          email: to,
          subject: subject,
          body: message,
        },
      });
    }

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
