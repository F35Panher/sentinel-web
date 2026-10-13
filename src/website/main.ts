import "./style.css";

import { checkUrlReputation } from "../detection/reputation-engine";

const form = document.querySelector<HTMLFormElement>("#url-form");
const input = document.querySelector<HTMLInputElement>("#url-input");
const resultContainer =
  document.querySelector<HTMLElement>("#url-result");

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

  // Run the shared local reputation engine.
  // No request is made to the submitted website.
  const result = checkUrlReputation(submittedUrl);

  renderResult(result);
});

function renderMessage(message: string): void {
  resultContainer.replaceChildren();
  resultContainer.hidden = false;

  const paragraph = document.createElement("p");
  paragraph.textContent = message;

  resultContainer.append(paragraph);
}

function renderResult(
  result: ReturnType<typeof checkUrlReputation>,
): void {
  resultContainer.replaceChildren();
  resultContainer.hidden = false;

  const heading = document.createElement("h3");
  heading.textContent = getVerdictLabel(result.verdict);

  const explanation = document.createElement("p");
  explanation.textContent = result.explanation;

  resultContainer.append(heading, explanation);

  if (result.hostname) {
    const hostname = document.createElement("p");
    hostname.textContent = `Hostname: ${result.hostname}`;
    resultContainer.append(hostname);
  }

  if (result.checkedAt) {
    const timestamp = document.createElement("p");
    timestamp.textContent =
      `Checked at: ${new Date(result.checkedAt).toLocaleString()}`;
    resultContainer.append(timestamp);
  }

  if (result.datasetVersion) {
    const version = document.createElement("p");
    version.textContent =
      `Threat intelligence version: ${result.datasetVersion}`;
    resultContainer.append(version);
  }

  if (result.evidence.length > 0) {
    const evidenceHeading = document.createElement("h4");
    evidenceHeading.textContent = "Why was this URL flagged?";

    const evidenceList = document.createElement("ul");

    for (const item of result.evidence) {
      const listItem = document.createElement("li");

      const source = document.createElement("strong");
      source.textContent = `Source: ${item.sourceId}`;

      const classification = document.createElement("p");
      classification.textContent =
        `Classification: ${item.classification}`;

      const match = document.createElement("p");
      match.textContent =
        `Match type: ${
          item.matchType === "exact_url"
            ? "Exact URL"
            : "Domain"
        }`;

      const description = document.createElement("p");
      description.textContent = item.description;

      const matchedValue = document.createElement("p");
      matchedValue.textContent = `Matched indicator: ${item.matchedValue}`;

      listItem.append(
        source,
        classification,
        match,
        description,
        matchedValue,
      );

      if (item.firstSeenAt) {
        const firstSeen = document.createElement("p");
        firstSeen.textContent =
          `First reported: ${item.firstSeenAt}`;
        listItem.append(firstSeen);
      }

      if (item.expiresAt) {
        const expiry = document.createElement("p");
        expiry.textContent = `Indicator expires: ${item.expiresAt}`;
        listItem.append(expiry);
      }

      evidenceList.append(listItem);
    }

    resultContainer.append(evidenceHeading, evidenceList);
  }

  if (result.verdict === "no_known_threat_found") {
    const caution = document.createElement("p");
    caution.textContent =
      "This result does not guarantee safety. The local intelligence " +
      "may be incomplete or out of date.";
    resultContainer.append(caution);
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