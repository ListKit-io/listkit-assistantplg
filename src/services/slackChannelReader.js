const { parseDollarAmount } = require('./mrrParser');

// Patterns that identify actual sign-up notifications vs. chat/noise
const FREE_SIGNUP_PATTERN = 'NEW LISTKIT FREE PLAN USER';
const PAID_SIGNUP_PATTERN = 'NEW LISTKIT SAAS USER';

/**
 * Fetches all messages from a channel posted during the previous day.
 * e.g., if run on Wednesday 9 AM, reads messages from Tuesday 00:00 to Tuesday 23:59.
 *
 * @param {import('@slack/web-api').WebClient} client
 * @param {string} channelId
 * @returns {Promise<Array>}
 */
async function getYesterdayMessages(client, channelId) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
  const oldest = (startOfYesterday.getTime() / 1000).toString();
  const latest = (startOfToday.getTime() / 1000).toString();

  let allMessages = [];
  let cursor;

  do {
    const result = await client.conversations.history({
      channel: channelId,
      oldest,
      latest,
      inclusive: true,
      limit: 200,
      cursor,
    });

    allMessages = allMessages.concat(result.messages || []);
    cursor = result.response_metadata?.next_cursor;
  } while (cursor);

  return allMessages;
}

/**
 * Gathers all auto-calculable KPIs for the daily report.
 *
 * @param {import('@slack/web-api').WebClient} client
 * @param {string} freeChannelId
 * @param {string} paidChannelId
 * @returns {Promise<{freeSignups: number, paidSignups: number, newMrr: number, date: string}>}
 */
async function gatherDailyKPIs(client, freeChannelId, paidChannelId) {
  const [freeMessages, paidMessages] = await Promise.all([
    getYesterdayMessages(client, freeChannelId),
    getYesterdayMessages(client, paidChannelId),
  ]);

  // Count only bot notifications that match the sign-up pattern
  const freeSignups = freeMessages.filter(
    (msg) => msg.text && msg.text.includes(FREE_SIGNUP_PATTERN)
  ).length;

  const paidSignupMessages = paidMessages.filter(
    (msg) => msg.text && msg.text.includes(PAID_SIGNUP_PATTERN)
  );
  const paidSignups = paidSignupMessages.length;

  // Sum the "Revenue: $X" from paid sign-up messages only
  const newMrr = paidSignupMessages.reduce((sum, msg) => {
    return sum + parseDollarAmount(msg.text);
  }, 0);

  // Report date is yesterday
  const now = new Date();
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const month = yesterday.getMonth() + 1;
  const day = yesterday.getDate();
  const year = String(yesterday.getFullYear()).slice(-2);
  const date = `${month}/${day}/${year}`;

  return {
    freeSignups,
    paidSignups,
    newMrr: Math.round(newMrr * 100) / 100,
    date,
  };
}

module.exports = { getYesterdayMessages, gatherDailyKPIs };
