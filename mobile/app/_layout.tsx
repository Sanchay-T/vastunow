import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initI18n } from '@/lib/i18n/config';
import UpdateGate from '@/components/UpdateGate';
import AppHeader from '@/components/ui/AppHeader';
import { COLORS } from '@/constants/colors';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Montserrat': require('@expo-google-fonts/montserrat/400Regular/Montserrat_400Regular.ttf'),
    'Montserrat-Medium': require('@expo-google-fonts/montserrat/500Medium/Montserrat_500Medium.ttf'),
    'Montserrat-SemiBold': require('@expo-google-fonts/montserrat/600SemiBold/Montserrat_600SemiBold.ttf'),
    'Montserrat-Bold': require('@expo-google-fonts/montserrat/700Bold/Montserrat_700Bold.ttf'),
    'Playfair Display': require('@expo-google-fonts/playfair-display/400Regular/PlayfairDisplay_400Regular.ttf'),
    'Playfair Display Bold': require('@expo-google-fonts/playfair-display/700Bold/PlayfairDisplay_700Bold.ttf'),
  });

  useEffect(() => {
    initI18n();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <UpdateGate>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <View style={styles.root}>
          <AppHeader />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: COLORS.background },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="analyze" />
            <Stack.Screen name="review" />
            <Stack.Screen name="report/[id]" />
          </Stack>
        </View>
      </SafeAreaProvider>
    </UpdateGate>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
});
