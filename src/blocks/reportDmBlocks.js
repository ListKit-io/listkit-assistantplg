/**
 * Builds Block Kit blocks for the DM report message.
 *
 * @param {object} kpis
 * @param {number} kpis.freeSignups
 * @param {number} kpis.paidSignups
 * @param {number} kpis.newMrr
 * @param {string} kpis.date
 * @returns {Array} Block Kit blocks
 */
function buildReportDmBlocks({ freeSignups, paidSignups, newMrr, date }) {
  return [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `PLG Daily Report - ${date}`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: [
          '*Auto-calculated values:*',
          `• Free plan sign-ups: *${freeSignups}*`,
          `• Paid plan sign-ups: *${paidSignups}*`,
          `• New PLG MRR: *$${newMrr}*`,
          '',
          '_Total PLG MRR needs to be entered manually from ChartMogul._',
        ].join('\n'),
      },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Review & Approve',
          },
          style: 'primary',
          action_id: 'review_approve_report',
          value: JSON.stringify({ freeSignups, paidSignups, newMrr, date }),
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Dismiss',
          },
          action_id: 'dismiss_report',
        },
      ],
    },
  ];
}

module.exports = { buildReportDmBlocks };
