/**
 * Formats the final report string for posting to Slack.
 */
function formatReport({ paidSignups, newMrr, canceledMrr, totalSubscribers, listkit2Mrr, date }) {
  const fmtMrr = (val) =>
    val.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  const fmtNum = (val) => val.toLocaleString('en-US');

  return [
    `*PLG daily update - ${date}*`,
    '',
    `*${paidSignups}* new paid plan sign ups`,
    `*$${fmtMrr(newMrr)}* in new PLG MRR`,
    `*$${fmtMrr(canceledMrr)}* in canceled MRR`,
    `*${fmtNum(totalSubscribers)}* total Listkit 2.0 subscribers`,
    `*$${fmtMrr(listkit2Mrr)}* Listkit 2.0 MRR`,
  ].join('\n');
}

module.exports = { formatReport };
