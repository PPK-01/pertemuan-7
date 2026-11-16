import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { TextField } from '@/components/ui/TextField';
import {
  RUANG_MAX_LENGTH,
  TOPIK_MAX_LENGTH,
  emptySessionFormValues,
  validateSessionForm,
} from '@/features/asisten/sessionFormValidation';
import type {
  SessionFormInput,
  SessionFormValues,
} from '@/features/asisten/sessionFormValidation';
import { useKelasList, useSyncState } from '@/store/appStore';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

/** id membuat Banner di-mount ulang agar pesan yang sama tetap diumumkan pembaca layar. */
export type SessionFormFeedback = { id: number; message: string };

export type SessionFormProps = {
  onSubmit: (input: SessionFormInput) => void;
  submitting?: boolean;
  /** Default "Buat sesi". */
  submitLabel?: string;
  /** Pesan gagal simpan dari layar; tampil sebagai Banner danger di atas tombol. */
  submitError?: SessionFormFeedback | null;
  /** Ada nilai = tombol kirim nonaktif dan teks ini menjelaskan alasannya, mis. offline. */
  disabledHint?: string;
  /** Isian awal, mis. dari sesi yang diubah. Hanya dibaca saat mount. */
  initialValues?: SessionFormValues;
  /** Kolom yang tampil non-aktif, mis. saat sesi Dibuka (FR-18). */
  lockedFields?: readonly LockableField[];
  /** Keterangan singkat di bawah kolom yang dikunci. */
  lockedHint?: string;
};

export type LockableField = 'praktikum' | 'kelas' | 'tanggal' | 'jamMulai';

type ChoiceGroupProps = {
  label: string;
  options: readonly string[];
  value: string | null;
  onChange: (value: string) => void;
  error?: string;
  /** Pengganti chip saat belum ada pilihan, mis. daftar kelas masih kosong. */
  emptyText?: string;
  disabled?: boolean;
  hint?: string;
};

// Urutan pilihan stabil apa pun urutan dokumen kelasPraktikum dari listener.
const byName = (a: string, b: string) => a.localeCompare(b, 'id');

