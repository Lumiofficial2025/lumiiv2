import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import { textStyles } from '@/components/TextStyles';
import { X as Close, Github, Twitter, ToggleLeft as Google, Facebook } from 'lucide-react-native';

export default function ConnectedAccountsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const connectedAccounts = [
    {
      id: 'github',
      name: 'GitHub',
      icon: <Github size={24} color={colors.text} />,
      connected: false,
    },
    {
      id: 'google',
      name: 'Google',
      icon: <Google size={24} color={colors.text} />,
      connected: true,
    },
    {
      id: 'twitter',
      name: 'Twitter',
      icon: <Twitter size={24} color={colors.text} />,
      connected: false,
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: <Facebook size={24} color={colors.text} />,
      connected: false,
    },
  ];

  const handleConnect = (accountId: string) => {
    // Implement connection logic
    console.log(`Connect to ${accountId}`);
  };

  const handleDisconnect = (accountId: string) => {
    // Implement disconnection logic
    console.log(`Disconnect from ${accountId}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Close size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[textStyles.h5, { color: colors.text }]}>Connected Accounts</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={[textStyles.bodyMedium, { color: colors.secondaryText, marginBottom: 16 }]}>
          Connect your accounts to enable additional features and easier sign-in.
        </Text>

        {connectedAccounts.map((account) => (
          <View
            key={account.id}
            style={[styles.accountItem, { borderBottomColor: colors.border }]}
          >
            <View style={styles.accountInfo}>
              {account.icon}
              <Text style={[textStyles.bodyMedium, { color: colors.text, marginLeft: 12 }]}>
                {account.name}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: account.connected ? colors.card : colors.primary,
                  borderColor: account.connected ? colors.border : colors.primary,
                },
              ]}
              onPress={() =>
                account.connected
                  ? handleDisconnect(account.id)
                  : handleConnect(account.id)
              }
            >
              <Text
                style={[
                  textStyles.labelSmall,
                  { color: account.connected ? colors.text : 'white' },
                ]}
              >
                {account.connected ? 'Disconnect' : 'Connect'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        <Text style={[textStyles.caption, { color: colors.secondaryText, marginTop: 24 }]}>
          Note: Connecting or disconnecting accounts may affect your ability to sign in using these
          methods.
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
    padding: 16,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
});