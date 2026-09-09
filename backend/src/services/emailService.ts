import nodemailer, { Transporter } from 'nodemailer';

let transporterPromise: Promise<Transporter> | null = null;

export const getTransporter = async (): Promise<Transporter> => {
  if (!transporterPromise) {
    transporterPromise = (async () => {
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;

      if (user && pass) {
        const host = process.env.SMTP_HOST || 'smtp.ethereal.email';
        const port = parseInt(process.env.SMTP_PORT || '587', 10);
        return nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user, pass },
        });
      }

      console.log('[EmailService] No SMTP credentials provided. Creating automatic Ethereal test account...');
      const testAccount = await nodemailer.createTestAccount();
      console.log(`[EmailService] Ethereal test account ready: ${testAccount.user}`);

      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    })();
  }
  return transporterPromise;
};

