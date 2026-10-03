import mongoose from 'mongoose';
import { env } from '../config/env.js';

export function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err, req, res, _next) {
  let status = err.statusCode || err.status || 500;
  let message = err.message || 'Internal server error.';
  let details = err.details;

  if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    details = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message]));
    message = Object.values(details)[0] || 'Validation failed.';
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid value for ${err.path}.`;
  } else if (err?.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || err.keyValue || {}).join(', ');
    if (field.includes('referenceNumber')) message = 'This payment reference number has already been submitted.';
    else if (field.includes('email')) message = 'An account with this email already exists.';
    else if (field.includes('username')) message = 'This username is already taken.';
    else if (field.includes('slug')) message = 'A product with a similar name already exists.';
    else message = 'Duplicate value.';
  } else if (err?.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON body.';
  } else if (err?.type === 'entity.too.large') {
    status = 413;
    message = 'Request body too large.';
  }

  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}`, err);
    if (env.isProduction) message = 'Something went wrong on our end. Please try again.';
  }

  res.status(status).json({ success: false, message, ...(details ? { details } : {}) });
}
