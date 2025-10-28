import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import User from '../models/Users.js';

// ======================
// EMAIL CONFIGURATION
// ======================

let transporter = null;

export const createTransporter = () => {
  if (transporter) return transporter;

  const user = process.env.EMAIL_USER || process.env.MAIL_USER;
  const pass = process.env.EMAIL_PASS || process.env.MAIL_PASS;

  console.log('Email Config:', { user: user ? 'set' : 'missing', hasPass: !!pass });

  if (!user || !pass) {
    console.error('EMAIL CREDENTIALS MISSING');
    throw new Error('Email credentials (EMAIL_USER/EMAIL_PASS or MAIL_USER/MAIL_PASS) not configured');
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
    // Optional: Add connection timeout for reliability
    // connectionTimeout: 10000,
  });

  return transporter;
};

// ======================
// EMAIL TEMPLATES
// ======================

export const emailTemplates = {
  // OTP Email
  otp: (otp, purpose = 'Verification') => ({
    subject: `Your OTP for ${purpose}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 30px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; text-align: center; }
          .otp-code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1f2937; margin: 20px 0; padding: 15px; background: #f3f4f6; border-radius: 8px; display: inline-block; }
          .footer { background: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 14px; }
          .btn { display: inline-block; padding: 12px 28px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Secure OTP Code</h1>
          </div>
          <div class="content">
            <p>Use the following One-Time Password to complete your action:</p>
            <div class="otp-code">${otp}</div>
            <p><strong>Expires in 5 minutes</strong></p>
            <p style="color: #6b7280; font-size: 14px;">If you didn't request this, please ignore this email.</p>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Sensokart & Decentralized Voting. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  // Reuse your existing rich templates
  newAdminWelcome: (name, email, password) => ({
    subject: 'Welcome as Admin (Sensokart) - Your Account Has Been Created',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .credentials { background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #2563eb; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>Welcome to the Admin Team!</h1></div>
          <div class="content">
            <p>Hello <strong>${name}</strong>,</p>
            <p>You have been added as an administrator. Here are your login credentials:</p>
            <div class="credentials">
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Password:</strong> ${password}</p>
              <p><strong>Login URL:</strong> ${process.env.FRONTEND_URL}/login</p>
            </div>
            <p><strong>Security Tips:</strong></p>
            <ul>
              <li>Change your password after first login</li>
              <li>Never share your credentials</li>
            </ul>
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/login" class="button">Login to Dashboard</a>
            </div>
            <div class="footer">
              <p>This is an automated message. Do not reply.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  // Add other templates (profileUpdated, newQuoteNotification) here if needed
};

// ======================
// CORE EMAIL SENDER
// ======================

export const sendEmail = async (to, subject, html, fromName = 'Sensokart System') => {
  try {
    const transport = createTransporter();
    const from = `"${fromName}" <${process.env.EMAIL_USER || process.env.MAIL_USER}>`;

    const info = await transport.sendMail({
      from,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
    });

    console.log(`Email sent: ${info.messageId} → ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send email:', error.message);
    return { success: false, error: error.message };
  }
};

// ======================
// OTP SYSTEM
// ======================

export const sendOtpToEmail = async (user, purpose = 'Verification') => {
  const OTP = crypto.randomInt(100000, 999999).toString();
  const salt = await bcrypt.genSalt(10);
  const hashedOtp = await bcrypt.hash(OTP, salt);

  user.otp = {
    code: hashedOtp,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
  };
  await user.save();

  const template = emailTemplates.otp(OTP, purpose);
  await sendEmail(user.email, template.subject, template.html, 'Sensokart OTP');

  return OTP; // Optional: for testing/logging
};

export const verifyOTP = async (user, inputOtp) => {
  if (!user.otp?.code) throw new Error('No OTP pending');
  if (new Date() > new Date(user.otp.expiresAt)) throw new Error('OTP expired');

  const isValid = await bcrypt.compare(inputOtp, user.otp.code);
  if (!isValid) throw new Error('Invalid OTP');

  user.isVerified = true;
  user.otp = undefined;
  await user.save();

  return true;
};

export const checkOtp = async (user, otp) => {
  if (!user.otp?.code) return false;
  if (new Date() > new Date(user.otp.expiresAt)) return false;
  return await bcrypt.compare(otp, user.otp.code);
};

// ======================
// ADMIN EMAIL UTILITIES
// ======================

export const getAdminEmails = async () => {
  try {
    const admins = await User.find({ role: 'Admin', isActive: true }).select('email -_id');
    return admins.map(a => a.email).filter(Boolean);
  } catch (error) {
    console.error('Error fetching admin emails:', error);
    return [];
  }
};

export const sendNewAdminEmail = async (name, email, password) => {
  const template = emailTemplates.newAdminWelcome(name, email, password);
  return await sendEmail(email, template.subject, template.html);
};



// Send profile update notification
export const sendProfileUpdateEmail = async (name, email, updatedFields) => {
  const template = emailTemplates.profileUpdated(name, updatedFields);
  return await sendEmail(email, template.subject, template.html);
};

// Send new quote notification to all admins
export const sendNewQuoteNotification = async (enquiry, products) => {
  try {
    const adminEmails = await getAdminEmails();
    
    if (adminEmails.length === 0) {
      console.warn('No active admin emails found to send quote notification');
      return { success: false, error: 'No admin emails found' };
    }

    const template = emailTemplates.newQuoteNotification(enquiry, products);
    
    // Send to all admins
    const result = await sendEmail(adminEmails.join(','), template.subject, template.html);
    
    return result;
  } catch (error) {
    console.error('Error sending quote notification:', error);
    return { success: false, error: error.message };
  }
};

export default {
  sendEmail,
  sendNewAdminEmail,
  sendProfileUpdateEmail,
  sendNewQuoteNotification,
  getAdminEmails,
  emailTemplates,
};