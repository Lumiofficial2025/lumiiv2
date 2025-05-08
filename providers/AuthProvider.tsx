import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { router, useRootNavigation, useSegments } from 'expo-router';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: any;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  profile: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const isMounted = useRef(false);
  const navigationAttempts = useRef(0);
  const rootNavigation = useRootNavigation();
  const segments = useSegments();

  const isNavigationReady = rootNavigation?.isReady ?? false;

  // Reset navigation attempts when segments change
  useEffect(() => {
    navigationAttempts.current = 0;
  }, [segments]);

  const clearAuthState = async () => {
    setSession(null);
    setUser(null);
    setProfile(null);
    
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('supabase.auth.refreshToken');
    } catch (error) {
      console.error('Error during auth state cleanup:', error);
    }
  };

  const handleAuthError = async (error: any) => {
    console.error('Auth error encountered:', error?.message || error);
    
    if (error?.message?.includes('Invalid Refresh Token') || 
        error?.message?.includes('refresh_token_not_found') ||
        error?.message?.includes('session_not_found') ||
        error?.status === 403 ||
        error?.message?.includes('JWT expired')) {
      await clearAuthState();
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) {
        console.warn('No valid session found before profile fetch');
        await clearAuthState();
        return null;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.status === 403) {
          await handleAuthError({ status: 403 });
          return null;
        }
        throw error;
      }

      if (profile) {
        return {
          ...profile,
          username: `@${profile.name.toLowerCase().replace(/\s+/g, '')}`
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      await handleAuthError(error);
      return null;
    }
  };

  const handleNavigation = () => {
    if (!isNavigationReady || !segments || !isMounted.current || navigationAttempts.current > 5) {
      return;
    }

    navigationAttempts.current += 1;
    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';
    
    setTimeout(() => {
      if (!session) {
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
    }, 50 * navigationAttempts.current); // Exponential backoff
  };

  // Handle navigation when segments or auth state changes
  useEffect(() => {
    if (!isNavigationReady || loading) {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === 'onboarding';

    if (!session) {
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
  }, [isNavigationReady, loading, session, profile, segments]);

  useEffect(() => {
    isMounted.current = true;

    const initSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
          await handleAuthError(error);
          return;
        }

        const currentUser = session?.user;
        let userProfile = null;

        if (currentUser) {
          userProfile = await fetchUserProfile(currentUser.id);
          if (!userProfile) {
            console.warn('Failed to fetch user profile during initialization');
            await handleAuthError({ status: 403 });
            return;
          }
        }

        setSession(session);
        setUser(currentUser);
        setProfile(userProfile);
      } catch (error) {
        console.error('Error during session initialization:', error);
        await handleAuthError(error);
      } finally {
        setLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, 'Session:', session?.user?.id || 'none');
      
      try {
        if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
          console.log('User signed out or deleted, clearing auth state');
          await clearAuthState();
          
          if (isNavigationReady && isMounted.current) {
            requestAnimationFrame(() => {
              router.replace('/(auth)/sign-in');
            });
          }
          return;
        }

        if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed successfully');
        }

        const currentUser = session?.user ?? null;
        let userProfile = null;

        if (currentUser) {
          userProfile = await fetchUserProfile(currentUser.id);
          if (!userProfile) {
            console.warn('Failed to fetch user profile after auth state change');
            await handleAuthError({ status: 403 });
            return;
          }
        }

        setSession(session);
        setUser(currentUser);
        setProfile(userProfile);
      } catch (error) {
        console.error('Error handling auth state change:', error);
        await handleAuthError(error);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      console.log('Cleaning up auth subscription');
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, [isNavigationReady, segments]);

  return (
    <AuthContext.Provider value={{ user, session, loading, profile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};