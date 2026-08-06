import nodemailer from 'nodemailer';
import { config } from '../config/index';

let transporterPromise: Promise<nodemailer.Transporter> | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporterPromise) return transporterPromise;

  transporterPromise = (async () => {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpHost && smtpUser && smtpPass) {
      return nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
    }

    // Auto Ethereal Fallback for local development / testing
    try {
      const testAccount = await nodemailer.createTestAccount();
      console.log('📧 Ethereal Test SMTP Created:', testAccount.user);
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    } catch (err) {
      console.warn('⚠️ Ethereal account creation failed, using JSON transport fallback.');
      return nodemailer.createTransport({
        jsonTransport: true,
      });
    }
  })();

  return transporterPromise;
}

export async function sendOtpEmail(toEmail: string, otpCode: string, type: 'VERIFICATION' | 'FORGOT_PASSWORD' | 'LOGIN' = 'VERIFICATION') {
  try {
    const transporter = await getTransporter();
    const subject = type === 'FORGOT_PASSWORD'
      ? '🔑 Reset Your Password - Radio Ninada 90.4 FM'
      : '📱 Verification Code - Radio Ninada 90.4 FM';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; rounded-radius: 16px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #ae263c; margin: 0; font-size: 24px;">Radio Ninada 90.4 FM</h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Digital Community Radio Station</p>
        </div>
        <div style="background-color: #fff8f7; border: 1px solid #ffdada; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
          <p style="color: #475569; font-size: 14px; margin-bottom: 12px;">Your 6-digit verification code is:</p>
          <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #ae263c; background: #ffffff; padding: 12px 20px; border-radius: 8px; display: inline-block; border: 1px dashed #ae263c;">
            ${otpCode}
          </div>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 12px;">This code is valid for <strong>5 minutes</strong>. Do not share it with anyone.</p>
        </div>
        <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">If you did not request this code, please ignore this email.</p>
      </div>
    `;

    const fromAddress = process.env.SMTP_FROM || '"Radio Ninada 90.4 FM" <no-reply@radioninada.com>';
    const info = await transporter.sendMail({
      from: fromAddress,
      to: toEmail,
      subject,
      html: htmlContent,
    });

    console.log(`✉️ OTP Email sent to ${toEmail} (Message ID: ${info.messageId || 'DEV-LOG'})`);
    if (nodemailer.getTestMessageUrl(info)) {
      console.log(`🔗 Preview Email URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('❌ Error sending OTP Email:', error.message);
    return { success: false, error: error.message };
  }
}
