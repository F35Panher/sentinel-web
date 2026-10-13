const response = await fetch(URLHAUS_API_URL, {
  method: "POST",
  headers: {
    "Auth-Key": apiKey,
    Accept: "application/json",
  },
  signal: AbortSignal.timeout(30_000),
});
Replace it with:

typescript

const response = await fetch(URLHAUS_API_URL, {
  method: "GET",
  headers: {
    "Auth-Key": apiKey,
    Accept: "application/json",
  },
  signal: AbortSignal.timeout(30_000),
});