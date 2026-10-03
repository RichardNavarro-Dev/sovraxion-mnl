import rateLimit from 'express-rate-limit';
import { AppError } from '../utils/AppError.js';

const FORBIDDEN_KEY = /^\$|\./;
const PROTO_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function scrub(value, depth = 0) {
  if (depth > 10) throw new AppError('Payload nesting too deep.', 400);
  if (Array.isArray(value)) return value.map((v) => scrub(v, depth + 1));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      if (FORBIDDEN_KEY.test(key) || PROTO_KEYS.has(key)) continue;
      out[key] = scrub(val, depth + 1);
    }
    return out;
  }
  return value;
}

export function noSqlSanitize(req, _res, next) {
  try {
    if (req.body && typeof req.body === 'object') req.body = scrub(req.body);
    if (req.params && typeof req.params === 'object') {
      for (const key of Object.keys(req.params)) {
        if (typeof req.params[key] !== 'string') delete req.params[key];
      }
    }
    const cleanedQuery = scrub({ ...req.query });
    for (const [key, val] of Object.entries(cleanedQuery)) {
      if (typeof val !== 'string') delete cleanedQuery[key];
    }
    Object.defineProperty(req, 'query', { value: cleanedQuery, writable: true, configurable: true, enumerable: true });
    next();
  } catch (err) {
    next(err);
  }
}

export function requireClientHeader(req, _res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.get('x-sovx-client') !== 'web') {
    return next(new AppError('Request rejected by CSRF protection.', 403));
  }
  return next();
}

const limiterHandler = (_req, _res, next, options) =>
  next(new AppError(options.message || 'Too many requests. Please try again later.', options.statusCode));

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: 'Too many login attempts. Please wait 15 minutes before trying again.',
  handler: limiterHandler,
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: 'Too many accounts created from this network. Please try again in an hour.',
  handler: limiterHandler,
});

export const orderLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 15,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: 'Too many checkout attempts. Please wait a few minutes.',
  handler: limiterHandler,
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: limiterHandler,
});
