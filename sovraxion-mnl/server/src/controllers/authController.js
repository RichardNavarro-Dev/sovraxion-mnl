import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { clearSessionCookie, isDesignatedOwner, setSessionCookie, signSession } from '../middleware/auth.js';
import { AppError, asyncHandler } from '../utils/AppError.js';
import { USERNAME_RE, isEmail, isStrongPassword } from '../utils/validate.js';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

function sessionResponse(res, user, status = 200) {
  const token = signSession(user);
  setSessionCookie(res, token);
  const payload = {
    success: true,
    user: { ...user.toSafeJSON(), isOwner: isDesignatedOwner(user) },
  };
  if (env.ALLOW_BEARER_FALLBACK) payload.token = token;
  return res.status(status).json(payload);
}

export const register = asyncHandler(async (req, res) => {
  const { username, email, password, confirmPassword } = req.body || {};
  const errors = {};

  if (typeof username !== 'string' || !USERNAME_RE.test(username.trim())) {
    errors.username = 'Username must be 3-30 characters: letters, numbers, underscores or dots.';
  }
  if (typeof email !== 'string' || !isEmail(email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }
  if (!isStrongPassword(password)) {
    errors.password = 'Password must be 8+ characters with uppercase, lowercase and a number.';
  }
  if (confirmPassword !== undefined && confirmPassword !== password) {
    errors.confirmPassword = 'Passwords do not match.';
  }
  if (Object.keys(errors).length) throw new AppError(Object.values(errors)[0], 400, errors);

  const normalizedEmail = email.trim().toLowerCase();
  if (env.OWNER_EMAIL && normalizedEmail === env.OWNER_EMAIL) {
    throw new AppError('This email address is reserved.', 409);
  }

  const exists = await User.findOne({ $or: [{ email: normalizedEmail }, { username: username.trim() }] }).lean();
  if (exists) {
    throw new AppError(
      exists.email === normalizedEmail ? 'An account with this email already exists.' : 'This username is already taken.',
      409
    );
  }

  const user = await User.create({
    username: username.trim(),
    email: normalizedEmail,
    password,
    role: 'customer',
  });

  return sessionResponse(res, user, 201);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || !isEmail(email.trim()) || typeof password !== 'string' || !password) {
    throw new AppError('Please provide a valid email and password.', 400);
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password +failedLoginAttempts +lockUntil');
  const invalid = new AppError('Invalid email or password.', 401);

  if (!user) {
    await new Promise((r) => setTimeout(r, 250));
    throw invalid;
  }
  if (user.isLocked()) {
    throw new AppError('Account temporarily locked after too many failed attempts. Try again in 15 minutes.', 423);
  }

  const ok = await user.comparePassword(password);
  if (!ok) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCK_MS);
      user.failedLoginAttempts = 0;
    }
    await user.save();
    throw invalid;
  }

  user.failedLoginAttempts = 0;
  user.lockUntil = null;
  user.lastLoginAt = new Date();
  await user.save();

  return sessionResponse(res, user);
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: { ...req.user.toSafeJSON(), isOwner: isDesignatedOwner(req.user) } });
});

export const logout = asyncHandler(async (_req, res) => {
  clearSessionCookie(res);
  res.json({ success: true, message: 'Signed out.' });
});
