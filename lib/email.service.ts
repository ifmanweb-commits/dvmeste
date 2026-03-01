import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isDevelopment = process.env.NODE_ENV === 'development';

  async getTransporter() {
    if (this.transporter) return this.transporter;

    if (this.isDevelopment) {
      // Локально: используем MailDev
      console.log('📧 Development mode: using MailDev');
      this.transporter = nodemailer.createTransport({
        host: 'localhost',
        port: 1025,
        ignoreTLS: true,
      });
    } else {
      // Продакшн: используем SMTP Unisender
      if (!process.env.UNISENDER_SMTP_HOST) {
        throw new Error('UNISENDER_SMTP_HOST not configured');
      }
      
      this.transporter = nodemailer.createTransport({
        host: process.env.UNISENDER_SMTP_HOST,
        port: Number(process.env.UNISENDER_SMTP_PORT) || 465,
        secure: true,
        auth: {
          user: process.env.UNISENDER_SMTP_USER || '',
          pass: process.env.UNISENDER_SMTP_PASS || '',
        },
      });
    }

    return this.transporter;
  }

  async sendEmail(options: EmailOptions) {
    try {
      const transporter = await this.getTransporter();
      
      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'Давай вместе'}" <${process.env.EMAIL_FROM || 'noreply@davay-vmeste.ru'}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''),
      };

      if (this.isDevelopment) {
        console.log('📧 Development email ready:', {
          to: options.to,
          subject: options.subject,
        });
        console.log(`🔗 View at: http://localhost:1080`);
      }

      const info = await transporter.sendMail(mailOptions);
      
      if (this.isDevelopment) {
        console.log('📧 Email sent to MailDev:', info.messageId);
      }
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }

  async sendVerificationEmail(to: string, token: string) {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/verify?token=${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Подтверждение email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #5858E2; border-bottom: 2px solid #5858E2; padding-bottom: 10px;">Подтверждение регистрации</h2>
          <p>Здравствуйте!</p>
          <p>Для подтверждения email и активации личного кабинета нажмите на кнопку:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #5858E2; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Подтвердить email
            </a>
          </div>
          
          <p>Или скопируйте ссылку в браузер:</p>
          <p style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 14px;">
            ${verificationUrl}
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #777; font-size: 14px;">
            Это письмо отправлено автоматически. Если вы не регистрировались на сайте, просто проигнорируйте его.
          </p>
        </body>
      </html>
    `;

    return this.sendEmail({
      to,
      subject: 'Подтверждение email для каталога психологов',
      html,
    });
  }
}

export const emailService = new EmailService();