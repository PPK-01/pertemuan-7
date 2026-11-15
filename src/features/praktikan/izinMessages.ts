import { IZIN_STATUS_LABEL } from '@/components/izin/IzinStatusBadge';
import type { IzinStatus } from '@/types';

export { IZIN_STATUS_LABEL };

export const IZIN_STATUS_DESCRIPTION: Record<IzinStatus, string> = {
  pending_ai:
    'Pengajuan izinmu berhasil disimpan dan sedang dianalisis oleh model AI kampus.',
  pending_review:
    'Pengajuan izinmu telah masuk ke antrean dan sedang menunggu pemeriksaan oleh Asisten Lab.',
  approved:
    'Pengajuan izinmu telah disetujui oleh Asisten Lab. Kamu tidak perlu hadir pada sesi ini dan tidak dihitung alpa.',
  rejected:
    'Pengajuan izinmu ditolak oleh Asisten Lab. Silakan periksa catatan asisten bila ada.',
};
