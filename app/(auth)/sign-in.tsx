import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import { textStyles } from '@/components/TextStyles';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, ArrowRight } from 'lucide-react-native';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.replace('/(tabs)');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {/* Logo and Welcome Text */}
        <View style={styles.header}>
          <Image
            source={{ uri: 'https://images.pexels.com/photos/3943904/pexels-photo-3943904.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2' }}
            style={styles.logo}
          />
          <Text style={[textStyles.h4, { color: colors.text, marginTop: 24 }]}>Welcome back!</Text>
          <Text style={[textStyles.bodyMedium, { color: colors.secondaryText, marginTop: 8 }]}>
            Sign in to continue
          </Text>
        </View>

        {/* Error Message */}
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
            <Text style={[textStyles.bodySmall, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        {/* Sign In Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Mail size={20} color={colors.secondaryText} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Email"
                placeholderTextColor={colors.secondaryText}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Lock size={20} color={colors.secondaryText} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Password"
                placeholderTextColor={colors.secondaryText}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.signInButton, { backgroundColor: colors.primary }, loading && styles.signInButtonDisabled]}
            onPress={handleSignIn}
            disabled={loading}
          >
            <Text style={[textStyles.buttonMedium, styles.signInButtonText]}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Text>
            {!loading && <ArrowRight size={20} color="white" />}
          </TouchableOpacity>
        </View>

        {/* Sign Up Link */}
        <View style={styles.footer}>
          <Text style={[textStyles.bodyMedium, { color: colors.secondaryText }]}>
            Don't have an account?
          </Text>
          <TouchableOpacity onPress={() => router.push('/sign-up')}>
            <Text style={[textStyles.labelMedium, { color: colors.primary, marginLeft: 4 }]}>
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    gap: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  signInButtonDisabled: {
    opacity: 0.6,
  },
  signInButtonText: {
    color: 'white',
    marginRight: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
});