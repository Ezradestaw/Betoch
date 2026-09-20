import { FastifyRequest, FastifyReply } from 'fastify';
import { UserRole } from '@betoch/shared';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  identityStatus?: string;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: any;
    user: AuthUser;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication token required.' }
      });
    }

    const token = authHeader.substring(7);
    const decoded = request.server.jwt.verify<AuthUser>(token);
    request.user = decoded;
  } catch (err) {
    return reply.status(401).send({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired session token.' }
    });
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      return reply.status(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required.' }
      });
    }

    if (!allowedRoles.includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to access this resource.' }
      });
    }
  };
}
