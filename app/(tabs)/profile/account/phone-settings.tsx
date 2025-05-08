import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import { textStyles } from '@/components/TextStyles';
import { X as Close, Phone } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function PhoneSettingsScreen() {
  const [phone, setPhone] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [loading, setLoading] = useState(false);
  
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  useEffect(() => {
    fetchUserPhone();
  }, []);

  const fetchUserPhone = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.phone) {
      setPhone(user.phone);
    }
  };

  const handleUpdatePhone = async () => {
    try {
      setLoading(true);

      if (!newPhone.trim()) {
        Alert.alert('Error', 'Please enter a phone number');
        return;
      }

      const { error } = await supabase.auth.updateUser({ 
        phone: newPhone 
      });

      if (error) throw error;

      Alert.alert(
        'Success',
        'Phone number updated successfully',
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
        <Text style={[textStyles.h5, { color: colors.text }]}>Phone Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {phone ? (
          <View style={styles.section}>
            <Text style={[textStyles.labelMedium, { color: colors.secondaryText }]}>
              Current Phone Number
            </Text>
            <View style={[styles.currentPhone, { backgroundColor: colors.card }]}>
              <Phone size={20} color={colors.secondaryText} />
              <Text style={[textStyles.bodyMedium, { color: colors.text, marginLeft: 12 }]}>
                {phone}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={[textStyles.bodyMedium, { color: colors.secondaryText }]}>
              No phone number added yet
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[textStyles.labelMedium, { color: colors.secondaryText }]}>
            {phone ? 'New Phone Number' : 'Add Phone Number'}
          </Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={newPhone}
              onChangeText={setNewPhone}
              placeholder="Enter phone number"
              placeholderTextColor={colors.secondaryText}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary },
            loading && styles.buttonDisabled
          ]}
          onPress={handleUpdatePhone}
          disabled={loading}
        >
          <Text style={[textStyles.buttonMedium, { color: 'white' }]}>
            {loading ? 'Updating...' : phone ? 'Update Phone' : 'Add Phone'}
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
  currentPhone: {
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