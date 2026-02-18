const { formatReport } = require('../services/reportFormatter');

function registerViewHandlers(app) {
  // Modal submission — send the final formatted report as a DM for copy-pasting
  app.view('approve_report_modal', async ({ ack, view, client, body }) => {
    await ack();

    const values = view.state.values;
    const freeSignups = parseInt(values.free_signups_block.free_signups_input.value, 10);
    const paidSignups = parseInt(values.paid_signups_block.paid_signups_input.value, 10);
    const newMrr = parseFloat(values.new_mrr_block.new_mrr_input.value);
    const totalMrr = parseFloat(values.total_mrr_block.total_mrr_input.value);
    const listkit2Mrr = parseFloat(values.listkit2_mrr_block.listkit2_mrr_input.value);
    const { date } = JSON.parse(view.private_metadata);

    const reportText = formatReport({ freeSignups, paidSignups, newMrr, totalMrr, listkit2Mrr, date });

    // Send the final report as a DM for the user to copy-paste
    const dmResult = await client.conversations.open({
      users: body.user.id,
    });
    await client.chat.postMessage({
      channel: dmResult.channel.id,
      text: reportText,
    });
  });
}

module.exports = { registerViewHandlers };
