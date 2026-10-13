import { mkdir, readFile, writeFile, rename, unlink } from "node:fs/promises";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";

import { fetchUrlhausRecords } from "./feeds/urlhaus";

const OUTPUT_PATH = "public/intel/threat-intel.json";
const DATASET_TTL_MS = 48 * 60 * 60 * 1000;

function classifyThreat(threat: string) {
  const value = threat.toLowerCase();

  if (value.includes("phish")) return "phishing" as const;
  if (value.includes("malware")) return "malware" as const;

  return "suspicious" as const;
}

async function main() {
  const apiKey = process.env.URLHAUS_AUTH_KEY;

  if (!apiKey) {
    throw new Error("URLHAUS_AUTH_KEY is not configured.");
  }

  const records = await fetchUrlhausRecords(apiKey);

  if (records.length === 0) {
    throw new Error(
      "URLhaus returned no valid records. Refusing to publish an empty dataset."
    );
  }

  const now = new Date();
  const generatedAt = now.toISOString();
  const expiresAt = new Date(
    now.getTime() + DATASET_TTL_MS
  ).toISOString();

  const indicators = records.map((record) => {
    const url = new URL(record.url);

    return {
      id: `urlhaus-${record.id}`,
      value: url.href,
      indicatorType: "url" as const,
      classification: classifyThreat(record.threat),
      sourceId: "urlhaus",
      sourceType: "public_feed" as const,
      firstSeenAt: record.date_added,
      expiresAt,
      description: `URLhaus reported this URL. Threat: ${record.threat}; status: ${record.url_status}.`,
    };
  });

  const uniqueIndicators = [
    ...new Map(
      indicators.map((indicator) => [
        `${indicator.indicatorType}:${indicator.value}`,
        indicator,
      ])
    ).values(),
  ];

  const dataset = {
    schemaVersion: 1,
    version: `${now.toISOString().replace(/[-:.]/g, "")}-${randomUUID().slice(0, 8)}`,
    status: "ready",
    generatedAt,
    expiresAt,
    sources: [
      {
        id: "urlhaus",
        name: "URLhaus by abuse.ch",
        type: "public_feed",
        attributionUrl: "https://urlhaus.abuse.ch/",
        termsUrl: "https://urlhaus.abuse.ch/api/",
        lastSuccessfulFetchAt: generatedAt,
      },
    ],
    indicators: uniqueIndicators,
  };

  const output = `${JSON.stringify(dataset, null, 2)}\n`;
  const temporaryPath = `${OUTPUT_PATH}.tmp`;

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });

  // Validate the JSON before publication.
  JSON.parse(output);

  await writeFile(temporaryPath, output, "utf8");

  try {
    await rename(temporaryPath, OUTPUT_PATH);
  } catch (error) {
    await unlink(temporaryPath).catch(() => {});
    throw error;
  }

  console.log("Threat intelligence generated successfully.");
  console.log(`Valid URLhaus records: ${records.length}`);
  console.log(`Unique indicators: ${uniqueIndicators.length}`);
  console.log(`Dataset version: ${dataset.version}`);
  console.log(`Generated at: ${generatedAt}`);
}

main().catch((error: unknown) => {
  console.error(
    "Threat intelligence generation failed:",
    error instanceof Error ? error.message : "Unknown error"
  );
  process.exitCode = 1;
});