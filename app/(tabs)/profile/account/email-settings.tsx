import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import { textStyles } from '@/components/TextStyles';
import { X as Close, Mail } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function EmailSettingsScreen() {
  const [email, setEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  useEffect(() => {
    fetchUserEmail();
  }, []);

  const fetchUserEmail = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      setEmail(user.email);
    }
  };

  const handleUpdateEmail = async () => {
    try {
      setLoading(true);

      if (!newEmail.trim()) {
        Alert.alert('Error', 'Please enter a new email address');
        return;
      }

      const { error } = await supabase.auth.updateUser({ 
        email: newEmail 
      });

      if (error) throw error;

      Alert.alert(
        'Verification Required',
        'Please check your new email address for a verification link',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Close size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[textStyles.h5, { color: colors.text }]}>Email Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={[textStyles.labelMedium, { color: colors.secondaryText }]}>
            Current Email
          </Text>
          <View style={[styles.currentEmail, { backgroundColor: colors.card }]}>
            <Mail size={20} color={colors.secondaryText} />
            <Text style={[textStyles.bodyMedium, { color: colors.text, marginLeft: 12 }]}>
              {email}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[textStyles.labelMedium, { color: colors.secondaryText }]}>
            New Email Address
          </Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={newEmail}
              onChangeText={setNewEmail}
              placeholder="Enter new email address"
              placeholderTextColor={colors.secondaryText}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary },
            loading && styles.buttonDisabled
          ]}
          onPress={handleUpdateEmail}
          disabled={loading}
        >
          <Text style={[textStyles.buttonMedium, { color: 'white' }]}>
            {loading ? 'Updating...' : 'Update Email'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  currentEmail: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  inputWrapper: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 8,
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});