import { FastifyRequest, FastifyReply } from 'fastify';
import argon2 from 'argon2';
import { registerSchema, loginSchema } from '@betoch/validation';
import { query, withTransaction } from '../../database/db.js';
import { logAuditEvent } from '../../utils/audit.js';

export async function register(request: FastifyRequest, reply: FastifyReply) {
  const parseResult = registerSchema.safeParse(request.body);
  if (!parseResult.success) {
    return reply.status(400).send({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid registration details',
        details: parseResult.error.flatten().fieldErrors
      }
    });
  }

  const { email, phone, password, role, firstName, lastName } = parseResult.data;

  // Check uniqueness
  const existingUser = await query(
    'SELECT id, email, phone FROM users WHERE email = $1 OR phone = $2',
    [email, phone]
  );
  if (existingUser.rows.length > 0) {
    const conflictField = existingUser.rows[0].email === email ? 'Email' : 'Phone number';
    return reply.status(409).send({
      success: false,
      error: { code: 'CONFLICT', message: `${conflictField} is already registered.` }
    });
  }

  // Hash password with Argon2id
  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2
  });

  const newUser = await withTransaction(async (client) => {
    const userRes = await client.query(
      `INSERT INTO users (email, phone, password_hash, role, is_active, email_verified, phone_verified)
       VALUES ($1, $2, $3, $4, true, false, false)
       RETURNING id, email, phone, role, created_at`,
      [email, phone, passwordHash, role]
    );
    const user = userRes.rows[0];

    await client.query(
      `INSERT INTO user_profiles (user_id, first_name, last_name, identity_status)
       VALUES ($1, $2, $3, 'UNVERIFIED')`,
      [user.id, firstName, lastName]
    );

    return user;
  });

  await logAuditEvent({
    actorId: newUser.id,
    action: 'USER_REGISTERED',
    resourceType: 'users',
    resourceId: newUser.id,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
    metadata: { email: newUser.email, role: newUser.role }
  });

  // Generate tokens
  const token = request.server.jwt.sign(
    { id: newUser.id, email: newUser.email, role: newUser.role, identityStatus: 'UNVERIFIED' },
    { expiresIn: '15m' }
  );
  const refreshToken = request.server.jwt.sign(
    { id: newUser.id, type: 'refresh' },
    { expiresIn: '7d' }
  );

  reply.setCookie('betoch_refresh', refreshToken, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60
  });

  return reply.status(201).send({
    success: true,
    data: {
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        profile: {
          firstName,
          lastName,
          identityStatus: 'UNVERIFIED'
        }
      }
    }
  });
}

export async function login(request: FastifyRequest, reply: FastifyReply) {
  const parseResult = loginSchema.safeParse(request.body);
  if (!parseResult.success) {
    return reply.status(400).send({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Invalid login details' }
    });
  }

  const { emailOrPhone, password } = parseResult.data;

  const userRes = await query(
    `SELECT u.id, u.email, u.phone, u.password_hash, u.role, u.is_active,
            p.first_name, p.last_name, p.avatar_url, p.identity_status
     FROM users u
     LEFT JOIN user_profiles p ON p.user_id = u.id
     WHERE (LOWER(u.email) = LOWER($1) OR u.phone = $1)
       AND u.deleted_at IS NULL`,
    [emailOrPhone]
  );

  if (userRes.rows.length === 0) {
    return reply.status(401).send({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials provided.' }
    });
  }

  const user = userRes.rows[0];

  if (!user.is_active) {
    return reply.status(403).send({
      success: false,
      error: { code: 'ACCOUNT_SUSPENDED', message: 'This account has been suspended. Please contact Betoch support.' }
    });
  }

  const isPasswordValid = await argon2.verify(user.password_hash, password);
  if (!isPasswordValid) {
    return reply.status(401).send({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials provided.' }
    });
  }

  await logAuditEvent({
    actorId: user.id,
    action: 'USER_LOGIN',
    resourceType: 'users',
    resourceId: user.id,
    ipAddress: request.ip,
    userAgent: request.headers['user-agent']
  });

  const token = request.server.jwt.sign(
    { id: user.id, email: user.email, role: user.role, identityStatus: user.identity_status },
    { expiresIn: '15m' }
  );
  const refreshToken = request.server.jwt.sign(
    { id: user.id, type: 'refresh' },
    { expiresIn: '7d' }
  );

  reply.setCookie('betoch_refresh', refreshToken, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60
  });

  return reply.send({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profile: {
          firstName: user.first_name,
          lastName: user.last_name,
          avatarUrl: user.avatar_url,
          identityStatus: user.identity_status
        }
      }
    }
  });
}

export async function refresh(request: FastifyRequest, reply: FastifyReply) {
  const refreshToken = request.cookies.betoch_refresh;
  if (!refreshToken) {
    return reply.status(401).send({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'No refresh token provided.' }
    });
  }

  try {
    const decoded = request.server.jwt.verify<{ id: string }>(refreshToken);
    const userRes = await query(
      `SELECT u.id, u.email, u.role, u.is_active, p.identity_status
       FROM users u
       LEFT JOIN user_profiles p ON p.user_id = u.id
       WHERE u.id = $1 AND u.deleted_at IS NULL`,
      [decoded.id]
    );

    if (userRes.rows.length === 0 || !userRes.rows[0].is_active) {
      return reply.status(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Session invalid.' }
      });
    }

    const user = userRes.rows[0];
    const token = request.server.jwt.sign(
      { id: user.id, email: user.email, role: user.role, identityStatus: user.identity_status },
      { expiresIn: '15m' }
    );

    return reply.send({
      success: true,
      data: { token }
    });
  } catch (err) {
    return reply.status(401).send({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Refresh token expired or invalid.' }
    });
  }
}

export async function logout(request: FastifyRequest, reply: FastifyReply) {
  reply.clearCookie('betoch_refresh', { path: '/' });
  return reply.send({ success: true, message: 'Logged out successfully.' });
}

export async function getMe(request: FastifyRequest, reply: FastifyReply) {
  const userId = request.user?.id;
  const userRes = await query(
    `SELECT u.id, u.email, u.phone, u.role, u.is_active, u.created_at,
            p.first_name, p.last_name, p.avatar_url, p.bio, p.identity_status, p.preferred_language
     FROM users u
     LEFT JOIN user_profiles p ON p.user_id = u.id
     WHERE u.id = $1`,
    [userId]
  );

  if (userRes.rows.length === 0) {
    return reply.status(404).send({
      success: false,
      error: { code: 'NOT_FOUND', message: 'User not found.' }
    });
  }

  const u = userRes.rows[0];
  return reply.send({
    success: true,
    data: {
      id: u.id,
      email: u.email,
      phone: u.phone,
      role: u.role,
      isActive: u.is_active,
      createdAt: u.created_at,
      profile: {
        firstName: u.first_name,
        lastName: u.last_name,
        avatarUrl: u.avatar_url,
        bio: u.bio,
        identityStatus: u.identity_status,
        preferredLanguage: u.preferred_language
      }
    }
  });
}
