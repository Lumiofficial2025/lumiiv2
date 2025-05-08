import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import { textStyles } from '@/components/TextStyles';
import { X as Close, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function DeleteAccountScreen() {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const handleDeleteAccount = async () => {
    if (confirmation !== 'DELETE') {
      Alert.alert('Error', 'Please type DELETE to confirm account deletion');
      return;
    }

    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);

              const { error } = await supabase.auth.signOut();
              if (error) throw error;

              router.replace('/(auth)/sign-in');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Close size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[textStyles.h5, { color: colors.error }]}>Delete Account</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={[styles.warningBox, { backgroundColor: colors.error + '20' }]}>
          <AlertTriangle size={24} color={colors.error} />
          <Text style={[textStyles.bodyMedium, { color: colors.error, marginLeft: 12 }]}>
            This action is permanent and cannot be undone
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[textStyles.bodyMedium, { color: colors.text }]}>
            Deleting your account will:
          </Text>
          <View style={styles.bulletPoints}>
            <Text style={[textStyles.bodyMedium, { color: colors.text }]}>
              • Permanently delete your profile and all associated data
            </Text>
            <Text style={[textStyles.bodyMedium, { color: colors.text }]}>
              • Remove all your posts, comments, and likes
            </Text>
            <Text style={[textStyles.bodyMedium, { color: colors.text }]}>
              • Cancel any active subscriptions
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[textStyles.labelMedium, { color: colors.secondaryText }]}>
            To confirm, type DELETE in all caps:
          </Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={confirmation}
              onChangeText={setConfirmation}
              placeholder="Type DELETE"
              placeholderTextColor={colors.secondaryText}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.deleteButton,
            { backgroundColor: colors.error },
            loading && styles.buttonDisabled
          ]}
          onPress={handleDeleteAccount}
          disabled={loading || confirmation !== 'DELETE'}
        >
          <Text style={[textStyles.buttonMedium, { color: 'white' }]}>
            {loading ? 'Deleting...' : 'Delete Account'}
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
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  bulletPoints: {
    marginTop: 12,
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
  deleteButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});