const cron = require('node-cron');
const config = require('./config');
const { gatherDailyKPIs } = require('./services/slackChannelReader');
const { buildReportDmBlocks } = require('./blocks/reportDmBlocks');

/**
 * Starts the daily cron job that gathers KPIs and DMs the report.
 *
 * @param {import('@slack/web-api').WebClient} client
 */
function startCronJob(client) {
  cron.schedule(
    config.cron.schedule,
    async () => {
      console.log(`[${new Date().toISOString()}] Running daily PLG report job...`);

      try {
        const kpis = await gatherDailyKPIs(
          client,
          config.channels.free,
          config.channels.paid,
          config.channels.canceled
        );

        console.log('KPIs gathered:', JSON.stringify(kpis));

        // Open DM with the target user
        const dmResult = await client.conversations.open({
          users: config.reportUserId,
        });

        await client.chat.postMessage({
          channel: dmResult.channel.id,
          text: `PLG Daily Report for ${kpis.date} is ready for review.`,
          blocks: buildReportDmBlocks(kpis),
        });

        console.log(`Report DM sent to user ${config.reportUserId}`);
      } catch (error) {
        console.error('Error running daily report job:', error);

        // Try to notify the user about the failure
        try {
          const dmResult = await client.conversations.open({
            users: config.reportUserId,
          });
          await client.chat.postMessage({
            channel: dmResult.channel.id,
            text: `Failed to generate the PLG daily report. Error: ${error.message}`,
          });
        } catch (notifyError) {
          console.error('Failed to send error notification:', notifyError);
        }
      }
    },
    {
      timezone: config.cron.timezone,
    }
  );

  console.log(`Cron job scheduled: "${config.cron.schedule}" (${config.cron.timezone})`);
}

module.exports = { startCronJob };
