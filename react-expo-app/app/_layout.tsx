import { Stack, SplashScreen, useSegments, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../lib/AuthContext';

// Keep the splash screen visible until the session check is complete
SplashScreen.preventAutoHideAsync();

// This component handles the actual navigation logic based on auth state
function InitialLayout() {
  // Get the router instance
  const router = useRouter(); 
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  
  // Check if we are currently inside the (auth) route group
  const inAuthGroup = segments[0] === '(auth)';

  // 1. Hide the splash screen once loading is complete
  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  // 2. Handle the redirect logic
  useEffect(() => {
    if (!isLoading) {
      if (user && inAuthGroup) {
        // User is logged in AND is on an auth screen (login/signup), redirect to home
        router.replace('/(app)');
      } else if (!user && !inAuthGroup) {
        // User is NOT logged in AND is on an app screen (home), redirect to login
        router.replace('/(auth)/login');
      }
    }
  }, [user, isLoading, inAuthGroup]);

  // Show nothing while the initial check is running
  if (isLoading) {
    return null;
  }

  return (
    <Stack>
      {/* Define your main route groups/stacks */}
      <Stack.Screen name="(app)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
    </Stack>
  );
}

// This is the root component that provides the AuthContext
export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
}
