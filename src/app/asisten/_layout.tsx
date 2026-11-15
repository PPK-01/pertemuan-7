import { Redirect, Stack } from 'expo-router';

import { useCurrentUser } from '@/store/appStore';
import { colors } from '@/theme/colors';

export default function AsistenLayout() {
  const currentUser = useCurrentUser();

  // Juga menangani "Keluar": logout() mengosongkan currentUser lalu guard ini mengarahkan ke /.
  if (currentUser?.role !== 'asisten') {
    return <Redirect href="/" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
