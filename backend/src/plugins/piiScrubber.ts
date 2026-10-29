/**
 * Strips PII from error payloads before they reach Sentry / Datadog.
 * Register this as a Fastify plugin so it runs on every error.
 *
 * Also export `scrubObject` for use in Sentry's beforeSend callback
 * and any logger transport.
 */
import fp from 'fastify-plugin';
import type { FastifyPluginAsync } from 'fastify';

// Fields whose values must be redacted regardless of nesting depth
const SENSITIVE_KEYS = new Set([
  'password', 'token', 'secret', 'authorization',
  'email', 'phone', 'name', 'birthdate', 'date_of_birth',
  'cycle_day', 'flow', 'mood', 'symptoms', 'notes',
  'lat', 'lng', 'latitude', 'longitude',
  'ip', 'user_agent',
]);

// Patterns in string values that look like PII
const PII_PATTERNS: [RegExp, string][] = [
  [/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[email]'],
  [/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[card]'],
  [/\b\+?[0-9]{7,15}\b/g, '[phone]'],
];

export function scrubString(value: string): string {
  let out = value;
  for (const [pattern, replacement] of PII_PATTERNS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

export function scrubObject(obj: unknown, depth = 0): unknown {
  if (depth > 10) return '[truncated]';
  if (typeof obj === 'string') return scrubString(obj);
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map((item) => scrubObject(item, depth + 1));

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    result[key] = SENSITIVE_KEYS.has(key.toLowerCase())
      ? '[redacted]'
      : scrubObject(value, depth + 1);
  }
  return result;
}

const piiScrubberPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler((error, request, reply) => {
    const scrubbed = scrubObject({
      message: error.message,
      stack: error.stack,
      url: request.url,
      method: request.method,
    });

    request.log.error(scrubbed, 'request error');
    reply.code(error.statusCode ?? 500).send({ error: 'Internal server error' });
  });
};

export default fp(piiScrubberPlugin, { name: 'pii-scrubber' });
