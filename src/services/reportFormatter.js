/**
 * Formats the final report string for posting to Slack.
 *
 * @param {object} data
 * @param {number} data.freeSignups
 * @param {number} data.paidSignups
 * @param {number} data.newMrr
 * @param {number} data.totalMrr
 * @param {string} data.date
 * @returns {string}
 */
function formatReport({ freeSignups, paidSignups, newMrr, totalMrr, date }) {
  const fmtMrr = (val) =>
    val.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  return [
    `*PLG daily update - ${date}*`,
    '',
    `*${freeSignups}* new free plan sign ups`,
    `*${paidSignups}* new paid plan sign ups`,
    `*$${fmtMrr(newMrr)}* in new PLG MRR`,
    `*$${fmtMrr(totalMrr)}* total PLG MRR`,
  ].join('\n');
}

module.exports = { formatReport };
