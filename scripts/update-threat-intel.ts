import {
  mkdir,
  readFile,
  rename,
  writeFile,
} from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type {
  ThreatIndicator,
  ThreatIntelDataset,
} from "../src/shared/types";

import { normalizeUrl } from "../src/shared/url-normalizer";
import { fetchUrlhausRecords } from "./feeds/urlhaus";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(SCRIPT_DIR, "..");
const OUTPUT_FILE = resolve(
  PROJECT_ROOT,
  "public/intel/threat-intel.json",
);

const INDICATOR_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const DATASET_MAX_AGE_MS = 36 * 60 * 60 * 1000;

async function generateDataset(): Promise<ThreatIntelDataset> {
  const apiKey = process.env.URLHAUS_AUTH_KEY;

  if (!apiKey) {
    throw new Error(
      "URLHAUS_AUTH_KEY is missing. Configure it as an environment variable.",
    );
  }

  const now = Date.now();
  const generatedAt = new Date(now).toISOString();

  console.log("Fetching URLhaus threat intelligence...");

  const records = await fetchUrlhausRecords(apiKey);

  console.log(`Received ${records.length} valid feed records.`);

  const indicatorsByUrl = new Map<string, ThreatIndicator>();

  for (const record of records) {
    // Only publish URLs the provider currently reports as online.
    // This reduces stale entries but does not guarantee that a URL
    // remains reachable or malicious after collection.
    if (record.url_status.toLowerCase() !== "online") {
      continue;
    }

    const firstSeenTime = Date.parse(record.date_added);

    if (!Number.isFinite(firstSeenTime)) {
      continue;
    }

    const indicatorExpiresAt =
      firstSeenTime + INDICATOR_MAX_AGE_MS;

    if (indicatorExpiresAt <= now) {
      continue;
    }

    const normalized = normalizeUrl(record.url);

    if (!normalized.success) {
      continue;
    }

    const normalizedUrl = normalized.value.url;
    const existing = indicatorsByUrl.get(normalizedUrl);

    // If duplicate records describe the same URL, keep the
    // record with the latest provider-reported date.
    if (
      existing &&
      Date.parse(existing.firstSeenAt ?? "") >= firstSeenTime
    ) {
      continue;
    }

    const tags = record.tags?.filter(Boolean) ?? [];

    const description = [
      "URLhaus lists this exact URL in its malware URL intelligence feed.",
      `Provider threat classification: ${record.threat}.`,
      tags.length > 0
        ? `Provider tags: ${tags.join(", ")}.`
        : "",
    ]
      .filter(Boolean)
      .join(" ");

    indicatorsByUrl.set(normalizedUrl, {
      id: `urlhaus-${record.id}`,
      value: normalizedUrl,
      indicatorType: "url",
      classification: "malware",
      sourceId: "urlhaus",
      sourceType: "public_feed",
      firstSeenAt: new Date(firstSeenTime).toISOString(),
      expiresAt: new Date(indicatorExpiresAt).toISOString(),
      description,
    });
  }

  const indicators = [...indicatorsByUrl.values()];

  // Never replace a previously published dataset with an empty
  // dataset or a snapshot that contains no currently usable records.
  if (indicators.length === 0) {
    throw new Error(
      "No usable, unexpired URLhaus indicators were found. Existing dataset preserved.",
    );
  }

  const dataset: ThreatIntelDataset = {
    schemaVersion: 1,
    version: `urlhaus-${generatedAt.replace(/[:.]/g, "-")}`,
    status: "ready",
    generatedAt,
    expiresAt: new Date(
      now + DATASET_MAX_AGE_MS,
    ).toISOString(),
    sources: [
      {
        id: "urlhaus",
        name: "URLhaus by abuse.ch",
        type: "public_feed",
        attributionUrl: "https://urlhaus.abuse.ch/",
        termsUrl: "https://urlhaus.abuse.ch/legal/",
        lastSuccessfulFetchAt: generatedAt,
      },
    ],
    indicators,
  };

  return dataset;
}

async function publishDataset(
  dataset: ThreatIntelDataset,
): Promise<void> {
  await mkdir(dirname(OUTPUT_FILE), { recursive: true });

  const temporaryFile = `${OUTPUT_FILE}.${process.pid}.tmp`;

  try {
    await writeFile(
      temporaryFile,
      `${JSON.stringify(dataset, null, 2)}\n`,
      { encoding: "utf8", flag: "wx" },
    );

    // Parse the serialized output before replacing the published file.
    const serialized = await readFile(temporaryFile, "utf8");
    const parsed: unknown = JSON.parse(serialized);

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("status" in parsed) ||
      parsed.status !== "ready" ||
      !("indicators" in parsed) ||
      !Array.isArray(parsed.indicators) ||
      parsed.indicators.length === 0
    ) {
      throw new Error(
        "Generated dataset failed publication validation.",
      );
    }

    // Same-directory rename prevents readers from seeing a partially
    // written JSON file. If writing or validation fails, the old
    // published dataset remains untouched.
    await rename(temporaryFile, OUTPUT_FILE);
  } catch (error) {
    const { unlink } = await import("node:fs/promises");

    await unlink(temporaryFile).catch(() => undefined);
    throw error;
  }
}

async function main(): Promise<void> {
  const dataset = await generateDataset();

  await publishDataset(dataset);

  console.log("Threat intelligence updated successfully.");
  console.log(`Version: ${dataset.version}`);
  console.log(`Indicators: ${dataset.indicators.length}`);
  console.log(`Output: ${OUTPUT_FILE}`);
  console.log(`Generated: ${dataset.generatedAt}`);
  console.log(`Expires: ${dataset.expiresAt}`);
}

main().catch((error: unknown) => {
  console.error(
    "Threat intelligence update failed:",
    error instanceof Error ? error.message : "Unknown error",
  );

  process.exitCode = 1;
});