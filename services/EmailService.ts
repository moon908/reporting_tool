import * as nodemailer from "nodemailer";

export class EmailService {
  private static getTransporter() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !port || !user || !pass) {
      console.warn("SMTP settings are incomplete. Emails will be logged to console in simulated mode.");
      return null;
    }

    return nodemailer.createTransport({
      host,
      port: parseInt(port, 10),
      auth: {
        user,
        pass,
      },
    });
  }

  static async sendEmail(params: {
    to: string | string[];
    subject: string;
    text: string;
    html?: string;
    attachments?: Array<{
      filename: string;
      content: Buffer | string;
      contentType?: string;
    }>;
  }): Promise<boolean> {
    const transporter = this.getTransporter();
    const from = process.env.SMTP_FROM || "reports@acme.com";

    const mailOptions = {
      from,
      to: Array.isArray(params.to) ? params.to.join(",") : params.to,
      subject: params.subject,
      text: params.text,
      html: params.html || `<p>${params.text.replace(/\n/g, "<br>")}</p>`,
      attachments: params.attachments,
    };

    if (!transporter) {
      console.log("=== SIMULATED EMAIL SENT ===");
      console.log(`From:    ${mailOptions.from}`);
      console.log(`To:      ${mailOptions.to}`);
      console.log(`Subject: ${mailOptions.subject}`);
      console.log(`Text:    ${mailOptions.text}`);
      if (mailOptions.attachments) {
        console.log(`Attachments: ${mailOptions.attachments.map((a) => a.filename).join(", ")}`);
      }
      console.log("=============================");
      return true;
    }

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Email successfully sent to ${mailOptions.to}`);
      return true;
    } catch (error) {
      console.error("Failed to send email via SMTP transporter:", error);
      return false;
    }
  }

  static async sendReportEmail(params: {
    to: string[];
    subject: string;
    message: string;
    attachmentFilename: string;
    attachmentContent: Buffer;
  }) {
    return this.sendEmail({
      to: params.to,
      subject: params.subject,
      text: params.message,
      attachments: [
        {
          filename: params.attachmentFilename,
          content: params.attachmentContent,
        },
      ],
    });
  }

  static async sendVerificationEmail(email: string, code: string) {
    return this.sendEmail({
      to: email,
      subject: "Verify Your Email - Acme Analytics",
      text: `Hello,\n\nYour email verification code is: ${code}\n\nIt expires in 1 hour. If you did not request this, please ignore.`,
      html: `
        <h2>Verify Your Email</h2>
        <p>Hello,</p>
        <p>Thank you for registering. Use the code below to complete your registration process:</p>
        <div style="font-size: 24px; font-weight: bold; background: #f1f5f9; padding: 12px 20px; display: inline-block; border-radius: 6px; letter-spacing: 2px;">
          ${code}
        </div>
        <p>This code will expire in 1 hour.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">If you did not sign up for this account, you can safely ignore this email.</p>
      `,
    });
  }

  static async sendPasswordResetEmail(email: string, resetLink: string) {
    return this.sendEmail({
      to: email,
      subject: "Reset Your Password - Acme Analytics",
      text: `Hello,\n\nWe received a request to reset your password. You can reset it by clicking the link below:\n\n${resetLink}\n\nIf you did not request a password reset, you can ignore this email.`,
      html: `
        <h2>Reset Your Password</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password. Click the button below to set a new password:</p>
        <a href="${resetLink}" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          Reset Password
        </a>
        <p>Or copy and paste this link in your browser:</p>
        <p>${resetLink}</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">If you did not request a password reset, you can safely ignore this email.</p>
      `,
    });
  }
}
