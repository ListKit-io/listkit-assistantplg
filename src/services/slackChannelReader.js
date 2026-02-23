const { parseDollarAmount } = require('./mrrParser');

// Patterns that identify actual sign-up notifications vs. chat/noise
const FREE_SIGNUP_PATTERN = 'NEW LISTKIT FREE PLAN USER';
const PAID_SIGNUP_PATTERN = 'NEW LISTKIT SAAS USER';

/**
 * Determines how many days to look back based on the current day.
 * Monday → 2 days (Saturday + Sunday combined)
 * All other days → 1 day (yesterday)
 */
function getDaysToLookBack() {
  const dayOfWeek = new Date().getDay(); // 0=Sun, 1=Mon, ...
  return dayOfWeek === 1 ? 2 : 1;
}

/**
 * Fetches all messages from a channel for the reporting period.
 * On Monday: reads Saturday 00:00 to Monday 00:00 (weekend combined)
 * Other days: reads yesterday 00:00 to today 00:00
 *
 * @param {import('@slack/web-api').WebClient} client
 * @param {string} channelId
 * @returns {Promise<Array>}
 */
async function getReportMessages(client, channelId) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysBack = getDaysToLookBack();
  const startOfPeriod = new Date(startOfToday.getTime() - daysBack * 24 * 60 * 60 * 1000);
  const oldest = (startOfPeriod.getTime() / 1000).toString();
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
 * Formats the report date string.
 * Monday: "2/15/26 - 2/16/26" (Sat-Sun)
 * Other days: "2/17/26" (yesterday)
 */
function formatDateLabel(d) {
  return `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(-2)}`;
}

function getReportDate() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysBack = getDaysToLookBack();

  if (daysBack === 2) {
    const saturday = new Date(startOfToday.getTime() - 2 * 24 * 60 * 60 * 1000);
    const sunday = new Date(startOfToday.getTime() - 1 * 24 * 60 * 60 * 1000);
    return `${formatDateLabel(saturday)} - ${formatDateLabel(sunday)}`;
  }

  const yesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
  return formatDateLabel(yesterday);
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
    getReportMessages(client, freeChannelId),
    getReportMessages(client, paidChannelId),
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

  const date = getReportDate();

  return {
    freeSignups,
    paidSignups,
    newMrr: Math.round(newMrr * 100) / 100,
    date,
  };
}

module.exports = { getReportMessages, gatherDailyKPIs };
