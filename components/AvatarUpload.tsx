import React, { useState } from 'react';
import {
  View,
  Image,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'lucide-react-native';
import { supabase, retryWithBackoff } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { toByteArray } from 'base64-js';
import * as FileSystem from 'expo-file-system';
import { captureException } from '@/lib/errorReporting';

interface AvatarUploadProps {
  url: string | null;
  onUpload: (url: string) => void;
  size?: number;
  imageSource?: 'camera' | 'library';
}

export function AvatarUpload({ url, onUpload, size = 96, imageSource = 'library' }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);

  const ensurePermission = async () => {
    if (Platform.OS === 'web') return true;

    try {
      const permissionInfo = imageSource === 'camera' 
        ? await ImagePicker.getCameraPermissionsAsync()
        : await ImagePicker.getMediaLibraryPermissionsAsync();
    
      if (permissionInfo.granted) {
        logger.info(`${imageSource} permission already granted`, 'avatar_upload');
        return true;
      }

      const permissionResult = imageSource === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      logger.info(`Permission status: ${permissionResult.status}`, 'avatar_upload');

      if (permissionResult.status !== 'granted') {
        Alert.alert(
          'Permission required',
          `We need ${imageSource === 'camera' ? 'camera' : 'photo library'} access to set your avatar.`,
          [
            { 
              text: 'Open Settings',
              onPress: () => ImagePicker.openSettings()
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
        return false;
      }
      return true;
    } catch (err) {
      logger.error('Error requesting permissions', err, 'avatar_upload');
      return false;
    }
  };

  const pickImage = async () => {
    try {
      logger.info('Starting image selection process', 'avatar_upload');
      
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        const fileSelected = new Promise((resolve) => {
          input.onchange = (e) => {
            const target = e.target as HTMLInputElement;
            const file = target.files?.[0];
            resolve(file || null);
          };
        });
        
        input.click();
        const file = await fileSelected;
        if (!file) {
          logger.info('No file selected', 'avatar_upload');
          return;
        }

        if (file.size > 5 * 1024 * 1024) {
          throw new Error('Image size must be less than 5MB');
        }

        const uri = URL.createObjectURL(file);
        await uploadAvatar(uri, file);
        return;
      }

      const hasPermission = await ensurePermission();
      if (!hasPermission) {
        logger.info('Permission not granted', 'avatar_upload');
        return;
      }

      const options: ImagePicker.ImagePickerOptions = {
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        allowsMultipleSelection: false,
      };

      logger.info(`Launching ${imageSource}`, 'avatar_upload');

      let result;
      if (imageSource === 'camera') {
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      logger.info('[avatar_upload] picker result', result);

      if (result.canceled) {
        logger.info('Image selection cancelled by user', 'avatar_upload');
        return;
      } else if (!result.assets?.[0]) {
        throw new Error('No image selected');
      }

      const { uri } = result.assets[0];
      logger.info('Image selected successfully', 'avatar_upload');

      // Get file info to check size
      const fileInfo = await FileSystem.getInfoAsync(uri);
      logger.info(`Image size: ${(fileInfo.size / 1024 / 1024).toFixed(2)}MB`, 'avatar_upload');

      if (fileInfo.size > 5 * 1024 * 1024) {
        Alert.alert(
          'File too large',
          'Please select an image smaller than 5MB',
          [{ text: 'OK' }]
        );
        return;
      }

      await uploadAvatar(uri);
    } catch (err: any) {
      captureException(err, {
        context: 'avatar_upload',
        action: 'pick_image',
        imageSource,
      });
      logger.error('Error picking image', err, 'avatar_upload');
      Alert.alert(
        'Error',
        err.message || `Failed to ${imageSource === 'camera' ? 'take photo' : 'select image'}`
      );
    }
  };

  const uploadAvatar = async (uri: string, webFile?: File) => {
    try {
      setUploading(true);
      logger.info('Starting avatar upload process', 'avatar_upload', {
        context: 'avatar_upload',
        uri: uri.substring(0, 50) + '...',
        isWebFile: !!webFile
      });

      const { data, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const user = data.user;

      // Early validation of user authentication
      if (!user) {
        const error = new Error('Authentication required');
        logger.error('No authenticated user found', error, 'avatar_upload', {
          context: 'authentication'
        });
        throw error;
      }

      // Validate user email
      if (!user.email) {
        const error = new Error('Email verification required');
        logger.error('User email not verified', error, 'avatar_upload', {
          context: 'authentication',
          userId: user.id
        });
        throw error;
      }

      logger.info('User authenticated successfully', 'avatar_upload', {
        userId: user.id,
        email: user.email
      });
      
      // Generate unique filename to prevent conflicts
      const timestamp = Date.now();
      const fileName = `${timestamp}.jpeg`;
      const filePath = `${user.id}/${fileName}`;

      logger.info('Starting upload process', {
        context: 'avatar_upload',
        timestamp,
        filePath
      });
      
      let contentType = 'image/jpeg';
      let binaryData;
      let blobSize;

      if (Platform.OS === 'web' && webFile) {
        const reader = new FileReader();
        binaryData = await new Promise((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(toByteArray(base64));
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(webFile);
        });
        contentType = webFile.type;
        blobSize = webFile.size;
        
        // Validate file type
        if (!['image/jpeg', 'image/png', 'image/gif'].includes(contentType)) {
          const error = new Error('Invalid file type. Please upload a JPEG, PNG, or GIF image.');
          logger.error('Invalid file type', error, 'avatar_upload', {
            contentType,
            allowedTypes: ['image/jpeg', 'image/png', 'image/gif']
          });
          throw error;
        }

        logger.info('Web file validated', 'avatar_upload', {
          type: contentType
        });
      } else {
        // For native platforms, read the file directly
        const base64Data = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64
        });
        binaryData = toByteArray(base64Data);
        blobSize = binaryData.length;
        
        logger.info('Image processed', {
          context: 'avatar_upload',
          type: contentType,
          size: blobSize
        });
      }

      if (blobSize > 5 * 1024 * 1024) {
        const error = new Error('File size must be less than 5MB');
        throw error;
      }
      
      logger.info('Starting Supabase upload', {
        context: 'avatar_upload',
        filePath,
        contentType,
        size: blobSize
      });

      const { error: uploadError } = await retryWithBackoff(
        async () => {
          const result = await supabase.storage
            .from('avatars')
            .upload(filePath, binaryData!, {
              contentType,
              cacheControl: '3600',
              upsert: true,
            });

          if (result.error) {
            logger.error('Upload attempt failed', {
              context: 'avatar_upload',
              error: result.error,
              statusCode: result.error.statusCode,
              message: result.error.message,
              details: result.error.details
            });
            throw result.error;
          }

          return result;
        },
        3, // Number of retries
        1000 // Initial delay in ms
      );

      if (uploadError) {
        logger.error('Upload failed', {
          context: 'avatar_upload',
          error: uploadError,
          statusCode: uploadError.statusCode,
          message: uploadError.message,
          details: uploadError.details
        });
        throw uploadError;
      }

      logger.info('Upload successful, getting public URL', 'avatar_upload', {
        filePath,
        userId: user.id
      });

      const { data: publicUrlData } = await supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      if (!publicUrlData.publicUrl) {
        const error = new Error('Failed to get public URL');
        logger.error('Public URL generation failed', error, 'avatar_upload', {
          userId: user.id,
          filePath,
          publicUrlData
        });
        throw error;
      }
      
      const publicUrl = `${publicUrlData.publicUrl}?v=${timestamp}`;

      logger.info('Updating profile with new avatar URL', 'avatar_upload');
      const { error: updateError, data: updateData } = await supabase
        .from('profiles')
        .update({ 
          avatar_url: publicUrl, 
          avatar_version: user.id ? parseInt(user.id.split('-')[0], 16) % 1000000 : Date.now() % 1000000,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        logger.error('Profile update failed', updateError, 'avatar_upload', {
          userId: user.id,
          publicUrl,
          error: {
            message: updateError.message,
            details: updateError.details,
            hint: updateError.hint,
            code: updateError.code
          }
        });
        throw updateError;
      }

      if (!updateData) {
        const error = new Error('Profile not found');
        logger.error('Profile update succeeded but no data returned', error, 'avatar_upload', {
          userId: user.id,
          publicUrl
        });
        throw error;
      }

      onUpload(publicUrl);
      logger.info(`Avatar upload completed successfully: ${publicUrl}`, 'avatar_upload');
    } catch (err: any) {
      captureException(err, {
        context: 'avatar_upload',
        action: 'upload_avatar',
        userId: (await supabase.auth.getUser()).data.user?.id,
        error: {
          message: err.message
        },
        errorDetails: err.details || err.stack
      });
      logger.error('Error uploading avatar', err, 'avatar_upload', {
        platform: Platform.OS,
        errorName: err.name,
        errorMessage: err.message,
        errorStack: err.stack,
        errorDetails: err.details
      });

      // Provide more specific error messages to the user
      const errorMessage = err.message?.includes('storage/quota_exceeded')
        ? 'Storage quota exceeded. Please try again later.'
        : err.message?.includes('auth')
        ? 'Please sign in again to upload your avatar.'
        : err.message?.includes('network')
        ? 'Network error. Please check your connection and try again.'
        : err.message?.includes('file type')
        ? 'Invalid file type. Please upload a JPEG, PNG, or GIF image.'
        : err.message?.includes('5MB')
        ? 'File size must be less than 5MB.'
        : err.message?.includes('Profile not found')
        ? 'Unable to update profile. Please try again.'
        : err.message || 'Failed to upload avatar';

      logger.info('Displaying error to user', 'avatar_upload', {
        errorMessage,
        originalError: err.message
      });

      Alert.alert('Upload error', errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={pickImage}
        disabled={uploading}
        style={({ pressed }) => [
          styles.avatarContainer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          pressed && styles.pressed,
        ]}
      >
        {uploading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : (
          <>
            <Image
              source={{
                uri: url || 'https://images.pexels.com/photos/3792581/pexels-photo-3792581.jpeg',
              }}
              style={[styles.avatar, { borderRadius: size / 2 }]}
            />
            <View style={[styles.overlay, !uploading && styles.overlayVisible]}>
              <Camera color="white" size={24} />
            </View>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    borderWidth: 3,
    borderColor: '#fff',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0,
  },
  overlayVisible: {
    opacity: 1,
  },
  pressed: {
    opacity: 0.8,
  },
});