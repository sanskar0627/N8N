export const generateGoogleFormScript = (
  webhookUrl: string,
  secret: string,
) => `function onFormSubmit(e) {
  var formResponse = e.response;
  var itemResponses = formResponse.getItemResponses();
  var responses = {};
  var duplicateCounts = {};

  for (var i = 0; i < itemResponses.length; i++) {
    var itemResponse = itemResponses[i];
    var title = itemResponse.getItem().getTitle();
    duplicateCounts[title] = (duplicateCounts[title] || 0) + 1;
    var key = duplicateCounts[title] === 1
      ? title
      : title + " (" + duplicateCounts[title] + ")";
    responses[key] = itemResponse.getResponse();
  }

  var payload = {
    formId: e.source.getId(),
    formTitle: e.source.getTitle(),
    responseId: formResponse.getId(),
    timestamp: formResponse.getTimestamp(),
    respondentEmail: formResponse.getRespondentEmail() || "",
    responses: responses
  };

  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    headers: {
      "X-Secret": ${JSON.stringify(secret)}
    },
    muteHttpExceptions: true
  };

  var webhookUrl = ${JSON.stringify(webhookUrl)};
  var lastError;

  for (var attempt = 0; attempt < 3; attempt++) {
    try {
      var response = UrlFetchApp.fetch(webhookUrl, options);
      var status = response.getResponseCode();
      if (status >= 200 && status < 300) return;
      lastError = new Error("M9M webhook returned HTTP " + status);
    } catch (error) {
      lastError = error;
    }
    Utilities.sleep(Math.pow(2, attempt) * 1000);
  }

  throw lastError;
}`;
