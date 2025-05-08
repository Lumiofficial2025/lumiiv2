import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import { textStyles } from '@/components/TextStyles';
import { X as Close, Eye, EyeOff } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const handleChangePassword = async () => {
    try {
      setLoading(true);

      if (newPassword !== confirmPassword) {
        Alert.alert('Error', 'New passwords do not match');
        return;
      }

      if (newPassword.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters');
        return;
      }

      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });

      if (error) throw error;

      Alert.alert('Success', 'Password updated successfully');
      router.back();
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
        <Text style={[textStyles.h5, { color: colors.text }]}>Change Password</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.inputContainer}>
          <Text style={[textStyles.labelMedium, { color: colors.secondaryText }]}>
            Current Password
          </Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              secureTextEntry={!showCurrentPassword}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              placeholderTextColor={colors.secondaryText}
            />
            <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
              {showCurrentPassword ? (
                <EyeOff size={20} color={colors.secondaryText} />
              ) : (
                <Eye size={20} color={colors.secondaryText} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={[textStyles.labelMedium, { color: colors.secondaryText }]}>
            New Password
          </Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              secureTextEntry={!showNewPassword}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              placeholderTextColor={colors.secondaryText}
            />
            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
              {showNewPassword ? (
                <EyeOff size={20} color={colors.secondaryText} />
              ) : (
                <Eye size={20} color={colors.secondaryText} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={[textStyles.labelMedium, { color: colors.secondaryText }]}>
            Confirm New Password
          </Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              placeholderTextColor={colors.secondaryText}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? (
                <EyeOff size={20} color={colors.secondaryText} />
              ) : (
                <Eye size={20} color={colors.secondaryText} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary },
            loading && styles.buttonDisabled
          ]}
          onPress={handleChangePassword}
          disabled={loading}
        >
          <Text style={[textStyles.buttonMedium, { color: 'white' }]}>
            {loading ? 'Updating...' : 'Update Password'}
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
  inputContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  input: {
    flex: 1,
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