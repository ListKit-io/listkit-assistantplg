require('dotenv').config();

const config = {
  slack: {
    botToken: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
  },
  channels: {
    free: process.env.FREE_CHANNEL_ID,
    paid: process.env.PAID_CHANNEL_ID,
  },
  reportUserId: process.env.REPORT_USER_ID,
  cron: {
    schedule: process.env.CRON_SCHEDULE || '0 9 * * 1-5',
    timezone: process.env.CRON_TIMEZONE || 'America/New_York',
  },
  port: parseInt(process.env.PORT, 10) || 3000,
};

const required = [
  'SLACK_BOT_TOKEN',
  'SLACK_SIGNING_SECRET',
  'FREE_CHANNEL_ID',
  'PAID_CHANNEL_ID',
  'REPORT_USER_ID',
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = config;
