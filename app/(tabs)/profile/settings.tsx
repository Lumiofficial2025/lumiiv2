import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import { textStyles } from '@/components/TextStyles';
import { X as Close, ChevronRight, Bell, Lock, Shield, CircleHelp as HelpCircle, Info, LogOut, Palette, Globe as Globe2, UserCog, Bell as BellRing, ShieldCheck } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [privateAccount, setPrivateAccount] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSigningOut(true);
              const { error } = await supabase.auth.signOut();
              if (error) throw error;
              router.replace('/(auth)/sign-in');
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            } finally {
              setIsSigningOut(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderSettingsItem = (
    icon: React.ReactNode,
    title: string,
    subtitle?: string,
    onPress?: () => void,
    rightElement?: React.ReactNode,
    destructive?: boolean
  ) => (
    <TouchableOpacity
      style={[styles.settingsItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={!onPress}
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
      {rightElement || (onPress && <ChevronRight size={20} color={colors.secondaryText} />)}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Close size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[textStyles.h5, { color: colors.text }]}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={[textStyles.labelMedium, { color: colors.secondaryText, marginBottom: 8 }]}>
            Account
          </Text>
          {renderSettingsItem(
            <UserCog size={24} color={colors.text} />,
            'Account Settings',
            'Manage your account details and security',
            () => router.push('/profile/account/')
          )}
          {renderSettingsItem(
            <BellRing size={24} color={colors.text} />,
            'Notifications',
            'Manage your notification preferences',
            undefined,
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="white"
            />
          )}
          {renderSettingsItem(
            <Lock size={24} color={colors.text} />,
            'Privacy',
            'Control your account privacy',
            undefined,
            <Switch
              value={privateAccount}
              onValueChange={setPrivateAccount}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="white"
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={[textStyles.labelMedium, { color: colors.secondaryText, marginBottom: 8 }]}>
            Preferences
          </Text>
          {renderSettingsItem(
            <Globe2 size={24} color={colors.text} />,
            'Language',
            'Choose your preferred language',
            () => console.log('Language')
          )}
          {renderSettingsItem(
            <Palette size={24} color={colors.text} />,
            'Theme',
            'Customize app appearance',
            () => console.log('Theme')
          )}
        </View>

        <View style={styles.section}>
          <Text style={[textStyles.labelMedium, { color: colors.secondaryText, marginBottom: 8 }]}>
            Security
          </Text>
          {renderSettingsItem(
            <ShieldCheck size={24} color={colors.text} />,
            'Security Settings',
            'Manage your security preferences',
            () => console.log('Security')
          )}
          {renderSettingsItem(
            <Shield size={24} color={colors.text} />,
            'Privacy Policy',
            'Read our privacy policy',
            () => console.log('Privacy Policy')
          )}
        </View>

        <View style={styles.section}>
          <Text style={[textStyles.labelMedium, { color: colors.secondaryText, marginBottom: 8 }]}>
            Support
          </Text>
          {renderSettingsItem(
            <HelpCircle size={24} color={colors.text} />,
            'Help Center',
            'Get help and support',
            () => console.log('Help')
          )}
          {renderSettingsItem(
            <Info size={24} color={colors.text} />,
            'About',
            'Learn more about our app',
            () => console.log('About')
          )}
        </View>

        <View style={styles.section}>
          <Text style={[textStyles.labelMedium, { color: colors.secondaryText, marginBottom: 8 }]}>
            Account
          </Text>
          {renderSettingsItem(
            <LogOut size={24} color={colors.error} />,
            isSigningOut ? 'Signing out...' : 'Sign Out',
            'Sign out of your account',
            handleSignOut,
            undefined,
            true
          )}
        </View>

        <Text style={[textStyles.caption, { color: colors.secondaryText, textAlign: 'center', marginVertical: 20 }]}>
          Version 1.0.0
        </Text>
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