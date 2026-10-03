const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 });
const pesoShort = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 });

export const formatPeso = (value) => peso.format(Number(value) || 0);
export const formatPesoShort = (value) => pesoShort.format(Number(value) || 0);

export const formatDate = (value) =>
  new Date(value).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Manila' });

export const PH_MOBILE_RE = /^(09|\+639)\d{9}$/;
export const REFERENCE_RE = /^[A-Za-z0-9]{8,20}$/;
export const normalizeMobile = (v) => String(v || '').replace(/[\s-]/g, '');

export const cx = (...classes) => classes.filter(Boolean).join(' ');
