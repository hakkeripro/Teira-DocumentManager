// Edge-safe observability helpers (no Node.js built-ins)

export function newRequestId(): string {
  const cryptoObj = globalThis.crypto;

  // Preferred: randomUUID (available in modern runtimes, incl. Next.js Edge)
  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') {
    return cryptoObj.randomUUID();
  }

  // Fallback: UUID v4 via getRandomValues
  if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    cryptoObj.getRandomValues(bytes);

    // RFC 4122 v4
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  // Last resort: good-enough unique id for dev/log correlation
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function logInfo(message: string, fields: Record<string, unknown> = {}) {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ level: 'info', message, ...fields }));
}

export function logError(message: string, fields: Record<string, unknown> = {}) {
  // eslint-disable-next-line no-console
  console.error(JSON.stringify({ level: 'error', message, ...fields }));
}
