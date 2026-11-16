import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppBar } from '@/components/ui/AppBar';
import { Screen } from '@/components/ui/Screen';
import { SessionForm } from '@/features/asisten/SessionForm';
import type { SessionFormFeedback } from '@/features/asisten/SessionForm';
import { OFFLINE_ACTION_HINT, sessionErrorMessage } from '@/features/asisten/sessionErrorMessage';
import type { SessionFormInput } from '@/features/asisten/sessionFormValidation';
import { useAppStore, useCurrentUser, useIsOnline } from '@/store/appStore';
import { spacing } from '@/theme/spacing';

export default function AsistenBuatSesiScreen() {
  const currentUser = useCurrentUser();
  const isOnline = useIsOnline();
  const createSession = useAppStore((state) => state.createSession);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<SessionFormFeedback | null>(null);
  // State baru berlaku di render berikutnya; ref menahan tekanan beruntun sebelum itu.
  const submittingRef = useRef(false);

  async function handleSubmit(input: SessionFormInput) {
    // Guard di asisten/_layout.tsx menjamin currentUser asisten terisi.
    if (submittingRef.current || !currentUser) return;
    submittingRef.current = true;
    setSubmitting(true);

    const res = await createSession({ ...input, createdBy: currentUser.id });
    if (res.ok) {
      // replace, bukan push: back dari detail kembali ke daftar, bukan ke form.
      // Ref tetap terkunci karena layar ini segera diganti.
      router.replace({ pathname: '/asisten/sesi/[id]', params: { id: res.data.id } });
      return;
    }

    // Isi form tetap di SessionForm; asisten cukup menekan tombol lagi.
    submittingRef.current = false;
    setSubmitting(false);
    setSubmitError((prev) => ({
      id: (prev?.id ?? 0) + 1,
      message: sessionErrorMessage(res.code, 'create'),
    }));
  }

  return (
    <View style={styles.container}>
      <AppBar subtitle="Buat sesi" canGoBack onGoBack={() => router.back()} />
      <Screen edges={['left', 'right', 'bottom']}>
        <View style={styles.content}>
          <SessionForm
            onSubmit={handleSubmit}
            submitting={submitting}
            submitError={submitError}
            disabledHint={isOnline ? undefined : OFFLINE_ACTION_HINT}
          />
        </View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingVertical: spacing.md,
  },
});
