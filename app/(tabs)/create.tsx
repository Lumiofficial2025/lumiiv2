import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useNavigation } from 'expo-router';
import { useColorScheme, Dimensions, TextInput, KeyboardAvoidingView } from 'react-native';
import Colors from '@/constants/Colors';
import { textStyles } from '@/components/TextStyles';
import { logger } from '@/lib/logger';
import { X, Camera, Upload, ImagePlus, Sparkles, FileSliders as Sliders, Type, Crop, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient'; 
import { supabase } from '@/lib/supabase';
import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { toByteArray } from 'base64-js';

const { width } = Dimensions.get('window');

export default function CreateScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageSource, setImageSource] = useState<'camera' | 'library'>('library');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [hashtags, setHashtags] = useState<string[]>([]);
  
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isWeb = Platform.OS === 'web';
  const navigation = useNavigation();

  const handleShare = async () => {
    try {
      if (!selectedImage) {
        Alert.alert('Error', 'Please select an image first');
        return;
      }

      setSharing(true);
      logger.info('Starting post creation process', 'create_screen');

      // Get authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      if (!user) {
        throw new Error('Authentication required');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `${timestamp}.jpeg`;
      const filePath = `${user.id}/${fileName}`;

      logger.info('Processing image for upload', 'create_screen');

      // Process image data
      let binaryData;
      let contentType = 'image/jpeg';
      let blobSize;

      if (Platform.OS === 'web') {
        const response = await fetch(selectedImage);
        const blob = await response.blob();
        const reader = new FileReader();
        binaryData = await new Promise((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(toByteArray(base64));
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        });
      } else {
        // Get file info to check size
        const fileInfo = await FileSystem.getInfoAsync(selectedImage);
        logger.info(`Image size: ${(fileInfo.size / 1024 / 1024).toFixed(2)}MB`, 'create_screen');

        if (fileInfo.size > 7 * 1024 * 1024) {
          Alert.alert(
            'File too large',
            'Please select an image smaller than 7MB',
            [{ text: 'OK' }]
          );
          return;
        }

        const base64Data = await FileSystem.readAsStringAsync(selectedImage, {
          encoding: FileSystem.EncodingType.Base64
        });
        binaryData = toByteArray(base64Data);
        blobSize = binaryData.length;
        
        if (blobSize > 7 * 1024 * 1024) {
          const error = new Error('File size must be less than 7MB');
          throw error;
        }
      }

      logger.info('Uploading image to storage', 'create_screen');

      // Upload image to storage
      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(filePath, binaryData!, {
          contentType,
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: publicUrlData } = await supabase.storage
        .from('posts')
        .getPublicUrl(filePath);

      if (!publicUrlData.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      logger.info('Creating post record in database', 'create_screen');
      
      // Extract hashtags from caption
      const extractedHashtags = caption.match(/#[\w\u0590-\u05ff]+/g) || [];
      const uniqueHashtags = [...new Set(extractedHashtags)];

      // Create post record
      const { error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content_url: publicUrlData.publicUrl,
          caption: caption.trim(),
          created_at: new Date().toISOString(),
          hashtags: uniqueHashtags
        });

      if (postError) throw postError;

      logger.info('Post created successfully', 'create_screen');
      
      // Navigate back to home
      router.back();
      
      // Reset the create screen state
      setSelectedImage(null);
      setCaption('');
      
    } catch (error: any) {
      logger.error('Error creating post:', error, 'create_screen');
      Alert.alert(
        'Error',
        error.message || 'Failed to create post. Please try again.'
      );
    } finally {
      setSharing(false);
    }
  };

  const handleImagePicker = async () => {
    try {
      setLoading(true);
      
      let result;
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 5],
        quality: 1,
      };

      if (imageSource === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          alert('Sorry, we need camera permissions to make this work!');
          return;
        }
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          alert('Sorry, we need camera roll permissions to make this work!');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
        logger.info('Image selected successfully', 'create_screen');
      }
    } catch (error) {
      logger.error('Error picking image:', error, 'create_screen');
      alert('Failed to pick image');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedImage(null);
    router.back();
  };

  const renderContent = () => {
    if (isWeb) {
      return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {selectedImage ? (
            <View style={styles.editContainer}>
              <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
              <View style={[styles.editTools, { backgroundColor: colors.background }]}>
                <View style={[styles.captionContainer, { backgroundColor: colors.card }]}>
                  <TextInput
                    style={[styles.captionInput, { color: colors.text }]}
                    placeholder="Write a caption... Use # for hashtags"
                    placeholderTextColor={colors.secondaryText}
                    value={caption}
                    onChangeText={setCaption}
                    multiline
                    maxLength={2200}
                    textAlignVertical="top"
                  />
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <TouchableOpacity style={styles.editTool}>
                    <Crop size={24} color={colors.text} />
                    <Text style={[textStyles.caption, { color: colors.text }]}>Crop</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.editTool}>
                    <ImagePlus size={24} color={colors.text} />
                    <Text style={[textStyles.caption, { color: colors.text }]}>Filters</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.editTool}>
                    <Sliders size={24} color={colors.text} />
                    <Text style={[textStyles.caption, { color: colors.text }]}>Adjust</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.editTool}>
                    <Type size={24} color={colors.text} />
                    <Text style={[textStyles.caption, { color: colors.text }]}>Text</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          ) : (
            <View style={[styles.uploadContainer, { borderColor: colors.border }]}>
              <LinearGradient
                colors={[colors.primary + '20', colors.primary + '10']}
                style={styles.uploadGradient}
              >
                <Upload size={64} color={colors.primary} />
              </LinearGradient>
              <Text style={[textStyles.h4, { color: colors.text, marginTop: 24 }]}>
                Share Your Moments
              </Text>
              <Text style={[textStyles.bodyMedium, { color: colors.secondaryText, marginTop: 12, textAlign: 'center', maxWidth: '80%' }]}>
                Upload photos to share with your followers. Add filters, effects, and more.
              </Text>
              <TouchableOpacity
                style={[styles.uploadButton, { backgroundColor: colors.primary }]}
                onPress={handleImagePicker}
              >
                <Text style={[textStyles.buttonMedium, { color: 'white' }]}>
                  Choose Photo
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    }

    return (
      <View style={styles.container}>
        {selectedImage ? (
          <View style={styles.previewContainer}>
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.captionContainer}
            >
              <TextInput
                style={[
                  styles.captionInput,
                  { 
                    color: colors.text,
                    backgroundColor: colors.card + '80'
                  }
                ]}
                placeholder="Write a caption... Use # for hashtags"
                placeholderTextColor={colors.secondaryText}
                value={caption}
                onChangeText={setCaption}
                multiline
                maxLength={2200}
                textAlignVertical="top"
              />
            </KeyboardAvoidingView>
            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
            <View style={styles.previewOverlay}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.effectsContainer}>
                <TouchableOpacity style={styles.effectButton}>
                  <ImagePlus size={24} color="white" />
                  <Text style={[textStyles.caption, styles.effectText]}>Filters</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.effectButton}>
                  <Sparkles size={24} color="white" />
                  <Text style={[textStyles.caption, styles.effectText]}>Effects</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        ) : (
          <View style={[styles.uploadContainer, { backgroundColor: colors.background }]}>
            <View style={styles.sourceButtons}>
              <TouchableOpacity
                style={[
                  styles.sourceButton,
                  { backgroundColor: imageSource === 'library' ? colors.primary : colors.card }
                ]}
                onPress={() => setImageSource('library')}
              >
                <ImagePlus size={24} color={imageSource === 'library' ? 'white' : colors.text} />
                <Text
                  style={[
                    textStyles.labelMedium,
                    { color: imageSource === 'library' ? 'white' : colors.text }
                  ]}
                >
                  Gallery
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sourceButton,
                  { backgroundColor: imageSource === 'camera' ? colors.primary : colors.card }
                ]}
                onPress={() => setImageSource('camera')}
              >
                <Camera size={24} color={imageSource === 'camera' ? 'white' : colors.text} />
                <Text
                  style={[
                    textStyles.labelMedium,
                    { color: imageSource === 'camera' ? 'white' : colors.text }
                  ]}
                >
                  Camera
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.selectButton, { backgroundColor: colors.primary }]}
              onPress={handleImagePicker}
            >
              <Text style={[textStyles.buttonMedium, { color: 'white' }]}>
                {imageSource === 'camera' ? 'Take Photo' : 'Choose Photo'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colorScheme === 'dark' ? '#000' : colors.background }]}>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={handleClose}
        >
          <X size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[textStyles.h5, { color: colors.text }]}>
          {selectedImage ? 'Edit Photo' : 'New Post'}
        </Text>
        <TouchableOpacity
          style={[
            styles.shareButton,
            { 
              backgroundColor: selectedImage ? colors.primary : colors.card,
              opacity: (selectedImage && !sharing) ? 1 : 0.5 
            }
          ]}
          onPress={handleShare}
          disabled={!selectedImage || sharing}
        >
          <Text
            style={[
              textStyles.labelMedium,
              { color: selectedImage ? 'white' : colors.text }
            ]}
          >
            {sharing ? 'Sharing...' : 'Share'}
          </Text>
        </TouchableOpacity>
      </View>
      {renderContent()}
    </SafeAreaView>
  );
} 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
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
  shareButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  uploadGradient: {
    padding: 32,
    borderRadius: 24,
  },
  webCreateContainer: {
    flex: 1,
    padding: 16,
  },
  uploadContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
    margin: 16,
    backgroundColor: '#111',
  },
  editContainer: { flex: 1 },
  uploadButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
    width: '100%',
    alignItems: 'center',
  },
  effectsContainer: {
    flexDirection: 'row',
    paddingVertical: 16,
  },
  editTools: {
    padding: 16,
    gap: 16,
  },
  editTool: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  captionContainer: {
    borderRadius: 8,
    padding: 12,
  },
  captionInput: {
    height: 100,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  selectedImage: {
    flex: 1,
    width: width,
    height: undefined,
    resizeMode: 'contain',
    backgroundColor: 'black',
  },
  effectText: {
    color: 'white',
    marginTop: 4,
  },
  sourceButtons: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
    width: '100%',
  },
  sourceButton: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  selectButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: 'black',
    position: 'relative',
  },
  previewImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  captionContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    padding: 16,
  },
  captionInput: {
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  previewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 16,
  },
  effectButton: {
    alignItems: 'center',
    marginRight: 24,
  },
  content: {
    flex: 1,
  },
  captionInput: {
    height: 100,
    textAlignVertical: 'top',
    padding: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});