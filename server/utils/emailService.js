const nodemailer = require('nodemailer');

let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  // 1. If custom SMTP or Gmail is configured in environment
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return transporter;
  }

  // 2. Default Development / Fallback Ethereal Transporter
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('📧 Ethereal test mailer created for development.');
    return transporter;
  } catch (err) {
    console.warn('⚠️ Could not create Ethereal test account, using JSON/stream transporter:', err.message);
    transporter = nodemailer.createTransport({
      jsonTransport: true,
    });
    return transporter;
  }
}

/**
 * Send an email invitation to a new team member
 */
async function sendInvitationEmail({
  toEmail,
  recipientName,
  inviterName = 'Team Lead',
  inviterEmail = 'admin@collabboard.io',
  role = 'Member',
  boardName = 'CollabBoard Workspace',
  inviteLink,
}) {
  try {
    const mailTransporter = await getTransporter();
    const link = inviteLink || `http://localhost:3000/register?email=${encodeURIComponent(toEmail)}`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .logo-badge { display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: rgba(255,255,255,0.2); border-radius: 12px; margin-bottom: 12px; font-size: 24px; font-weight: bold; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.9; }
    .body-content { padding: 32px 28px; }
    .greeting { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 14px; }
    .message { font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 24px; }
    .role-highlight { display: inline-block; background: #e0e7ff; color: #4338ca; padding: 3px 10px; border-radius: 20px; font-weight: 600; font-size: 13px; }
    .btn-container { text-align: center; margin: 30px 0; }
    .btn-cta { display: inline-block; background: #4f46e5; color: #ffffff !important; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 15px; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4); }
    .link-fallback { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; word-break: break-all; font-size: 12px; color: #64748b; margin-top: 20px; }
    .footer { padding: 20px; background: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo-badge">📋</div>
      <h1>CollabBoard Invitation</h1>
      <p>Real-time Team Kanban & Task Management</p>
    </div>
    
    <div class="body-content">
      <div class="greeting">Hello ${recipientName || 'there'},</div>
      
      <p class="message">
        <strong>${inviterName}</strong> (${inviterEmail}) has invited you to join the 
        <strong>${boardName}</strong> team workspace on CollabBoard as a <span class="role-highlight">${role}</span>.
      </p>

      <p class="message">
        With CollabBoard, you can collaborate in real-time, drag and drop tasks across columns, receive instant notifications, and organize your work seamlessly.
      </p>
      
      <div class="btn-container">
        <a href="${link}" class="btn-cta">Accept & Join Workspace</a>
      </div>

      <div class="link-fallback">
        If the button above does not work, copy and paste this link into your browser:<br>
        <a href="${link}" style="color: #4f46e5;">${link}</a>
      </div>
    </div>
    
    <div class="footer">
      This invitation was sent to ${toEmail}. If you were not expecting this invitation, you can safely ignore this email.
    </div>
  </div>
</body>
</html>
    `;

    const mailOptions = {
      from: `"${inviterName} via CollabBoard" <${process.env.SMTP_FROM || inviterEmail}>`,
      to: toEmail,
      subject: `📋 Invitation to join ${boardName} on CollabBoard`,
      text: `Hello ${recipientName || 'there'},\n\n${inviterName} has invited you to join "${boardName}" as a ${role} on CollabBoard.\n\nAccept and join here: ${link}\n`,
      html: htmlContent,
    };

    const info = await mailTransporter.sendMail(mailOptions);
    console.log(`✉️ Email invitation successfully dispatched to ${toEmail} (Message ID: ${info.messageId})`);

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`🔗 Ethereal Email Preview: ${previewUrl}`);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: previewUrl || null,
    };
  } catch (err) {
    console.error(`❌ Failed to send invitation email to ${toEmail}:`, err.message);
    return {
      success: false,
      error: err.message,
    };
  }
}

module.exports = { sendInvitationEmail };
