/**
 * Wrap / unwrap DEK via AWS KMS.
 * The server never sees the plaintext DEK — it only holds the wrapped (encrypted) blob.
 *
 * POST /encryption/wrap-key   { wrappedKey, kmsKeyId }  → 204
 * POST /encryption/unwrap-key {}                         → { wrappedKey }
 * DELETE /account             { gracePeriod: boolean }   → 204
 */
import type { FastifyPluginAsync } from 'fastify';
import {
  KMSClient,
  GenerateDataKeyCommand,
  DecryptCommand,
} from '@aws-sdk/client-kms';

const kms = new KMSClient({ region: process.env.AWS_REGION ?? 'eu-west-1' });
const KMS_KEY_ID = process.env.KMS_KEY_ID!;

const encryptionRoutes: FastifyPluginAsync = async (fastify) => {
  // Store wrapped DEK for the authenticated user
  fastify.post<{ Body: { wrappedKey: string; kmsKeyId: string } }>(
    '/encryption/wrap-key',
    {
      schema: {
        body: {
          type: 'object',
          required: ['wrappedKey', 'kmsKeyId'],
          properties: {
            wrappedKey: { type: 'string' },
            kmsKeyId:   { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { wrappedKey, kmsKeyId } = request.body;
      const { accountId } = request.user;

      await fastify.pg.query(
        `INSERT INTO account_keys (account_id, wrapped_dek, kms_key_id, created_at)
         VALUES ($1, $2, $3, now())
         ON CONFLICT (account_id) DO UPDATE
           SET wrapped_dek = excluded.wrapped_dek,
               kms_key_id  = excluded.kms_key_id,
               rotated_at  = now()`,
        [accountId, wrappedKey, kmsKeyId],
      );

      return reply.code(204).send();
    },
  );

  // Return wrapped DEK so the client can unwrap with KMS and reconstruct the DEK
  fastify.post('/encryption/unwrap-key', async (request, reply) => {
    const { accountId } = request.user;

    const { rows } = await fastify.pg.query<{ wrapped_dek: string; kms_key_id: string }>(
      'SELECT wrapped_dek, kms_key_id FROM account_keys WHERE account_id = $1',
      [accountId],
    );

    if (!rows.length) return reply.code(404).send({ error: 'No key found' });

    return { wrappedKey: rows[0].wrapped_dek, kmsKeyId: rows[0].kms_key_id };
  });

  // Wipe account — soft or immediate
  fastify.delete<{ Body: { gracePeriod: boolean } }>(
    '/account',
    {
      schema: {
        body: {
          type: 'object',
          required: ['gracePeriod'],
          properties: { gracePeriod: { type: 'boolean' } },
        },
      },
    },
    async (request, reply) => {
      const { accountId } = request.user;
      const { gracePeriod } = request.body;

      if (gracePeriod) {
        // Soft delete: mark wipe_requested_at; a cron job deletes after 7 days
        await fastify.pg.query(
          `UPDATE accounts
              SET wipe_requested_at = now(), wipe_mode = 'soft'
            WHERE id = $1`,
          [accountId],
        );
      } else {
        // Immediate: call the SQL helper that cascades to logs
        await fastify.pg.query('SELECT soft_delete_account($1)', [accountId]);
        await fastify.pg.query('DELETE FROM account_keys WHERE account_id = $1', [accountId]);
      }

      return reply.code(204).send();
    },
  );

  // Generate a fresh data key via KMS (used during first-time onboarding)
  fastify.post(
    '/encryption/generate-key',
    { config: { skipAuth: false } },
    async (_request, reply) => {
      const cmd = new GenerateDataKeyCommand({
        KeyId: KMS_KEY_ID,
        KeySpec: 'AES_256',
      });
      const { CiphertextBlob } = await kms.send(cmd);
      // Return wrapped key only — plaintext key stays in KMS, never touches our DB
      return {
        wrappedKey: Buffer.from(CiphertextBlob!).toString('base64'),
        kmsKeyId: KMS_KEY_ID,
      };
    },
  );
};

export default encryptionRoutes;
