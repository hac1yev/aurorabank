import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

interface MailOperationParams {
  operation: string;
}

@Injectable()
export class MailService {
  private resend: Resend;
  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendOtpEmail(email: string, otp: string, params: MailOperationParams) {
    const htmlTemplate = `
    <div style="font-family: Arial, sans-serif;">
      <p>Hello,</p>
      <p>Your <b>${params.operation}</b> code is:</p>
      <h2 style="letter-spacing: 4px;">${otp}</h2>
      <p>This code is valid for <b>3 minutes</b>.</p>
    </div>
  `;

    await this.resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: params.operation,
      html: htmlTemplate,
    });
  }
}
