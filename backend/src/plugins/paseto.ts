/**
 * Fastify plugin: PASETO v4.local token validation.
 * Decodes the token, attaches the claims to request.user.
 * Routes opt out by setting { config: { skipAuth: true } }.
 */
import fp from 'fastify-plugin';
import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { V4 } from 'paseto';

declare module 'fastify' {
  interface FastifyRequest {
    user: { sub: string; accountId: string; iat: string; exp: string };
  }
}

const PASETO_SECRET = process.env.PASETO_SECRET_KEY!; // 32-byte hex string in env

const pasetoPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorateRequest('user', null);

  fastify.addHook('onRequest', async (request: FastifyRequest, reply) => {
    if ((request.routeOptions?.config as Record<string, unknown>)?.skipAuth) return;

    const auth = request.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      return reply.code(401).send({ error: 'Missing token' });
    }

    try {
      const token = auth.slice(7);
      const key = Buffer.from(PASETO_SECRET, 'hex');
      const payload = await V4.decrypt(token, key);

      // Reject expired tokens
      if (payload.exp && new Date(payload.exp as string) < new Date()) {
        return reply.code(401).send({ error: 'Token expired' });
      }

      request.user = payload as FastifyRequest['user'];
    } catch {
      return reply.code(401).send({ error: 'Invalid token' });
    }
  });
};

export default fp(pasetoPlugin, { name: 'paseto-auth' });
