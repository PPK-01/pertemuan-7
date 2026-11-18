import type { IzinStatus, SessionStatus } from '@/types';

export type ColorPair = { bg: string; text: string };

const status = {
  scheduled: { bg: '#FFF1C2', text: '#5E3B00' },
  open: { bg: '#DDF1E4', text: '#14603A' },
  closed: { bg: '#E3E7F2', text: '#3A4560' },
} as const satisfies Record<SessionStatus, ColorPair>;

const feedback = {
  success: { bg: '#DDF1E4', text: '#14603A' },
  danger: { bg: '#FBE3E1', text: '#A32119' },
  info: { bg: '#E0E8FB', text: '#1B2F8F' },
  warning: { bg: '#FFE8CC', text: '#7A3D00' },
} as const satisfies Record<string, ColorPair>;

/** Garis tepi banner/kartu bernada feedback, dipasangkan dengan `feedback.*.bg`. */
const feedbackBorder = {
  info: '#2A4AD0',
} as const satisfies Record<string, string>;

/** Kartu bernada feedback yang lebih lembut dari banner (mis. kartu status izin). */
const feedbackSubtle = {
  success: { bg: '#F2FAF5', border: '#A8DFBE' },
  danger: { bg: '#FFF5F5', border: '#FFC7C7' },
} as const satisfies Record<string, { bg: string; border: string }>;

const izin = {
  pending_ai: feedback.info,
  pending_review: feedback.warning,
  approved: feedback.success,
  rejected: feedback.danger,
} as const satisfies Record<IzinStatus, ColorPair>;

export const colors = {
  primary: '#00144A',
  onPrimary: '#FFFFFF',
  /** Isian sel motif kode di atas navy. */
  onPrimaryFaint: 'rgba(255, 255, 255, 0.08)',
  /** Isian lembut di atas navy (latar avatar). */
  onPrimarySubtle: 'rgba(255, 255, 255, 0.1)',
  /** Garis pemisah tipis di atas navy. */
  onPrimaryDivider: 'rgba(255, 255, 255, 0.12)',
  /** Tepi elemen tidak aktif di atas navy. */
  onPrimaryBorderSubtle: 'rgba(255, 255, 255, 0.25)',
  /** Tepi tombol outline di atas navy. */
  onPrimaryBorder: 'rgba(255, 255, 255, 0.4)',
  accent: '#FFC400',
  /** Isian aksen lembut di atas navy (sel kode aktif). */
  accentSubtle: 'rgba(255, 196, 0, 0.12)',
  onAccent: '#00144A',
  tile: '#E3E7F2',
  /** Latar penanda item navigasi terpilih (pil ikon tab aktif). */
  selectedSubtle: '#E0E8FB',
  background: '#F4F6FB',
  surface: '#FFFFFF',
  /** Permukaan kartu yang sedikit diredupkan dari `surface`. */
  surfaceMuted: '#F7F8FC',
  border: '#D5DAE8',
  borderStrong: '#7A84A0',
  text: '#0E1633',
  textMuted: '#4B5675',
  overlay: 'rgba(0, 20, 74, 0.5)',
  disabled: { bg: '#E3E7F2', text: '#66708C' },
  feedback,
  feedbackBorder,
  feedbackSubtle,
  status,
  izin,
} as const;
