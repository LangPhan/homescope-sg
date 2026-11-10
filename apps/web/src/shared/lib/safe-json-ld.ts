export function serializeJsonLd(value: unknown): string {
  const json = JSON.stringify(value);

  if (json === undefined) {
    throw new TypeError("JSON-LD value must be serializable.");
  }

  return json.replace(/</g, "\\u003c");
}
