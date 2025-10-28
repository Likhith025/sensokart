import nodemailer from 'nodemailer';
import User from '../models/Users.js'; // Import User model to get admin emails

// Create transporter - Simple approach like OTP file
export const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,  // Use SSL port instead of 587
    secure: true,  // true for port 465
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    // Render-specific settings
    connectionTimeout: 30000, // Increase timeout
    socketTimeout: 30000,
    greetingTimeout: 10000,
    tls: {
      rejectUnauthorized: false // Important for Render
    }
  });
};
// Email templates - ALL YOUR ORIGINAL TEMPLATES
export const emailTemplates = {
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
          <div class="header">
            <h1>Welcome to the Admin Team!</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${name}</strong>,</p>
            
            <p>You have been added as an administrator to our system. Below are your login credentials:</p>
            
            <div class="credentials">
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Password:</strong> ${password}</p>
              <p><strong>Login URL:</strong> ${process.env.FRONTEND_URL}/login</p>
            </div>

            <p><strong>Important Security Notes:</strong></p>
            <ul>
              <li>Please change your password immediately after first login</li>
              <li>Keep your credentials secure and do not share them</li>
              <li>Use the admin dashboard to manage products, categories, and user enquiries</li>
            </ul>

            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/login" class="button">
                Login to Admin Dashboard
              </a>
            </div>

            <p>If you have any questions or need assistance, please contact the system administrator.</p>
            
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  profileUpdated: (name, updatedFields) => ({
    subject: 'Your Profile Has Been Updated',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .changes { background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #059669; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Profile Updated Successfully</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${name}</strong>,</p>
            
            <p>Your admin profile has been successfully updated. Here are the changes made:</p>
            
            <div class="changes">
              ${Object.entries(updatedFields).map(([field, value]) => 
                `<p><strong>${field.charAt(0).toUpperCase() + field.slice(1)}:</strong> ${value}</p>`
              ).join('')}
            </div>

            <p>If you did not make these changes, please contact the system administrator immediately.</p>
            
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  newQuoteNotification: (enquiry, products) => ({
    subject: `New Quote Request Received - ${enquiry.enquiryNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 700px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-card { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .product-card { background: white; padding: 15px; border-radius: 6px; border: 1px solid #e5e7eb; margin: 10px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; font-weight: bold; }
          .badge { display: inline-block; padding: 4px 12px; background: #10b981; color: white; border-radius: 20px; font-size: 12px; font-weight: bold; }
          .total-section { background: #1f2937; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 New Quote Request Received!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Sensokart - Industrial Automation Solutions</p>
          </div>
          
          <div class="content">
            <div class="info-card">
              <h2 style="margin-top: 0; color: #1f2937;">Quote Details</h2>
              <p><strong>Enquiry Number:</strong> <span style="font-family: monospace; font-weight: bold; color: #667eea;">${enquiry.enquiryNumber}</span></p>
              <p><strong>Submitted:</strong> ${new Date(enquiry.createdAt).toLocaleString()}</p>
              <p><strong>Status:</strong> <span class="badge">Pending</span></p>
            </div>

            <div class="info-card">
              <h3 style="color: #1f2937; margin-top: 0;">Customer Information</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                  <p><strong>Name:</strong><br>${enquiry.name}</p>
                  <p><strong>Email:</strong><br>${enquiry.email}</p>
                </div>
                <div>
                  <p><strong>Phone:</strong><br>${enquiry.phone}</p>
                  <p><strong>Country:</strong><br>${enquiry.country}</p>
                </div>
              </div>
              ${enquiry.message ? `
                <div style="margin-top: 15px; padding: 15px; background: #f3f4f6; border-radius: 6px;">
                  <strong>Customer Message:</strong><br>
                  <p style="margin: 8px 0 0 0; font-style: italic;">"${enquiry.message}"</p>
                </div>
              ` : ''}
            </div>

            <div class="info-card">
              <h3 style="color: #1f2937; margin-top: 0;">Requested Products (${products.length})</h3>
              ${products.map((item, index) => {
                const product = item.productData || item.product;
                const productName = product?.name || 'Unknown Product';
                const productSku = product?.sku || 'N/A';
                const productImage = product?.coverPhoto || product?.images?.[0] || '';
                const productPrice = product?.salePrice || product?.price || 0;
                const quantity = item.quantity || 1;
                const total = productPrice * quantity;
                
                return `
                  <div class="product-card">
                    <div style="display: flex; align-items: center; gap: 15px;">
                      ${productImage ? `
                        <img src="${productImage}" alt="${productName}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 6px; border: 1px solid #e5e7eb;">
                      ` : ''}
                      <div style="flex: 1;">
                        <h4 style="margin: 0 0 5px 0; color: #1f2937;">${productName}</h4>
                        <p style="margin: 0; color: #6b7280; font-size: 14px;">SKU: ${productSku}</p>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                          <span style="font-weight: bold; color: #059669;">₹${productPrice.toLocaleString('en-IN')}</span>
                          <span style="color: #6b7280;">Qty: ${quantity}</span>
                          <span style="font-weight: bold; color: #1f2937;">Total: ₹${total.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
              
              <div class="total-section">
                <h3 style="margin: 0; color: white;">Total Quote Value</h3>
                <p style="font-size: 24px; font-weight: bold; margin: 10px 0 0 0; color: #10b981;">
                  ₹${products.reduce((total, item) => {
                    const product = item.productData || item.product;
                    const price = product?.salePrice || product?.price || 0;
                    const quantity = item.quantity || 1;
                    return total + (price * quantity);
                  }, 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL}/adminquotes" class="button">
                📋 View Quote in Admin Panel
              </a>
            </div>

            <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e; text-align: center;">
                <strong>⚠️ Action Required:</strong> Please respond to this quote request within 24 hours.
              </p>
            </div>

            <div class="footer">
              <p>This is an automated notification from Sensokart Quote System.</p>
              <p>Please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
};

// Send email function - Simple approach like OTP file
export const sendEmail = async (to, subject, html) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Sensokart Quotes" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Get all admin emails
export const getAdminEmails = async () => {
  try {
    const admins = await User.find({ 
      role: 'Admin', 
      isActive: true 
    }).select('email');
    
    return admins.map(admin => admin.email);
  } catch (error) {
    console.error('Error fetching admin emails:', error);
    return [];
  }
};

// Send welcome email to new admin
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