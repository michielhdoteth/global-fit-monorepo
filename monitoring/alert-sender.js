import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export class AlertSender {
  constructor(config = {}) {
    this.telegramConfig = {
      enabled: !!process.env.TELEGRAM_BOT_TOKEN && !!process.env.TELEGRAM_CHAT_ID,
      botToken: process.env.TELEGRAM_BOT_TOKEN,
      chatId: process.env.TELEGRAM_CHAT_ID,
      ...config.telegram
    };

    this.smsConfig = {
      enabled: !!process.env.TWILIO_ACCOUNT_SID && !!process.env.TWILIO_AUTH_TOKEN,
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      fromNumber: process.env.TWILIO_FROM_NUMBER,
      toNumber: process.env.TO_PHONE_NUMBER,
      ...config.sms
    };

    this.alertHistory = [];
  }

  async sendAlert(title, message, urgency = 'medium') {
    const alert = {
      id: Date.now(),
      title,
      message,
      urgency,
      timestamp: new Date().toISOString(),
      channels: []
    };

    try {
      // Send Telegram alert
      if (this.telegramConfig.enabled) {
        await this.sendTelegramAlert(title, message);
        alert.channels.push('telegram');
      }

      // Send SMS alert (only for high urgency)
      if (this.smsConfig.enabled && urgency === 'high') {
        await this.sendSMSAlert(title, message);
        alert.channels.push('sms');
      }

      // Log alert
      this.alertHistory.push(alert);
      logger.info({ alertId: alert.id, channels: alert.channels }, 'Alert sent');

      return alert;
    } catch (error) {
      logger.error({ error, alertId: alert.id }, 'Failed to send alert');
      throw error;
    }
  }

  async sendTelegramAlert(title, message) {
    try {
      const { Telegraf } = await import('telegraf');
      const bot = new Telegraf(this.telegramConfig.botToken);

      const text = `${title}\n\n${message}`;
      await bot.telegram.sendMessage(this.telegramConfig.chatId, text, {
        parse_mode: 'HTML'
      });

      logger.info('Telegram alert sent');
    } catch (error) {
      logger.error({ error }, 'Failed to send Telegram alert');
      throw error;
    }
  }

  async sendSMSAlert(title, message) {
    try {
      // Note: Twilio client would be initialized here
      // For now, we'll log the SMS that would be sent
      const text = `${title}\n\n${message}`;
      
      logger.info({ 
        to: this.smsConfig.toNumber, 
        from: this.smsConfig.fromNumber, 
        text 
      }, 'SMS alert would be sent (Twilio not implemented)');

      // Actual Twilio implementation would be:
      // const client = twilio(this.smsConfig.accountSid, this.smsConfig.authToken);
      // await client.messages.create({
      //   body: text,
      //   from: this.smsConfig.fromNumber,
      //   to: this.smsConfig.toNumber
      // });

    } catch (error) {
      logger.error({ error }, 'Failed to send SMS alert');
      throw error;
    }
  }

  getAlertHistory(limit = 50) {
    return this.alertHistory.slice(-limit);
  }

  clearHistory() {
    this.alertHistory = [];
    logger.info('Alert history cleared');
  }
}

export default AlertSender;
