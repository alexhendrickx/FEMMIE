/**
 * Passkey authentication routes.
 * Uses @simplewebauthn/server for challenge generation and assertion verification.
 * Issues PASETO v4.local tokens on success.
 *
 * POST /auth/register/begin   → { challenge, rpId, userId }
 * POST /auth/register/finish  → { token, refreshToken }
 * POST /auth/login/begin      → { challenge }
 * POST /auth/login/finish     → { token, refreshToken }
 * POST /auth/refresh          → { token }
 * DELETE /auth/session        → 204
 */
import type { FastifyPluginAsync } from 'fastify';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { V4 } from 'paseto';
import crypto from 'node:crypto';

const RP_ID   = process.env.RP_ID   ?? 'femmie.app';
const RP_NAME = process.env.RP_NAME ?? 'Femmie';
const PASETO_SECRET   = process.env.PASETO_SECRET_KEY!;
const TOKEN_TTL       = 24 * 60 * 60;       // 24 h in seconds
const REFRESH_TTL_MS  = 7 * 24 * 60 * 60 * 1000;

function pasetoKey() {
  return Buffer.from(PASETO_SECRET, 'hex');
}

async function issueTokens(
  fastify: Parameters<FastifyPluginAsync>[0],
  accountId: string,
): Promise<{ token: string; refreshToken: string }> {
  const key = pasetoKey();
  const exp = new Date(Date.now() + TOKEN_TTL * 1000).toISOString();
  const token = await V4.encrypt({ sub: accountId, accountId, exp }, key);

  // Store refresh token as a SHA-256 hash
  const raw = crypto.randomBytes(40).toString('base64url');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  await fastify.pg.query(
    `INSERT INTO refresh_tokens (account_id, token_hash, expires_at)
     VALUES ($1, $2, now() + interval '7 days')`,
    [accountId, hash],
  );

  return { token, refreshToken: raw };
}

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // ── Register: step 1 — generate challenge ───────────────────────────────────
  fastify.post(
    '/auth/register/begin',
    { config: { skipAuth: true } },
    async (_req, reply) => {
      const accountId = crypto.randomUUID();

      const options = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID: RP_ID,
        userID: Buffer.from(accountId),
        userName: accountId,
        attestationType: 'none',
        authenticatorSelection: {
          residentKey: 'required',
          userVerification: 'required',
        },
      });

      // Persist challenge (5-min TTL set by DB default)
      await fastify.pg.query(
        `INSERT INTO auth_challenges (challenge, account_id) VALUES ($1, $2)`,
        [options.challenge, accountId],
      );

      return reply.send({ challenge: options.challenge, rpId: RP_ID, userId: accountId });
    },
  );

  // ── Register: step 2 — verify + create account ──────────────────────────────
  fastify.post<{
    Body: { userId: string; challenge: string; credential: Record<string, unknown> };
  }>(
    '/auth/register/finish',
    { config: { skipAuth: true } },
    async (req, reply) => {
      const { userId, challenge, credential } = req.body;

      const { rows } = await fastify.pg.query<{ challenge: string; used_at: string | null }>(
        `SELECT challenge, used_at FROM auth_challenges
          WHERE challenge = $1 AND account_id = $2 AND expires_at > now()`,
        [challenge, userId],
      );
      if (!rows.length || rows[0].used_at) {
        return reply.code(400).send({ error: 'Invalid or expired challenge' });
      }

      const verification = await verifyRegistrationResponse({
        response: credential as Parameters<typeof verifyRegistrationResponse>[0]['response'],
        expectedChallenge: challenge,
        expectedOrigin: `https://${RP_ID}`,
        expectedRPID: RP_ID,
      });

      if (!verification.verified || !verification.registrationInfo) {
        return reply.code(400).send({ error: 'Passkey verification failed' });
      }

      const { credential: cred } = verification.registrationInfo;

      await fastify.pg.query('BEGIN');
      try {
        await fastify.pg.query(
          `INSERT INTO accounts (id) VALUES ($1) ON CONFLICT DO NOTHING`,
          [userId],
        );
        await fastify.pg.query(
          `INSERT INTO passkey_credentials
             (account_id, credential_id, public_key, sign_count)
           VALUES ($1, $2, $3, $4)`,
          [
            userId,
            Buffer.from(cred.id).toString('base64url'),
            Buffer.from(cred.publicKey).toString('base64'),
            cred.counter,
          ],
        );
        await fastify.pg.query(
          `UPDATE auth_challenges SET used_at = now() WHERE challenge = $1`,
          [challenge],
        );
        await fastify.pg.query('COMMIT');
      } catch (err) {
        await fastify.pg.query('ROLLBACK');
        throw err;
      }

      const tokens = await issueTokens(fastify, userId);
      return reply.send(tokens);
    },
  );

  // ── Login: step 1 — generate challenge ──────────────────────────────────────
  fastify.post(
    '/auth/login/begin',
    { config: { skipAuth: true } },
    async (_req, reply) => {
      const options = await generateAuthenticationOptions({
        rpID: RP_ID,
        userVerification: 'required',
      });

      await fastify.pg.query(
        `INSERT INTO auth_challenges (challenge) VALUES ($1)`,
        [options.challenge],
      );

      return reply.send({ challenge: options.challenge });
    },
  );

  // ── Login: step 2 — verify assertion ────────────────────────────────────────
  fastify.post<{
    Body: { challenge: string; assertion: Record<string, unknown> };
  }>(
    '/auth/login/finish',
    { config: { skipAuth: true } },
    async (req, reply) => {
      const { challenge, assertion } = req.body;

      const { rows: challengeRows } = await fastify.pg.query<{ used_at: string | null }>(
        `SELECT used_at FROM auth_challenges
          WHERE challenge = $1 AND expires_at > now()`,
        [challenge],
      );
      if (!challengeRows.length || challengeRows[0].used_at) {
        return reply.code(400).send({ error: 'Invalid or expired challenge' });
      }

      // Find the stored credential
      const rawCredId = (assertion as { id?: string }).id ?? '';
      const { rows: credRows } = await fastify.pg.query<{
        account_id: string;
        public_key: string;
        sign_count: number;
      }>(
        `SELECT account_id, public_key, sign_count
           FROM passkey_credentials WHERE credential_id = $1`,
        [rawCredId],
      );
      if (!credRows.length) {
        return reply.code(401).send({ error: 'Unknown credential' });
      }

      const { account_id, public_key, sign_count } = credRows[0];

      const verification = await verifyAuthenticationResponse({
        response: assertion as Parameters<typeof verifyAuthenticationResponse>[0]['response'],
        expectedChallenge: challenge,
        expectedOrigin: `https://${RP_ID}`,
        expectedRPID: RP_ID,
        credential: {
          id: rawCredId,
          publicKey: Buffer.from(public_key, 'base64'),
          counter: sign_count,
        },
      });

      if (!verification.verified) {
        return reply.code(401).send({ error: 'Assertion failed' });
      }

      await fastify.pg.query(
        `UPDATE passkey_credentials
            SET sign_count = $1, last_used_at = now()
          WHERE credential_id = $2`,
        [verification.authenticationInfo.newCounter, rawCredId],
      );
      await fastify.pg.query(
        `UPDATE auth_challenges SET used_at = now() WHERE challenge = $1`,
        [challenge],
      );

      const tokens = await issueTokens(fastify, account_id);
      return reply.send(tokens);
    },
  );

  // ── Refresh token ────────────────────────────────────────────────────────────
  fastify.post<{ Body: { refreshToken: string } }>(
    '/auth/refresh',
    { config: { skipAuth: true } },
    async (req, reply) => {
      const { refreshToken } = req.body;
      const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');

      const { rows } = await fastify.pg.query<{ account_id: string }>(
        `UPDATE refresh_tokens
            SET revoked_at = now()
          WHERE token_hash = $1
            AND expires_at > now()
            AND revoked_at IS NULL
          RETURNING account_id`,
        [hash],
      );

      if (!rows.length) {
        return reply.code(401).send({ error: 'Invalid or expired refresh token' });
      }

      // Issue a fresh pair (token rotation)
      const tokens = await issueTokens(fastify, rows[0].account_id);
      return reply.send(tokens);
    },
  );

  // ── Logout ───────────────────────────────────────────────────────────────────
  fastify.delete('/auth/session', async (req, reply) => {
    const { accountId } = req.user;
    await fastify.pg.query(
      `UPDATE refresh_tokens SET revoked_at = now()
        WHERE account_id = $1 AND revoked_at IS NULL`,
      [accountId],
    );
    return reply.code(204).send();
  });
};

export default authRoutes;
