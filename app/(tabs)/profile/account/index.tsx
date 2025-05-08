import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import { textStyles } from '@/components/TextStyles';
import { X as Close, Lock, Mail, Phone, Link2, Trash2, ChevronRight } from 'lucide-react-native';

export default function AccountSettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const renderSettingsItem = (
    icon: React.ReactNode,
    title: string,
    subtitle?: string,
    onPress?: () => void,
    destructive?: boolean
  ) => (
    <TouchableOpacity
      style={[styles.settingsItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
    >
      <View style={styles.settingsItemLeft}>
        {icon}
        <View style={styles.settingsItemText}>
          <Text
            style={[
              textStyles.bodyMedium,
              { color: destructive ? colors.error : colors.text }
            ]}
          >
            {title}
          </Text>
          {subtitle && (
            <Text style={[textStyles.caption, { color: colors.secondaryText }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <ChevronRight size={20} color={destructive ? colors.error : colors.secondaryText} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Close size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[textStyles.h5, { color: colors.text }]}>Account Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[textStyles.labelMedium, { color: colors.secondaryText, marginBottom: 8 }]}>
            Security
          </Text>
          {renderSettingsItem(
            <Lock size={24} color={colors.text} />,
            'Change Password',
            'Update your account password',
            () => router.push('/profile/account/change-password')
          )}
        </View>

        <View style={styles.section}>
          <Text style={[textStyles.labelMedium, { color: colors.secondaryText, marginBottom: 8 }]}>
            Contact Information
          </Text>
          {renderSettingsItem(
            <Mail size={24} color={colors.text} />,
            'Email Address',
            'Update your email address',
            () => router.push('/profile/account/email-settings')
          )}
          {renderSettingsItem(
            <Phone size={24} color={colors.text} />,
            'Phone Number',
            'Add or update your phone number',
            () => router.push('/profile/account/phone-settings')
          )}
        </View>

        <View style={styles.section}>
          <Text style={[textStyles.labelMedium, { color: colors.secondaryText, marginBottom: 8 }]}>
            Connected Accounts
          </Text>
          {renderSettingsItem(
            <Link2 size={24} color={colors.text} />,
            'Manage Connected Accounts',
            'Link or unlink social accounts',
            () => router.push('/profile/account/connected-accounts')
          )}
        </View>

        <View style={styles.section}>
          <Text style={[textStyles.labelMedium, { color: colors.secondaryText, marginBottom: 8 }]}>
            Account Management
          </Text>
          {renderSettingsItem(
            <Trash2 size={24} color={colors.error} />,
            'Delete Account',
            'Permanently delete your account',
            () => router.push('/profile/account/delete-account'),
            true
          )}
        </View>
      </ScrollView>
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
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsItemText: {
    marginLeft: 12,
    flex: 1,
  },
});