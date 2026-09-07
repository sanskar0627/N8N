export const getGeneratedText = (result: { text?: unknown }) =>
  typeof result.text === "string" ? result.text : "";
