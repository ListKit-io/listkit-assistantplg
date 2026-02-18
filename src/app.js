const { App, ExpressReceiver } = require('@slack/bolt');
const config = require('./config');
const { registerActionHandlers } = require('./handlers/actionHandler');
const { registerViewHandlers } = require('./handlers/viewHandler');
const { startCronJob } = require('./cron');
const { gatherDailyKPIs } = require('./services/slackChannelReader');
const { buildReportDmBlocks } = require('./blocks/reportDmBlocks');

// ExpressReceiver gives us HTTP mode (needed for Railway's public URL)
const receiver = new ExpressReceiver({
  signingSecret: config.slack.signingSecret,
});

// Health check endpoint for Railway
receiver.router.get('/health', (req, res) => {
  res.status(200).send('OK');
});

const app = new App({
  token: config.slack.botToken,
  receiver,
});

// Register interactive handlers
registerActionHandlers(app);
registerViewHandlers(app);

// /plg-report slash command — manual trigger fallback
app.command('/plg-report', async ({ ack, client, body }) => {
  await ack('Generating report...');

  try {
    const kpis = await gatherDailyKPIs(
      client,
      config.channels.free,
      config.channels.paid
    );

    const dmResult = await client.conversations.open({
      users: body.user_id,
    });

    await client.chat.postMessage({
      channel: dmResult.channel.id,
      text: `PLG Daily Report for ${kpis.date} is ready for review.`,
      blocks: buildReportDmBlocks(kpis),
    });
  } catch (error) {
    console.error('Error running manual report:', error);
  }
});

// Start the server and cron job
(async () => {
  await app.start(config.port);
  console.log(`PLG Report Bot running on port ${config.port}`);

  startCronJob(app.client);
})();
