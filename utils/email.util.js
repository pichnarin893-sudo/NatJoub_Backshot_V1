const nodemailer = require("nodemailer");

// Debug: Log email configuration (mask password for security)
console.log('📧 Email Configuration:');
console.log('  EMAIL_USER:', process.env.EMAIL_USER);
console.log('  EMAIL_PASS:', process.env.EMAIL_PASS ? `${process.env.EMAIL_PASS.substring(0, 4)}...${process.env.EMAIL_PASS.substring(process.env.EMAIL_PASS.length - 4)} (length: ${process.env.EMAIL_PASS.length})` : 'NOT SET');

// Create a transporter for sending emails via Gmail
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use STARTTLS
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false // Accept self-signed certificates (for Railway compatibility)
    }
});

// Verify SMTP connection on startup
transporter.verify(function (error, success) {
    if (error) {
        console.error('❌ SMTP Connection Error:', error.message);
        console.error('   Make sure EMAIL_USER and EMAIL_PASS are set correctly');
    } else {
        console.log('✅ SMTP Server is ready to send emails');
    }
});

/**
 * Send OTP email via Gmail
 * @param {string} to - Recipient email address
 * @param {string} otp - OTP code to send
 * @returns {Promise<boolean>} - Success status
 */
async function sendOTPEmail(to, otp) {
    try {
        const mailOptions = {
            from: `"NatJoub - ណាត់ជួប" <${process.env.EMAIL_USER}>`,
            to,
            subject: "Your OTP Authentication Code",
            text: `Your OTP code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nIf you did not request this code, please ignore this email.`,
            html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
          <!-- Header -->
          <div style="background-color: #003366; padding: 20px; text-align: center; border-top-left-radius: 5px; border-top-right-radius: 5px;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Nat Joub Smart System</h1>
          </div>
          
          <!-- Content -->
          <div style="background-color: #ffffff; padding: 30px 20px;">
            <h2 style="color: #003366; margin-top: 0;">Authentication Code</h2>
            <p style="color: #555555; font-size: 16px;">Your one-time password (OTP) is:</p>
            
            <div style="text-align: center; margin: 25px 0;">
              <div style="display: inline-block; background-color: #f0f5ff; border: 2px solid #e6eeff; border-radius: 8px; padding: 15px 25px;">
                <h1 style="color: #cc0000; letter-spacing: 5px; margin: 0; font-size: 32px; font-weight: 700;">${otp}</h1>
              </div>
            </div>
            
            <p style="color: #555555; font-size: 16px;">This code will expire in <strong>5 minutes</strong>.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e6eeff;">
              <p style="color: #777777; font-size: 14px;">If you did not request this code, please disregard this email.</p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f0f5ff; padding: 15px; text-align: center; border-bottom-left-radius: 5px; border-bottom-right-radius: 5px;">
            <p style="color: #003366; margin: 0; font-size: 12px;">© ${new Date().getFullYear()} Nat Joub Management System</p>
          </div>
        </div>
      `
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Failed to send OTP email:', error);
        return false;
    }
}

/**
 * Send registration OTP email
 * @param {string} email - Recipient email address
 * @param {string} username - User's username
 * @param {string} otp - 6-digit OTP code
 */
async function sendRegistrationOTP(email, username, otp) {
    try {
        const mailOptions = {
            from: `"${process.env.APP_NAME || 'Your App'}" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Verify Your Email Address',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                        }
                        .header {
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            padding: 30px;
                            text-align: center;
                            border-radius: 10px 10px 0 0;
                        }
                        .content {
                            background: #f9f9f9;
                            padding: 30px;
                            border-radius: 0 0 10px 10px;
                        }
                        .otp-box {
                            background: white;
                            border: 2px solid #667eea;
                            border-radius: 10px;
                            padding: 20px;
                            text-align: center;
                            margin: 20px 0;
                        }
                        .otp-code {
                            font-size: 32px;
                            font-weight: bold;
                            letter-spacing: 8px;
                            color: #667eea;
                            margin: 10px 0;
                        }
                        .warning {
                            background: #fff3cd;
                            border-left: 4px solid #ffc107;
                            padding: 15px;
                            margin: 20px 0;
                            border-radius: 5px;
                        }
                        .footer {
                            text-align: center;
                            color: #666;
                            font-size: 12px;
                            margin-top: 30px;
                            padding-top: 20px;
                            border-top: 1px solid #ddd;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>🎉 Welcome to ${process.env.APP_NAME || 'Our App'}!</h1>
                    </div>
                    <div class="content">
                        <h2>Hello ${username},</h2>
                        <p>Thank you for registering! To complete your registration and verify your email address, please use the verification code below:</p>
                        
                        <div class="otp-box">
                            <p style="margin: 0; color: #666; font-size: 14px;">Your Verification Code</p>
                            <div class="otp-code">${otp}</div>
                            <p style="margin: 0; color: #999; font-size: 12px;">This code will expire in 5 minutes</p>
                        </div>

                        <p>Enter this code in the app to activate your account and start using our services.</p>

                        <div class="warning">
                            <strong>⚠️ Security Notice:</strong><br>
                            • Never share this code with anyone<br>
                            • We will never ask for this code via phone or email<br>
                            • If you didn't request this code, please ignore this email
                        </div>

                        <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>

                        <p>Best regards,<br>
                        <strong>The ${process.env.APP_NAME || 'Your App'} Team</strong></p>
                    </div>
                    <div class="footer">
                        <p>This is an automated message, please do not reply to this email.</p>
                        <p>&copy; ${new Date().getFullYear()} ${process.env.APP_NAME || 'Your App'}. All rights reserved.</p>
                    </div>
                </body>
                </html>
            `,
            // Plain text version for email clients that don't support HTML
            text: `
Hello ${username},

Thank you for registering with ${process.env.APP_NAME || 'Our App'}!

Your verification code is: ${otp}

This code will expire in 5 minutes.

Please enter this code in the app to verify your email address and complete your registration.

Never share this code with anyone. If you didn't request this code, please ignore this email.

Best regards,
The ${process.env.APP_NAME || 'Your App'} Team
            `.trim()
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Registration OTP email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending registration OTP email:', error);
        throw new Error('Failed to send verification email');
    }
}

module.exports = {
    sendRegistrationOTP,
    sendOTPEmail
};

/*
TROUBLESHOOTING GMAIL SENDING ERRORS:
- Make sure EMAIL_USER is your Gmail address.
- EMAIL_PASS must be a valid Gmail App Password (not your normal password).
  - Generate one at https://myaccount.google.com/apppasswords
  - Use the 16-character password (with or without spaces).
- If you get "Invalid login" or "Application-specific password required":
  - Double-check the App Password and that 2-Step Verification is enabled.
- If you see "Less secure app blocked" or "Access denied":
  - You must use an App Password; Google no longer allows normal passwords.
- Check your Google Account security settings if you have issues.
*/