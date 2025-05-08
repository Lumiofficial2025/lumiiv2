import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import { textStyles } from '@/components/TextStyles';
import { supabase } from '@/lib/supabase';
import { X as Close, Camera, Link as LinkIcon, AtSign, User } from 'lucide-react-native';
import { AvatarUpload } from '@/components/AvatarUpload';

export default function EditProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageSource, setImageSource] = useState<'camera' | 'library'>('library');
  const [profile, setProfile] = useState({
    name: '',
    username: '',
    bio: '',
    website: '',
    avatar_url: '',
    avatar_version: 1,
  });

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const getAvatarUrl = (url: string, version?: number) => {
    if (!url) return null;
    const baseUrl = url;
    return version ? `${baseUrl}?v=${version}` : baseUrl;
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.replace('/(auth)/sign-in');
        return;
      }

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) throw profileError;

      setProfile({
        name: data?.name || '',
        username: session.user.email ? `@${session.user.email.split('@')[0]}` : '@username',
        bio: data?.bio || '',
        website: data?.website || '',
        avatar_url: getAvatarUrl(
          data?.avatar_url || 'https://images.pexels.com/photos/3771839/pexels-photo-3771839.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
          data?.avatar_version
        ),
        avatar_version: data?.avatar_version || 1,
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('No authenticated user');
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          name: profile.name,
          bio: profile.bio,
          website: profile.website,
          updated_at: new Date().toISOString(),
        });

      if (updateError) throw updateError;

      router.back();
    } catch (error: any) {
      console.error('Error saving profile:', error);
      setError(error?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Close size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[textStyles.h5, { color: colors.text }]}>Edit Profile</Text>
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={[textStyles.labelMedium, { color: 'white' }]}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
            <Text style={[textStyles.bodySmall, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        <View style={styles.avatarSection}>
          <AvatarUpload
            url={profile.avatar_url}
            imageSource={imageSource}
            onUpload={(url) => {
              setProfile(prev => ({ ...prev, avatar_url: url }));
              setError(null);
            }}
            size={96}
          />
          <View style={styles.imageSourceButtons}>
            <TouchableOpacity
              style={[
                styles.imageSourceButton,
                { backgroundColor: colors.card, borderColor: colors.border },
                imageSource === 'library' && { backgroundColor: colors.primary }
              ]}
              onPress={() => setImageSource('library')}
            >
              <Text style={[
                textStyles.labelSmall,
                { color: imageSource === 'library' ? 'white' : colors.text }
              ]}>
                Library
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.imageSourceButton,
                { backgroundColor: colors.card, borderColor: colors.border },
                imageSource === 'camera' && { backgroundColor: colors.primary }
              ]}
              onPress={() => setImageSource('camera')}
            >
              <Text style={[
                textStyles.labelSmall,
                { color: imageSource === 'camera' ? 'white' : colors.text }
              ]}>
                Camera
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputContainer}>
            <View style={styles.inputLabel}>
              <User size={20} color={colors.secondaryText} />
              <Text style={[textStyles.labelMedium, { color: colors.secondaryText, marginLeft: 8 }]}>
                Name
              </Text>
            </View>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                }
              ]}
              value={profile.name}
              onChangeText={(text) => setProfile(prev => ({ ...prev, name: text }))}
              placeholder="Add your name"
              placeholderTextColor={colors.secondaryText}
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputLabel}>
              <AtSign size={20} color={colors.secondaryText} />
              <Text style={[textStyles.labelMedium, { color: colors.secondaryText, marginLeft: 8 }]}>
                Username
              </Text>
            </View>
            <View style={[styles.usernameContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[textStyles.bodyMedium, { color: colors.secondaryText }]}>
                {profile.username}
              </Text>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputLabel}>
              <Text style={[textStyles.labelMedium, { color: colors.secondaryText }]}>Bio</Text>
            </View>
            <TextInput
              style={[
                styles.input,
                styles.bioInput,
                { 
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                }
              ]}
              value={profile.bio}
              onChangeText={(text) => setProfile(prev => ({ ...prev, bio: text }))}
              placeholder="Tell your story..."
              placeholderTextColor={colors.secondaryText}
              multiline
              numberOfLines={Platform.OS === 'ios' ? 0 : 4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputLabel}>
              <LinkIcon size={20} color={colors.secondaryText} />
              <Text style={[textStyles.labelMedium, { color: colors.secondaryText, marginLeft: 8 }]}>
                Website
              </Text>
            </View>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                }
              ]}
              value={profile.website}
              onChangeText={(text) => setProfile(prev => ({ ...prev, website: text }))}
              placeholder="Add your website"
              placeholderTextColor={colors.secondaryText}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
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
  saveButton: {
    backgroundColor: '#FF3050',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  content: {
    flex: 1,
  },
  errorContainer: {
    margin: 16,
    padding: 12,
    borderRadius: 8,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  formSection: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  bioInput: {
    height: Platform.OS === 'ios' ? 100 : undefined,
    paddingTop: 12,
  },
  usernameContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  imageSourceButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  imageSourceButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
});