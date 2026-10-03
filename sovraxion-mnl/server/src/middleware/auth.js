import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { AppError, asyncHandler } from '../utils/AppError.js';
import { isValidObjectId } from '../utils/validate.js';

export function signSession(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    issuer: 'sovraxion-mnl',
    audience: 'sovraxion-mnl-web',
    algorithm: 'HS256',
  });
}

export function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAMESITE,
    maxAge: env.COOKIE_MAX_AGE_MS,
    path: '/',
  };
}

export function setSessionCookie(res, token) {
  res.cookie(env.COOKIE_NAME, token, cookieOptions());
}

export function clearSessionCookie(res) {
  const { maxAge, ...rest } = cookieOptions();
  res.clearCookie(env.COOKIE_NAME, rest);
}

function extractToken(req) {
  const cookieToken = req.cookies?.[env.COOKIE_NAME];
  if (typeof cookieToken === 'string' && cookieToken.length > 0) return cookieToken;
  if (env.ALLOW_BEARER_FALLBACK) {
    const header = req.get('authorization') || '';
    const match = header.match(/^Bearer\s+([A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+)$/);
    if (match) return match[1];
  }
  return null;
}

async function resolveUser(req) {
  const token = extractToken(req);
  if (!token) return null;
  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET, {
      issuer: 'sovraxion-mnl',
      audience: 'sovraxion-mnl-web',
      algorithms: ['HS256'],
    });
  } catch {
    return null;
  }
  if (!payload?.sub || !isValidObjectId(payload.sub)) return null;
  const user = await User.findById(payload.sub);
  return user || null;
}

export const optionalAuth = asyncHandler(async (req, _res, next) => {
  req.user = await resolveUser(req);
  next();
});

export const requireAuth = asyncHandler(async (req, res, next) => {
  const user = await resolveUser(req);
  if (!user) {
    clearSessionCookie(res);
    throw new AppError('Authentication required. Please sign in.', 401);
  }
  req.user = user;
  next();
});

export const isDesignatedOwner = (user) =>
  Boolean(user && user.role === 'admin' && env.OWNER_EMAIL && user.email === env.OWNER_EMAIL);

export const requireAdmin = asyncHandler(async (req, _res, next) => {
  const user = req.user || (await resolveUser(req));
  if (!user) throw new AppError('Authentication required. Please sign in.', 401);
  if (!isDesignatedOwner(user)) {
    console.warn(`[security] Blocked admin access attempt by user ${user._id} (${user.email}) on ${req.method} ${req.originalUrl}`);
    throw new AppError('Forbidden. This area is restricted to the store owner.', 403);
  }
  req.user = user;
  next();
});
