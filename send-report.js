/**
 * One-time script to send a report for a specific date.
 * Usage: node send-report.js 2026-02-27
 */
require('dotenv').config();
const { WebClient } = require('@slack/web-api');
const { gatherDailyKPIs } = require('./src/services/slackChannelReader');
const { buildReportDmBlocks } = require('./src/blocks/reportDmBlocks');

const dateArg = process.argv[2];
if (!dateArg) {
  console.error('Usage: node send-report.js YYYY-MM-DD');
  process.exit(1);
}

const [year, month, day] = dateArg.split('-').map(Number);
const asOfDate = new Date(year, month - 1, day);

const client = new WebClient(process.env.SLACK_BOT_TOKEN);

(async () => {
  const kpis = await gatherDailyKPIs(
    client,
    process.env.FREE_CHANNEL_ID,
    process.env.PAID_CHANNEL_ID,
    process.env.CANCELED_CHANNEL_ID,
    asOfDate
  );

  console.log('KPIs:', JSON.stringify(kpis));

  const dmResult = await client.conversations.open({ users: process.env.REPORT_USER_ID });
  await client.chat.postMessage({
    channel: dmResult.channel.id,
    text: `PLG Daily Report for ${kpis.date} is ready for review.`,
    blocks: buildReportDmBlocks(kpis),
  });

  console.log('Report sent!');
})();
