import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const SERVER_ROOT = path.resolve(__dirname, '..', '..');

dotenv.config({ path: path.join(SERVER_ROOT, '.env') });

const bool = (value, fallback = false) => {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.length < 32) {
  if (isProduction) {
    throw new Error('JWT_SECRET must be set to a random string of at least 32 characters in production.');
  }
  jwtSecret = crypto.randomBytes(48).toString('hex');
  console.warn('[env] JWT_SECRET missing or too short; generated an ephemeral development secret. Sessions reset on restart.');
}

const ownerEmail = (process.env.OWNER_EMAIL || '').trim().toLowerCase();
const ownerPassword = process.env.OWNER_PASSWORD || '';
if (isProduction && (!ownerEmail || ownerPassword.length < 12)) {
  throw new Error('OWNER_EMAIL and OWNER_PASSWORD (min 12 characters) must be configured in production.');
}

const sameSite = (process.env.COOKIE_SAMESITE || 'strict').toLowerCase();
if (!['strict', 'lax', 'none'].includes(sameSite)) {
  throw new Error('COOKIE_SAMESITE must be one of strict, lax, none.');
}

export const env = Object.freeze({
  NODE_ENV,
  isProduction,
  PORT: Number.parseInt(process.env.PORT || '5000', 10),
  MONGODB_URI: process.env.MONGODB_URI || '',
  USE_MEMORY_DB: bool(process.env.USE_MEMORY_DB, !process.env.MONGODB_URI),
  MEMORY_DB_PATH: process.env.MEMORY_DB_PATH || path.join(SERVER_ROOT, '.data', 'mongo'),
  JWT_SECRET: jwtSecret,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  COOKIE_NAME: 'sovx_session',
  COOKIE_SECURE: bool(process.env.COOKIE_SECURE, isProduction || sameSite === 'none'),
  COOKIE_SAMESITE: sameSite,
  COOKIE_MAX_AGE_MS: 7 * 24 * 60 * 60 * 1000,
  ALLOW_BEARER_FALLBACK: bool(process.env.ALLOW_BEARER_FALLBACK, false),
  ALLOW_NULL_ORIGIN: bool(process.env.ALLOW_NULL_ORIGIN, false),
  CLIENT_ORIGINS: (process.env.CLIENT_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  TRUST_PROXY: Number.parseInt(process.env.TRUST_PROXY || '1', 10),
  OWNER_EMAIL: ownerEmail,
  OWNER_PASSWORD: ownerPassword,
  OWNER_USERNAME: (process.env.OWNER_USERNAME || 'sovraxion_owner').trim(),
  UPLOAD_DIR: process.env.UPLOAD_DIR || path.join(SERVER_ROOT, 'uploads'),
  CLIENT_DIST: process.env.CLIENT_DIST || path.resolve(SERVER_ROOT, '..', 'client', 'dist'),
  MERCHANT: Object.freeze({
    accountName: 'SOVRAXION MNL',
    accountNumber: '09636688618',
    methods: ['GCash', 'Maya'],
  }),
});
