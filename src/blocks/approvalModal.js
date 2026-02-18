/**
 * Builds the modal view for reviewing and approving the report.
 * First 3 fields are pre-filled from auto-calculated values.
 * Total MRR is left empty for manual entry from ChartMogul.
 *
 * @param {object} kpis
 * @param {number} kpis.freeSignups
 * @param {number} kpis.paidSignups
 * @param {number} kpis.newMrr
 * @param {string} kpis.date
 * @returns {object} Slack modal view
 */
function buildApprovalModal({ freeSignups, paidSignups, newMrr, date }) {
  return {
    type: 'modal',
    callback_id: 'approve_report_modal',
    title: {
      type: 'plain_text',
      text: 'Approve Daily Report',
    },
    submit: {
      type: 'plain_text',
      text: 'Generate Report',
    },
    close: {
      type: 'plain_text',
      text: 'Cancel',
    },
    private_metadata: JSON.stringify({ date }),
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Report for ${date}*\nReview the values below. Edit if needed, then submit to get your report.`,
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'input',
        block_id: 'free_signups_block',
        label: {
          type: 'plain_text',
          text: 'New free plan sign-ups',
        },
        element: {
          type: 'number_input',
          action_id: 'free_signups_input',
          is_decimal_allowed: false,
          initial_value: String(freeSignups),
        },
      },
      {
        type: 'input',
        block_id: 'paid_signups_block',
        label: {
          type: 'plain_text',
          text: 'New paid plan sign-ups',
        },
        element: {
          type: 'number_input',
          action_id: 'paid_signups_input',
          is_decimal_allowed: false,
          initial_value: String(paidSignups),
        },
      },
      {
        type: 'input',
        block_id: 'new_mrr_block',
        label: {
          type: 'plain_text',
          text: 'New PLG MRR ($)',
        },
        element: {
          type: 'number_input',
          action_id: 'new_mrr_input',
          is_decimal_allowed: true,
          initial_value: String(newMrr),
        },
      },
      {
        type: 'input',
        block_id: 'total_mrr_block',
        label: {
          type: 'plain_text',
          text: 'Total PLG MRR ($) — from ChartMogul',
        },
        element: {
          type: 'number_input',
          action_id: 'total_mrr_input',
          is_decimal_allowed: true,
          placeholder: {
            type: 'plain_text',
            text: 'Enter total MRR from ChartMogul',
          },
        },
      },
    ],
  };
}

module.exports = { buildApprovalModal };
