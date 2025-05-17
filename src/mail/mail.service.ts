import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as nodemailer from 'nodemailer'
import SMTPTransport from 'nodemailer/lib/smtp-transport'
import { parseBool } from 'src/utils/parse-bool'

@Injectable()
export class MailService {
	private transporter: nodemailer.Transporter
	private emailUsername = 'CoFoundly'
	private emailUser: string

	constructor(private readonly configService: ConfigService) {
		this.emailUser = configService.getOrThrow<string>('EMAIL_USER')
		this.transporter = nodemailer.createTransport({
			host: configService.getOrThrow<string>('EMAIL_HOST'),
			port: parseInt(configService.getOrThrow('EMAIL_PORT')),
			secure: parseBool(configService.getOrThrow('EMAIL_SECURE')),
			auth: {
				user: this.emailUser,
				pass: configService.getOrThrow<string>('EMAIL_PASS'),
			},
		} as SMTPTransport.Options)
	}

	public async sendMail(to: string, subject: string, html: string) {
		await this.transporter.sendMail({
			from: `"${this.emailUsername}" <${this.emailUser}>`,
			to,
			subject,
			html,
		})
	}
}
