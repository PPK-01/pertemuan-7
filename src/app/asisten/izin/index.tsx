import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppBar } from '@/components/ui/AppBar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { colors } from '@/theme/colors';

// Kerangka sementara agar tombol "Izin" di beranda punya tujuan; daftar dan filter izin
// (FR-25) diisi di E-09.
const goBackToList = () => (router.canGoBack() ? router.back() : router.replace('/asisten'));

export default function AsistenIzinListScreen() {
  return (
    <View style={styles.container}>
      <AppBar subtitle="Izin" canGoBack onGoBack={goBackToList} />
      <Screen edges={['left', 'right', 'bottom']}>
        <EmptyState title="Daftar izin sedang disiapkan" />
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
