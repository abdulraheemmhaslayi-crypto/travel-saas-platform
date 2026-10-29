import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class OtpService {
  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async generateAndSendOtp(phone: string): Promise<{ expiresIn: number; maskedPhone: string }> {
    const otp = this.generateOtp();
    const expiryMinutes = this.configService.get('otp.expiryMinutes', 10);
    const expirySeconds = expiryMinutes * 60;

    await this.redisService.setex(`otp:${phone}`, expirySeconds, otp);

    await this.notificationsService.sendSms(
      phone,
      `Your Travel SaaS OTP is: ${otp}. Valid for ${expiryMinutes} minutes. Do not share this code with anyone.`,
    );

    return {
      expiresIn: expirySeconds,
      maskedPhone: this.maskPhone(phone),
    };
  }

  async verifyOtp(phone: string, otp: string): Promise<boolean> {
    const storedOtp = await this.redisService.get(`otp:${phone}`);
    
    if (!storedOtp || storedOtp !== otp) {
      return false;
    }

    await this.redisService.del(`otp:${phone}`);
    return true;
  }

  async resendOtp(phone: string): Promise<{ expiresIn: number; maskedPhone: string }> {
    await this.redisService.del(`otp:${phone}`);
    return this.generateAndSendOtp(phone);
  }

  private generateOtp(): string {
    const length = this.configService.get('otp.length', 6);
    return Math.floor(Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1)).toString();
  }

  private maskPhone(phone: string): string {
    return phone.slice(0, -4).replace(/\d/g, '*') + phone.slice(-4);
  }
}