import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { fileTypeFromBuffer } from 'file-type';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

const ALLOWED_MIME = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

export const RECEIPT_DIR = path.join(env.UPLOAD_DIR, 'receipts');
export const PRODUCT_IMAGE_DIR = path.join(env.UPLOAD_DIR, 'products');
fs.mkdirSync(RECEIPT_DIR, { recursive: true });
fs.mkdirSync(PRODUCT_IMAGE_DIR, { recursive: true });

const memoryUpload = (fieldName) =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 20, fieldSize: 64 * 1024 },
    fileFilter(_req, file, cb) {
      if (!ALLOWED_MIME.has(file.mimetype)) {
        return cb(new AppError('Only JPG, PNG or WEBP images are allowed.', 400));
      }
      return cb(null, true);
    },
  }).single(fieldName);

export const handleUpload = (fieldName) => (req, res, next) => {
  memoryUpload(fieldName)(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      const message = err.code === 'LIMIT_FILE_SIZE' ? 'Image must be 5 MB or smaller.' : `Upload error: ${err.message}`;
      return next(new AppError(message, 400));
    }
    return next(err);
  });
};

export async function persistImage(file, directory) {
  if (!file || !file.buffer) throw new AppError('Image file is required.', 400);
  const detected = await fileTypeFromBuffer(file.buffer);
  if (!detected || !ALLOWED_MIME.has(detected.mime)) {
    throw new AppError('Uploaded file is not a valid JPG, PNG or WEBP image.', 400);
  }
  const filename = `${Date.now()}-${crypto.randomBytes(16).toString('hex')}.${ALLOWED_MIME.get(detected.mime)}`;
  await fs.promises.writeFile(path.join(directory, filename), file.buffer, { mode: 0o640 });
  return filename;
}

export async function removeFileQuietly(directory, filename) {
  if (!filename) return;
  const safe = path.basename(filename);
  try {
    await fs.promises.unlink(path.join(directory, safe));
  } catch {
    /* file already absent */
  }
}