// Label dan pesan error meniru TextField agar kolom pilihan sejajar dengan kolom ketik.
function ChoiceGroup({
  label,
  options,
  value,
  onChange,
  error,
  emptyText,
  disabled = false,
  hint,
}: ChoiceGroupProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {options.length === 0 && emptyText ? (
        <Text style={styles.hint}>{emptyText}</Text>
      ) : (
        <View role="radiogroup" aria-label={label} style={styles.chips}>
          {options.map((option) => (
            <Chip
              key={option}
              label={option}
              selected={value === option}
              onPress={() => onChange(option)}
              disabled={disabled}
            />
          ))}
        </View>
      )}
      {error ? (
        <Text aria-live="polite" style={styles.error}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

// Pilihan yang sedang terpasang tetap tampil walau sudah tidak ada di kelasPraktikum.
function withCurrent(options: string[], current: string | null): string[] {
  return current && !options.includes(current) ? [current, ...options] : options;
}

export function SessionForm({
  onSubmit,
  submitting = false,
  submitLabel = 'Buat sesi',
  submitError,
  disabledHint,
  initialValues,
  lockedFields = [],
  lockedHint,
}: SessionFormProps) {
  const kelasList = useKelasList();
  const kelasSync = useSyncState('kelas');
  const [values, setValues] = useState<SessionFormValues>(
    () => initialValues ?? emptySessionFormValues(),
  );
  const isLocked = (field: LockableField) => lockedFields.includes(field);
  // Pasangan praktikum dan kelas yang dikunci tidak dikirim ulang, jadi tidak perlu dicek.
  const pairLocked = lockedFields.includes('praktikum') && lockedFields.includes('kelas');
  // Error baru tampil setelah submit pertama, lalu ikut nilai terbaru agar hilang begitu diperbaiki.
  const [attempted, setAttempted] = useState(false);

  // Pilihan praktikum dan kelas berasal dari kelasPraktikum (FR-04), bukan daftar tetap.
  const praktikumOptions = useMemo(
    () =>
      withCurrent(
        [...new Set(kelasList.map((item) => item.praktikum))].sort(byName),
        values.praktikum,
      ),
    [kelasList, values.praktikum],
  );
  const kelasOptions = useMemo(
    () =>
      withCurrent(
        kelasList
          .filter((item) => item.praktikum === values.praktikum)
          .map((item) => item.kelas)
          .sort(byName),
        values.kelas,
      ),
    [kelasList, values.praktikum, values.kelas],
  );

  const result = useMemo(
    () => validateSessionForm(values, pairLocked ? undefined : kelasList),
    [values, kelasList, pairLocked],
  );
  const errors = attempted && !result.ok ? result.errors : {};
  const showValidationBanner = attempted && !result.ok;

  function setField<K extends keyof SessionFormValues>(key: K, value: SessionFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function setPraktikum(praktikum: string) {
    setValues((current) => {
      // Kelas yang tidak ada di praktikum baru dikosongkan agar pasangan selalu valid.
      const kelasStillValid = kelasList.some(
        (item) => item.praktikum === praktikum && item.kelas === current.kelas,
      );
      return { ...current, praktikum, kelas: kelasStillValid ? current.kelas : null };
    });
  }

  function handleSubmit() {
    setAttempted(true);
    if (result.ok) {
      onSubmit(result.input);
    }
  }

  const noKelasText =
    kelasSync === 'loading' ? 'Memuat daftar kelas praktikum…' : 'Belum ada kelas praktikum.';

  return (
    <View style={styles.form}>
      <View style={styles.fields}>
        <ChoiceGroup
          label="Praktikum"
          options={praktikumOptions}
          value={values.praktikum}
          onChange={setPraktikum}
          error={errors.praktikum}
          emptyText={noKelasText}
          disabled={isLocked('praktikum')}
          hint={isLocked('praktikum') ? lockedHint : undefined}
        />
        <ChoiceGroup
          label="Kelas"
          options={kelasOptions}
          value={values.kelas}
          onChange={(value) => setField('kelas', value)}
          error={errors.kelas}
          emptyText={values.praktikum ? noKelasText : 'Pilih praktikum lebih dulu.'}
          disabled={isLocked('kelas')}
          hint={isLocked('kelas') ? lockedHint : undefined}
        />
        <TextField
          label="Topik"
          value={values.topik}
          onChangeText={(text) => setField('topik', text)}
          placeholder="Mis. Navigasi Expo Router"
          error={errors.topik}
          maxLength={TOPIK_MAX_LENGTH}
          autoCapitalize="sentences"
        />
        <TextField
          label="Ruang"
          value={values.ruang}
          onChangeText={(text) => setField('ruang', text)}
          placeholder="Mis. Lab 2"
          error={errors.ruang}
          maxLength={RUANG_MAX_LENGTH}
          autoCapitalize="sentences"
        />
        <TextField
          label="Tanggal"
          value={values.tanggal}
          onChangeText={(text) => setField('tanggal', text)}
          hint={isLocked('tanggal') ? lockedHint : 'Contoh: 28/10/2026'}
          error={errors.tanggal}
          keyboardType="numeric"
          maxLength={10}
          disabled={isLocked('tanggal')}
        />
        <TextField
          label="Jam mulai"
          value={values.jamMulai}
          onChangeText={(text) => setField('jamMulai', text)}
          hint={isLocked('jamMulai') ? lockedHint : 'Contoh: 09.00'}
          error={errors.jamMulai}
          keyboardType="numeric"
          maxLength={5}
          disabled={isLocked('jamMulai')}
        />
        <TextField
          label="Jam selesai"
          value={values.jamSelesai}
          onChangeText={(text) => setField('jamSelesai', text)}
          hint="Contoh: 11.00"
          error={errors.jamSelesai}
          keyboardType="numeric"
          maxLength={5}
        />
      </View>

      <View style={styles.actions}>
        {showValidationBanner ? (
          <Banner
            tone="danger"
            message="Ada isian yang belum benar. Periksa pesan di tiap kolom."
          />
        ) : submitError ? (
          <Banner key={submitError.id} tone="danger" message={submitError.message} />
        ) : null}
        <Button
          label={submitLabel}
          onPress={handleSubmit}
          loading={submitting}
          disabled={disabledHint !== undefined}
        />
        {disabledHint ? <Text style={styles.hint}>{disabledHint}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.xl },
  fields: { gap: spacing.md },
  field: { gap: spacing.sm },
  label: { ...typography.label, color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  hint: { ...typography.caption, color: colors.textMuted },
  error: { ...typography.caption, color: colors.feedback.danger.text },
  actions: { gap: spacing.md },
});
