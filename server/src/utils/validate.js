import sanitizeHtml from 'sanitize-html';
import validator from 'validator';
import mongoose from 'mongoose';
import { AppError } from './AppError.js';

export const cleanText = (value, { max = 500 } = {}) => {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new AppError('Invalid text input.', 400);
  }
  const stripped = sanitizeHtml(String(value), { allowedTags: [], allowedAttributes: {} })
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return stripped.slice(0, max);
};

export const cleanMultiline = (value, { max = 4000 } = {}) => {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') throw new AppError('Invalid text input.', 400);
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} })
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);
};

export const PH_MOBILE_RE = /^(09|\+639)\d{9}$/;
export const REFERENCE_RE = /^[A-Za-z0-9]{8,20}$/;
export const USERNAME_RE = /^[A-Za-z0-9_.]{3,30}$/;

export const normalizeMobile = (value) => String(value || '').replace(/[\s-]/g, '');

export const isValidObjectId = (id) => typeof id === 'string' && mongoose.Types.ObjectId.isValid(id) && /^[a-f0-9]{24}$/i.test(id);

export const assertObjectId = (id, label = 'id') => {
  if (!isValidObjectId(id)) throw new AppError(`Invalid ${label}.`, 400);
  return id;
};

export const isStrongPassword = (pw) =>
  typeof pw === 'string' &&
  pw.length >= 8 &&
  pw.length <= 128 &&
  /[a-z]/.test(pw) &&
  /[A-Z]/.test(pw) &&
  /\d/.test(pw);

export const isEmail = (email) => typeof email === 'string' && validator.isEmail(email) && email.length <= 254;

export const toPositiveInt = (value, { min = 1, max = 99 } = {}) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) return null;
  return n;
};

export const toMoney = (value, { min = 0, max = 1000000 } = {}) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return Math.round(n * 100) / 100;
};

export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
