// Patterns that identify actual sign-up notifications vs. chat/noise
const PAID_SIGNUP_PATTERN = 'NEW LISTKIT SAAS USER';
// Match "Total revenue: $X" specifically — signup messages also contain a per-unit
// "Revenue: $X" line, so a generic "$" sweep would double-count.
const TOTAL_REVENUE_PATTERN = /\*?Total revenue:?\*?\s*\$\s?([\d,]+(?:\.\d{1,2})?)/i;
const CANCELLATION_PATTERN = /\*?Amount:?\*?\s*\$\s?([\d,]+(?:\.\d{1,2})?)/;

/**
 * Determines how many days to look back based on the given day.
 * Monday → 2 days (Saturday + Sunday combined)
 * All other days → 1 day (yesterday)
 */
function getDaysToLookBack(asOfDate) {
  const dayOfWeek = asOfDate.getDay(); // 0=Sun, 1=Mon, ...
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
async function getReportMessages(client, channelId, asOfDate) {
  const startOfToday = new Date(asOfDate.getFullYear(), asOfDate.getMonth(), asOfDate.getDate());
  const daysBack = getDaysToLookBack(asOfDate);
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

function getReportDate(asOfDate) {
  const startOfToday = new Date(asOfDate.getFullYear(), asOfDate.getMonth(), asOfDate.getDate());
  const daysBack = getDaysToLookBack(asOfDate);

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
 * @param {string} paidChannelId
 * @param {string} canceledChannelId
 * @returns {Promise<{paidSignups: number, newMrr: number, canceledMrr: number, date: string}>}
 */
async function gatherDailyKPIs(client, paidChannelId, canceledChannelId, asOfDate = new Date()) {
  const [paidMessages, canceledMessages] = await Promise.all([
    getReportMessages(client, paidChannelId, asOfDate),
    getReportMessages(client, canceledChannelId, asOfDate),
  ]);

  const paidSignupMessages = paidMessages.filter(
    (msg) => msg.text && msg.text.includes(PAID_SIGNUP_PATTERN)
  );
  const paidSignups = paidSignupMessages.length;

  // Sum "Total revenue: $X" from paid sign-up messages
  const newMrr = paidSignupMessages.reduce((sum, msg) => {
    const match = msg.text && msg.text.match(TOTAL_REVENUE_PATTERN);
    return match ? sum + parseFloat(match[1].replace(/,/g, '')) : sum;
  }, 0);

  // Sum canceled MRR from cancellation messages
  const canceledMrr = canceledMessages.reduce((sum, msg) => {
    const match = msg.text && msg.text.match(CANCELLATION_PATTERN);
    if (match) {
      return sum + parseFloat(match[1].replace(/,/g, ''));
    }
    return sum;
  }, 0);

  const date = getReportDate(asOfDate);

  return {
    paidSignups,
    newMrr: Math.round(newMrr * 100) / 100,
    canceledMrr: Math.round(canceledMrr * 100) / 100,
    date,
  };
}

module.exports = { getReportMessages, gatherDailyKPIs };
