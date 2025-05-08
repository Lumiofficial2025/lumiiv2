import { Stack } from 'expo-router';

export default function AccountSettingsLayout() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right'
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="change-password" />
      <Stack.Screen name="email-settings" />
      <Stack.Screen name="phone-settings" />
      <Stack.Screen name="connected-accounts" />
      <Stack.Screen 
        name="delete-account" 
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal'
        }}
      />
    </Stack>
  );
}