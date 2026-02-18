const { buildApprovalModal } = require('../blocks/approvalModal');

function registerActionHandlers(app) {
  // "Review & Approve" button — opens the approval modal
  app.action('review_approve_report', async ({ body, ack, client }) => {
    await ack();

    const kpis = JSON.parse(body.actions[0].value);

    await client.views.open({
      trigger_id: body.trigger_id,
      view: buildApprovalModal(kpis),
    });
  });

  // "Dismiss" button — marks the report as dismissed
  app.action('dismiss_report', async ({ body, ack, client }) => {
    await ack();

    await client.chat.update({
      channel: body.channel.id,
      ts: body.message.ts,
      text: 'Report dismissed.',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '~Report dismissed.~',
          },
        },
      ],
    });
  });
}

module.exports = { registerActionHandlers };
