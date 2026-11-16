import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { TextField } from '@/components/ui/TextField';
import {
  KELAS_MAX_LENGTH,
  PRAKTIKUM_MAX_LENGTH,
  PRAKTIKUM_MIN_LENGTH,
  emptyKelasFormValues,
  validateKelasForm,
} from '@/features/asisten/kelasValidation';
import type { KelasFormInput, KelasFormValues } from '@/features/asisten/kelasValidation';
import { useKelasList } from '@/store/appStore';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

/** id membuat Banner di-mount ulang agar pesan yang sama tetap diumumkan pembaca layar. */
export type KelasFormFeedback = { id: number; message: string };

export type KelasFormProps = {
  onSubmit: (input: KelasFormInput) => void;
  /** Default "Simpan kelas". */
  submitLabel?: string;
  submitting?: boolean;
  /** Pesan gagal simpan dari layar; tampil sebagai Banner danger di atas tombol. */
  submitError?: KelasFormFeedback | null;
  /** Ada nilai = tombol simpan nonaktif dan teks ini menjelaskan alasannya, mis. offline. */
  disabledHint?: string;
  /** Isian awal, mis. dari kelas yang diubah. Hanya dibaca saat mount. */
  initialValues?: KelasFormValues;
  /** id kelas yang diubah; dikecualikan dari cek pasangan unik. */
  editId?: string;
};

const byName = (a: string, b: string) => a.localeCompare(b, 'id');

export function KelasForm({
  onSubmit,
  submitLabel = 'Simpan kelas',
  submitting = false,
  submitError,
  disabledHint,
  initialValues,
  editId,
}: KelasFormProps) {
  const kelasList = useKelasList();
  const [values, setValues] = useState<KelasFormValues>(
    () => initialValues ?? emptyKelasFormValues(),
  );
  // Error baru tampil setelah submit pertama, lalu ikut nilai terbaru agar hilang begitu diperbaiki.
  const [attempted, setAttempted] = useState(false);

  const result = useMemo(
    () => validateKelasForm(values, kelasList, editId),
    [values, kelasList, editId],
  );
  const errors = attempted && !result.ok ? result.errors : {};

  // Nama praktikum yang sudah ada bisa dipilih agar kelas baru tidak lahir dengan ejaan berbeda.
  const praktikumOptions = useMemo(
    () => [...new Set(kelasList.map((item) => item.praktikum))].sort(byName),
    [kelasList],
  );

  function setField<K extends keyof KelasFormValues>(key: K, value: KelasFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit() {
    setAttempted(true);
    if (result.ok) onSubmit(result.input);
  }

  return (
    <View style={styles.form}>
      <View style={styles.fields}>
        <TextField
          label="Praktikum"
          value={values.praktikum}
          onChangeText={(text) => setField('praktikum', text)}
          placeholder="Mis. Pemrograman Mobile"
          hint={`${PRAKTIKUM_MIN_LENGTH}–${PRAKTIKUM_MAX_LENGTH} karakter.`}
          error={errors.praktikum}
          maxLength={PRAKTIKUM_MAX_LENGTH}
          autoCapitalize="words"
        />
        {praktikumOptions.length > 0 ? (
          <View style={styles.field}>
            <Text style={styles.hint}>Atau pilih praktikum yang sudah ada:</Text>
            <View role="radiogroup" aria-label="Praktikum yang sudah ada" style={styles.chips}>
              {praktikumOptions.map((option) => (
                <Chip
                  key={option}
                  label={option}
                  selected={values.praktikum.trim() === option}
                  onPress={() => setField('praktikum', option)}
                />
              ))}
            </View>
          </View>
        ) : null}
        <TextField
          label="Kelas"
          value={values.kelas}
          onChangeText={(text) => setField('kelas', text)}
          placeholder="Mis. A"
          hint={`1–${KELAS_MAX_LENGTH} karakter, disimpan dengan huruf besar.`}
          error={errors.kelas}
          maxLength={KELAS_MAX_LENGTH}
          autoCapitalize="characters"
          autoCorrect={false}
        />
      </View>

      <View style={styles.actions}>
        {attempted && !result.ok ? (
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
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  hint: { ...typography.caption, color: colors.textMuted },
  actions: { gap: spacing.md },
});
