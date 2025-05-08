import { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/providers/AuthProvider';
import { textStyles } from '@/components/TextStyles';

function MainLayout() {
  const { user, loading, profile } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isMounted.current || loading) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    // Defer navigation to next tick to ensure layout is mounted
    const performNavigation = () => {
      if (!isMounted.current) return;

      if (!user) {
        // If user is not authenticated and not in auth group, redirect to sign in
        if (!inAuthGroup) {
          router.replace('/(auth)/sign-in');
        }
      } else if (!profile) {
        // If authenticated but no profile and not in onboarding, redirect to onboarding
        if (!inOnboarding) {
          router.replace('/onboarding');
        }
      } else {
        // If authenticated with profile and in auth/onboarding, redirect to main app
        if (inAuthGroup || inOnboarding) {
          router.replace('/(tabs)');
        }
      }
    };

    // Use setTimeout instead of requestAnimationFrame for more reliable mounting check
    setTimeout(() => {
      performNavigation();
    }, 0);
  }, [user, loading, profile, segments]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF3050" />
        <Text style={[textStyles.bodyMedium, { marginTop: 10 }]}>Loading...</Text>
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <MainLayout />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});