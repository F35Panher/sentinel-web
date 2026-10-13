import "./style.css";

import { checkUrlReputation } from "../detection/reputation-engine";

const form = document.querySelector<HTMLFormElement>(
  "#url-check-form",
);
const input = document.querySelector<HTMLInputElement>(
  "#url-input",
);
const resultContainer = document.querySelector<HTMLElement>(
  "#url-check-result",
);

if (!form || !input || !resultContainer) {
  throw new Error(
    "Sentinel URL checker elements were not found. Check index.html selectors.",
  );
}

form.addEventListener("submit", (event: SubmitEvent) => {
  event.preventDefault();

  const submittedUrl = input.value.trim();

  if (!submittedUrl) {
    renderMessage("Enter a URL to check.");
    return;
  }

  const result = checkUrlReputation(submittedUrl);

  renderResult(result);
});

function renderMessage(message: string): void {
  resultContainer.replaceChildren();
  resultContainer.hidden = false;

  const messageElement = document.createElement("p");
  messageElement.textContent = message;

  resultContainer.append(messageElement);
}

function renderResult(
  result: ReturnType<typeof checkUrlReputation>,
): 
void {
  resultContainer.replaceChildren();
  resultContainer.hidden = false;

  const heading = document.createElement("h3");
  heading.textContent = getVerdictLabel(result.verdict);

  const explanation = document.createElement("p");
  explanation.textContent = result.explanation;

  resultContainer.append(heading, explanation);

  if (result.normalizedUrl) {
    const normalizedUrl = document.createElement("p");
    normalizedUrl.textContent = `Checked URL: ${result.normalizedUrl}`;
    resultContainer.append(normalizedUrl);
  }

  if (result.evidence.length > 0) {
    const evidenceHeading = document.createElement("h4");
    evidenceHeading.textContent = "Detection evidence";

    const evidenceList = document.createElement("ul");

    for (const item of result.evidence) {
      const listItem = document.createElement("li");
      listItem.textContent =
        `${item.classification}: ${item.description} ` +
        `(Indicator: ${item.indicatorId}; Source: ${item.sourceId})`;

      evidenceList.append(listItem);
    }

    resultContainer.append(evidenceHeading, evidenceList);
  }
}

function getVerdictLabel(
  verdict: ReturnType<typeof checkUrlReputation>["verdict"],
): string {
  switch (verdict) {
    case "malicious":
      return "Known malicious indicator matched";

    case "suspicious":
      return "Suspicious destination indicator matched";

    case "tracker":
      return "Known tracker indicator matched";

    case "no_known_threat_found":
      return "No known threat found";

    case "unable_to_determine":
      return "Unable to determine reputation";
  }
}