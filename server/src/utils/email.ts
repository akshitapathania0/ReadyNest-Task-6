import nodemailer from 'nodemailer';
import { logger } from './logger';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    await transporter.sendMail({
      from: `"HRMS" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      ...options,
    });
    logger.info(`Email sent to ${options.to}`);
  } catch (error) {
    logger.error('Email sending failed:', error);
    // Don't throw - email failures shouldn't break app flow
  }
};

export const emailTemplates = {
  welcome: (name: string, email: string, tempPassword: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">Welcome to HRMS!</h2>
      <p>Hi ${name},</p>
      <p>Your account has been created successfully.</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Temporary Password:</strong> ${tempPassword}</p>
      <p>Please login and change your password immediately.</p>
      <p style="color: #666;">This is an automated message, please do not reply.</p>
    </div>
  `,
  passwordReset: (name: string, resetUrl: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">Password Reset Request</h2>
      <p>Hi ${name},</p>
      <p>You requested to reset your password. Click the link below:</p>
      <a href="${resetUrl}" style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
      <p>This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    </div>
  `,
  leaveApproval: (name: string, status: string, leaveType: string, dates: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: ${status === 'APPROVED' ? '#10B981' : '#EF4444'};">Leave Request ${status}</h2>
      <p>Hi ${name},</p>
      <p>Your ${leaveType} leave request for <strong>${dates}</strong> has been <strong>${status.toLowerCase()}</strong>.</p>
    </div>
  `,
  payrollGenerated: (name: string, month: string, netSalary: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">Payslip Generated</h2>
      <p>Hi ${name},</p>
      <p>Your payslip for <strong>${month}</strong> has been generated.</p>
      <p><strong>Net Salary: ${netSalary}</strong></p>
      <p>Login to your account to view and download your payslip.</p>
    </div>
  `,
};
