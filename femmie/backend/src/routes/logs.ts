import type { FastifyInstance } from 'fastify';
import type {
  CreateLogBody,
  CreateLogResponse,
  SuggestionsResponse,
} from '../types/logs';

// All built-in category IDs — kept in sync with frontend categories.ts
const ALL_CATEGORY_IDS = [
  'menstrual_flow', 'spotting', 'clots',
  'cramps', 'headache', 'bloating', 'breast_tenderness', 'fatigue', 'nausea', 'back_pain', 'acne',
  'mood', 'anxiety', 'irritability', 'brain_fog',
  'sleep_quality', 'sleep_hours', 'energy', 'exercise',
];

export async function logsRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /logs
   * Save or overwrite the daily log for a given date.
   * Body: { date, cycleDay, entries: [{categoryId, value}] }
   */
  app.post<{ Body: CreateLogBody; Reply: CreateLogResponse }>(
    '/logs',
    {
      schema: {
        body: {
          type: 'object',
          required: ['date', 'cycleDay', 'entries'],
          properties: {
            date:     { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
            cycleDay: { type: 'integer', minimum: 1, maximum: 60 },
            entries: {
              type: 'array',
              items: {
                type: 'object',
                required: ['categoryId', 'value'],
                properties: {
                  categoryId: { type: 'string' },
                  value: {},
                },
              },
            },
          },
        },
      },
    },
    async (req, reply) => {
      const { date, cycleDay, entries } = req.body;
      // TODO: get userId from PASETO token (req.user.id)
      const userId = (req as any).user?.id ?? 'dev-user';
      const savedAt = new Date().toISOString();

      /*
       * DB query (TimescaleDB / PostgreSQL):
       *
       * INSERT INTO daily_logs (user_id, date, cycle_day, entries, saved_at)
       * VALUES ($1, $2, $3, $4, $5)
       * ON CONFLICT (user_id, date)
       *   DO UPDATE SET entries = EXCLUDED.entries, saved_at = EXCLUDED.saved_at
       * RETURNING id;
       */
      const id = `${userId}_${date}`; // replace with DB-generated UUID

      return reply.status(200).send({ id, date, savedAt });
    },
  );

  /**
   * GET /logs/suggestions?cycleDay=N
   * Returns category IDs ordered by historical frequency for this cycleDay (±2 days).
   * Falls back to a sensible default order if insufficient data.
   */
  app.get<{
    Querystring: { cycleDay?: string };
    Reply: SuggestionsResponse;
  }>(
    '/logs/suggestions',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            cycleDay: { type: 'string' },
          },
        },
      },
    },
    async (req, reply) => {
      const cycleDay = parseInt(req.query.cycleDay ?? '14', 10);
      // TODO: get userId from PASETO token
      const userId = (req as any).user?.id ?? 'dev-user';

      /*
       * DB query — frequency of each categoryId for this user
       * in a ±2 day window around cycleDay, across all historical logs:
       *
       * SELECT entry->>'categoryId' AS category_id, COUNT(*) AS freq
       * FROM daily_logs,
       *      jsonb_array_elements(entries) AS entry
       * WHERE user_id = $1
       *   AND cycle_day BETWEEN $2 AND $3
       * GROUP BY category_id
       * ORDER BY freq DESC;
       *
       * Replace the stub below with the real query result.
       */

      const frequencyMap: Record<string, number> = await getHistoricalFrequency(
        userId,
        cycleDay,
      );

      // Sort all known categories by frequency; append unknown ones at the end
      const sorted = ALL_CATEGORY_IDS.slice().sort(
        (a, b) => (frequencyMap[b] ?? 0) - (frequencyMap[a] ?? 0),
      );

      // If in period window (cycleDay <= 7), keep flow categories at the top
      const isPeriodWindow = cycleDay <= 7;
      if (isPeriodWindow && (frequencyMap['menstrual_flow'] ?? 0) === 0) {
        const flowIds = ['menstrual_flow', 'spotting', 'clots'];
        const rest = sorted.filter((id) => !flowIds.includes(id));
        return reply.send({ categoryIds: [...flowIds, ...rest] });
      }

      return reply.send({ categoryIds: sorted });
    },
  );
}

// ─── Stub — replace with real DB call ─────────────────────────────────────────
async function getHistoricalFrequency(
  _userId: string,
  _cycleDay: number,
): Promise<Record<string, number>> {
  // Stub: return empty map until DB is wired up
  // Real implementation: run the SQL above and return { categoryId: count }
  return {};
}
