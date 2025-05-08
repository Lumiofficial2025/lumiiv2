import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import { textStyles } from '@/components/TextStyles';
import { supabase } from '@/lib/supabase';
import { ArrowRight, User } from 'lucide-react-native';

export default function OnboardingScreen() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const handleCreateProfile = async () => {
    try {
      setLoading(true);

      if (!name.trim()) {
        Alert.alert('Error', 'Please enter your name');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Not authenticated');
        router.replace('/(auth)/sign-in');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          name: name.trim(),
          created_at: new Date().toISOString(),
        });

      if (error) throw error;

      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
          <Image
            source={{ uri: 'https://images.pexels.com/photos/3943904/pexels-photo-3943904.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2' }}
            style={styles.logo}
          />
          <Text style={[textStyles.h4, { color: colors.text, marginTop: 24 }]}>Complete Your Profile</Text>
          <Text style={[textStyles.bodyMedium, { color: colors.secondaryText, marginTop: 8, textAlign: 'center' }]}>
            Welcome! Let's set up your profile so others can find and connect with you.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <User size={20} color={colors.secondaryText} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Full Name"
                placeholderTextColor={colors.secondaryText}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
            onPress={handleCreateProfile}
            disabled={loading}
          >
            <Text style={[textStyles.buttonMedium, { color: 'white', marginRight: 8 }]}>
              {loading ? 'Creating Profile...' : 'Continue'}
            </Text>
            {!loading && <ArrowRight size={20} color="white" />}
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
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});