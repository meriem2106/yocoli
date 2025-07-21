// src/services/mail.service.ts
import * as nodemailer from 'nodemailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('smtp.host'),
      port: this.configService.get<number>('smtp.port'),
      secure: false,
      auth: {
        user: this.configService.get<string>('smtp.user'),
        pass: this.configService.get<string>('smtp.pass'),
      },
    });
  }

  /** Mail de bienvenue */
  async sendWelcomeEmail(to: string, name: string) {
    const mailOptions = {
      from: 'Yocoli <no-reply@yocoli.com>',
      to,
      subject: 'Bienvenue sur Yocoli !',
      html: `<p>Bonjour <strong>${name}</strong>,</p>
             <p>Bienvenue dans l’univers Yocoli ! Nous sommes ravis de vous compter parmi nous.</p>
             <p>Bonne création !</p>`,
    };
    await this.transporter.sendMail(mailOptions);
  }

  /** Mail de reset */
  async sendPasswordResetEmail(to: string, token: string) {
    const resetLink = `https://yocoli.app/reset-password?token=${token}`;
    const mailOptions = {
      from: 'Yocoli <no-reply@yocoli.com>',
      to,
      subject: 'Réinitialisation de votre mot de passe',
      html: `<p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
             <p><a href="${resetLink}">Cliquez ici pour réinitialiser</a> (lien valable 1 h).</p>`,
    };
    await this.transporter.sendMail(mailOptions);
  }

  /** Mail de confirmation d'inscription */
  async sendEmailVerification(to: string, token: string, name: string) {
    const link = `https://yocoli.app/verify-email?token=${token}`;
    const mailOptions = {
      from: `"Yocoli" <${this.configService.get('SMTP_USER')}>`,
      to,
      subject: 'Confirmez votre adresse e-mail',
      html: `<p>Bonjour <strong>${name}</strong>,</p>
             <p>Cliquez sur le lien pour activer votre compte&nbsp;:</p>
             <p><a href="${link}">Confirmer mon adresse</a> (lien valable 1 h)</p>`,
    };
    await this.transporter.sendMail(mailOptions);
  }
}