export const buildSlackWebhookPayload = (content: string) => ({
  text: content,
  content,
});
