require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const nodemailer = require('nodemailer');

// Configure Gmail SMTP transporter
// Users should set these environment variables:
//   GMAIL_USER=your-email@gmail.com
//   GMAIL_APP_PASSWORD=your-16-char-app-password
//
// To get an App Password:
// 1. Enable 2FA on your Google Account
// 2. Go to https://myaccount.google.com/apppasswords
// 3. Generate an "App Password" for "Mail"

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || '',
    pass: process.env.GMAIL_APP_PASSWORD || '',
  },
});

const checkConfig = () => !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);

/**
 * Send OTP verification email
 */
async function sendOTPEmail(to, otp, name = 'User') {
  if (!checkConfig()) {
    console.log(`📧 [MAILER] Gmail not configured. OTP for ${to}: ${otp}`);
    console.log('   Set GMAIL_USER and GMAIL_APP_PASSWORD env vars to enable email.');
    return { success: true, simulated: true };
  }

  const htmlTemplate = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin:0;padding:40px 20px;background-color:#F5F5F0;font-family:Georgia,'Times New Roman',Times,serif;">
    <div style="max-width:460px;margin:0 auto;background-color:#FFFFFF;border-radius:12px;padding:48px 44px;text-align:left;border:1px solid #E8E4DE;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
      <div style="font-size:11px;font-weight:700;letter-spacing:3px;color:#9B8B6E;margin-bottom:28px;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
        SpotHai &mdash; Verification
      </div>
      
      <h1 style="color:#1A1A1A;font-size:28px;font-weight:400;margin:0 0 12px;line-height:1.35;font-family:Georgia,'Times New Roman',Times,serif;">
        Your verification code
      </h1>
      
      <p style="color:#6B6B6B;font-size:15px;margin:0 0 32px;line-height:1.7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
        Hi ${name}, please use the code below to verify your email and complete your registration.
      </p>
      
      <div style="background-color:#1A1A1A;border-radius:10px;padding:28px 20px;text-align:center;margin-bottom:28px;">
        <div style="font-size:36px;font-weight:600;letter-spacing:16px;color:#FFFFFF;font-family:'Courier New',Courier,monospace;margin-left:16px;">${otp}</div>
      </div>
      
      <p style="color:#6B6B6B;font-size:14px;margin:0 0 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
        This code is valid for <strong style="color:#1A1A1A;">10 minutes</strong>.
      </p>
      
      <div style="border-top:1px solid #E8E4DE;padding-top:20px;">
        <p style="color:#A0A0A0;font-size:12px;line-height:1.6;margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
          If you did not request this code, no action is needed. This email was sent to you as part of the SpotHai account verification process.
        </p>
      </div>
    </div>
  </body>
  </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"SpotHai Parking" <${process.env.GMAIL_USER}>`,
      to,
      subject: `${otp} is your SpotHai verification code`,
      html: htmlTemplate,
    });
    console.log(`📧 [MAILER] OTP sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`📧 [MAILER] Failed to send OTP to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(to, resetToken, name = 'User') {
  if (!checkConfig()) {
    console.log(`📧 [MAILER] Gmail not configured. Reset token for ${to}: ${resetToken}`);
    return { success: true, simulated: true };
  }

  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

  const htmlTemplate = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin:0;padding:40px 20px;background-color:#1E1E24;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:440px;margin:0 auto;background-color:#FDF4FE;border-radius:24px;padding:48px 40px;text-align:left;border:1px solid #F3E5F3;">
      <div style="font-size:12px;font-weight:800;letter-spacing:2px;color:#A67B27;margin-bottom:24px;text-transform:uppercase;">
        Spot Hai Support
      </div>
      
      <h1 style="color:#1E1B24;font-size:32px;font-weight:800;margin:0 0 16px;line-height:1.2;letter-spacing:-0.5px;">
        Reset password<br>request
      </h1>
      
      <p style="color:#5C5265;font-size:16px;margin:0 0 32px;line-height:1.6;">
        Click the secure button below to complete your password reset.
      </p>
      
      <div style="text-align:center;margin-bottom:32px;">
        <a href="${resetLink}" style="display:inline-block;background-color:#483800;color:#FFFFFF;font-weight:800;font-size:18px;padding:20px 48px;border-radius:16px;text-decoration:none;">Reset Password</a>
      </div>
      
      <p style="color:#5C5265;font-size:16px;margin:0 0 24px;">
        This secure link expires in 30 minute(s).
      </p>
      
      <p style="color:#8F8299;font-size:13px;line-height:1.6;margin:0;">
        If you did not request a password reset, you can safely ignore this email. Your dashboard remains protected.
      </p>
    </div>
  </body>
  </html>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"SpotHai Parking" <${process.env.GMAIL_USER}>`,
      to,
      subject: 'Reset your SpotHai password',
      html: htmlTemplate,
    });
    console.log(`📧 [MAILER] Reset email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`📧 [MAILER] Failed to send reset email:`, err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendOTPEmail, sendPasswordResetEmail };
