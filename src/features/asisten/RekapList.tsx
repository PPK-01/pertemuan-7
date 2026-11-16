import { StyleSheet, Text, View } from 'react-native';

import { getKategoriLabel } from '@/components/izin/AiSuggestionCard';
import { Card } from '@/components/ui/Card';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import type { Rekap } from '@/types';
import { formatTime } from '@/utils/time';

export type RekapListProps = {
  /** `izin` hanya izin disetujui dan tidak memuat praktikan yang sudah hadir; disaring pemanggil. */
  rekap: Rekap;
};

export function RekapList({ rekap }: RekapListProps) {
  const { hadir, izin, belumHadir, total } = rekap;
  const summary =
    izin.length > 0
      ? `Hadir ${hadir.length} dari ${total} · ${izin.length} izin`
      : `Hadir ${hadir.length} dari ${total}`;
  const progressPercent = total > 0 ? Math.round((hadir.length / total) * 100) : 0;

  return (
    <View style={styles.container}>
      <Card>
        <View style={styles.panelContent}>
          <View style={styles.headerRow}>
            <Text
              aria-live="polite"
              style={styles.summary}
            >{summary}</Text>
          </View>

          <View style={styles.track}>
            <View style={[styles.progress, { width: `${progressPercent}%` }]} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{`Sudah hadir (${hadir.length})`}</Text>
            {hadir.length === 0 ? (
              <Text style={styles.empty}>Belum ada praktikan yang presensi.</Text>
            ) : (
              <View style={styles.list}>
                {hadir.map(({ user, timestamp }, index) => {
                  const time = formatTime(timestamp);
                  return (
                    <View
                      key={user.id}
                      accessible
                      aria-label={`${user.name}, hadir pukul ${time}`}
                      style={[styles.row, index > 0 && styles.rowDivider]}
                    >
                      <Text style={styles.name}>{user.name}</Text>
                      <Text style={styles.time}>{time}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.sectionDivider} />

          {/* FR-10, FR-28: izin disetujui dipisah dari belum hadir. */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{`Izin (${izin.length})`}</Text>
            {izin.length === 0 ? (
              <Text style={styles.empty}>Tidak ada izin yang disetujui.</Text>
            ) : (
              <View style={styles.list}>
                {izin.map(({ user, izin: item }, index) => {
                  const kategori =
                    item.ai?.state === 'success' ? getKategoriLabel(item.ai.kategori) : null;
                  return (
                    <View
                      key={user.id}
                      accessible
                      aria-label={
                        kategori
                          ? `${user.name}, izin disetujui, kategori ${kategori}`
                          : `${user.name}, izin disetujui`
                      }
                      style={[styles.row, index > 0 && styles.rowDivider]}
                    >
                      <Text style={styles.name}>{user.name}</Text>
                      {kategori ? <Text style={styles.meta}>{kategori}</Text> : null}
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.sectionDivider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{`Belum hadir (${belumHadir.length})`}</Text>
            {belumHadir.length === 0 ? (
              <Text style={styles.empty}>
                {izin.length > 0
                  ? 'Semua praktikan sudah hadir atau izin.'
                  : 'Semua praktikan sudah hadir.'}
              </Text>
            ) : (
              <View style={styles.list}>
                {belumHadir.map((user, index) => (
                  <View key={user.id} style={[styles.row, index > 0 && styles.rowDivider]}>
                    <Text style={styles.name}>{user.name}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </Card>
    </View>
  );
}

// Ukuran tanpa padanan token: bilah progres tipis dan garis pemisah 1dp (sama dengan BORDER_WIDTH).
const PROGRESS_TRACK_HEIGHT = 4;
const DIVIDER_WIDTH = 1;

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  panelContent: { gap: spacing.md },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  summary: {
    ...typography.title,
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  track: {
    height: PROGRESS_TRACK_HEIGHT,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  section: { gap: spacing.sm },
  sectionTitle: { ...typography.label, color: colors.text },
  sectionDivider: {
    height: DIVIDER_WIDTH,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  list: {
    borderTopWidth: DIVIDER_WIDTH,
    borderTopColor: colors.border,
  },
  empty: { ...typography.body, color: colors.textMuted, paddingVertical: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowDivider: { borderTopWidth: DIVIDER_WIDTH, borderTopColor: colors.border },
  name: { ...typography.body, color: colors.text, flex: 1 },
  meta: { ...typography.label, color: colors.textMuted, flexShrink: 0 },
  time: {
    ...typography.label,
    color: colors.textMuted,
    fontVariant: ['tabular-nums'],
    flexShrink: 0,
  },
});
