import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, TouchableWithoutFeedback, Platform, Image, Text } from 'react-native';
import Colors from '@/constants/Colors';
import { Heart, MessageCircle, Share2, MoveHorizontal as MoreHorizontal } from 'lucide-react-native';
import { textStyles } from './TextStyles';
import { useColorScheme } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient'; 
import { logger } from '@/lib/logger';
import { ActivityIndicator } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  useSharedValue,
  runOnJS 
} from 'react-native-reanimated';
import { retryWithBackoff } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

const { height } = Dimensions.get('window');

interface Like {
  id: string;
  user_id: string;
  post_id: string;
}

interface ImagePostProps {
  id: string;
  uri: string;
  user: {
    username: string;
    avatar?: string;
  };
  caption: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked?: boolean;
}

export default function ImagePost({
  id,
  uri,
  user,
  caption,
  likes,
  comments,
  shares,
  isLiked = false
}: ImagePostProps) {
  const [liked, setLiked] = useState(isLiked);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Track local state for likes
  const [likesCount, setLikesCount] = useState(likes);
  const heartScale = useSharedValue(0);
  const heartOpacity = useSharedValue(0);
  const maxRetries = 3;

  // Fetch initial like state
  useEffect(() => {
    const fetchLikeStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: like } = await supabase
          .from('likes')
          .select('id')
          .eq('post_id', id)
          .eq('user_id', user.id)
          .maybeSingle();

        setLiked(!!like);
      } catch (error) {
        logger.error('Error fetching like status:', error, 'image_post');
      }
    };

    fetchLikeStatus();
  }, [id]);

  const formattedLikes = likesCount.toLocaleString();
  const formattedComments = comments.toLocaleString();
  const formattedShares = shares.toLocaleString();

  const loadImage = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Validate URI
      if (!uri || typeof uri !== 'string') {
        throw new Error('Invalid image URL');
      }

      // Try to load image with retries
      await retryWithBackoff(
        () => new Promise((resolve, reject) => {
          Image.prefetch(uri)
            .then(() => {
              setLoading(false);
              setError(null);
              resolve(true);
            })
            .catch(reject);
        }),
        maxRetries
      );

      logger.info(`Successfully loaded image: ${uri}`, 'image_post');
    } catch (err: any) {
      logger.error(`Failed to load image: ${uri}`, err, 'image_post');
      setError('Failed to load image');
      setLoading(false);
    }
  };

  // Load image on mount or when URI changes
  useEffect(() => {
    loadImage();
  }, [uri]);

  const handleLikePress = async () => {
    // Check if post ID is valid before proceeding
    if (!id) {
      logger.error('Cannot toggle like: Post ID is undefined', null, 'image_post');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Optimistically update UI
    const newLikedState = !liked;
    setLiked(newLikedState);
    setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Not authenticated');

      if (newLikedState) {
        // Check if like already exists
        const { data: existingLike, error: checkError } = await supabase
          .from('likes')
          .select('id')
          .eq('post_id', id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (checkError) {
          throw checkError;
        }

        // Only proceed with like if it doesn't exist
        if (!existingLike) {
          // Add like
          const { error: insertError } = await supabase
            .from('likes')
            .insert({
              post_id: id,
              user_id: user.id
            });

          if (insertError) {
            // Revert optimistic update if insert fails
            setLiked(false);
            setLikesCount(prev => prev - 1);
            throw insertError;
          }
        }
      } else {
        // Remove like
        const { error: deleteError } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', id)
          .eq('user_id', user.id);

        if (deleteError) {
          // Revert optimistic update if delete fails
          setLiked(true);
          setLikesCount(prev => prev + 1);
          throw deleteError;
        }
      }
    } catch (error) {
      // Revert optimistic update on error
      setLiked(!newLikedState);
      setLikesCount(prev => newLikedState ? prev - 1 : prev + 1);
      logger.error('Error toggling like:', error, 'image_post');
    }
  };

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onStart(async () => {
      if (!liked) {
        await handleLikePress();
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      }
      heartScale.value = 0;
      heartOpacity.value = 1;
      heartScale.value = withSpring(1, { damping: 10 });
      setTimeout(() => {
        heartOpacity.value = withTiming(0, { duration: 500 });
      }, 1000);
    });

  const singleTapGesture = Gesture.Tap()
    .onStart(() => {
      // Single tap functionality if needed
    })
    .requireExternalGestureToFail(doubleTapGesture);

  const gesture = Gesture.Exclusive(doubleTapGesture, singleTapGesture);

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
    opacity: heartOpacity.value,
  }));

  const handleLoadStart = () => {
    setLoading(true);
    setError(null);
  };

  const handleLoadSuccess = () => {
    setLoading(false);
    setError(null);
  };

  const handleLoadError = () => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      loadImage();
    } else {
      setLoading(false);
      setError('Failed to load image');
    }
  };

  return (
    <View style={styles.container}>
      <GestureDetector gesture={gesture}>
        <View style={styles.imageContainer}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="white" />
            </View>
          )}
          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <Image 
              source={{ 
                uri: uri || 'https://images.pexels.com/photos/3792581/pexels-photo-3792581.jpeg'
              }} 
              style={styles.image}
              resizeMode="cover"
              onLoadStart={handleLoadStart}
              onLoad={handleLoadSuccess}
              onError={handleLoadError} 
            />
          )}
          <Animated.View style={[styles.heartContainer, heartAnimatedStyle]}>
            <Heart size={100} fill={colors.primary} color={colors.primary} />
          </Animated.View>
        </View>
      </GestureDetector>
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.overlay}
      >
        <View style={styles.textContent}>
          <Text style={[textStyles.labelMedium, styles.username]}>{user.username}</Text>
          <Text style={[textStyles.bodySmall, styles.caption]}>{caption}</Text>
        </View>
        <View style={styles.actionsContainer}>
          <TouchableWithoutFeedback onPress={handleLikePress}>
            <View style={styles.actionButton}>
              <Heart 
                size={28} 
                color={liked ? colors.primary : 'white'} 
                fill={liked ? colors.primary : 'transparent'} 
              />
              <Text style={[textStyles.caption, styles.actionText]}>
                {formattedLikes}
              </Text>
            </View>
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback>
            <View style={styles.actionButton}>
              <MessageCircle size={28} color="white" />
              <Text style={[textStyles.caption, styles.actionText]}>
                {formattedComments}
              </Text>
            </View>
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback>
            <View style={styles.actionButton}>
              <Share2 size={28} color="white" />
              <Text style={[textStyles.caption, styles.actionText]}>
                {formattedShares}
              </Text>
            </View>
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback>
            <View style={styles.actionButton}>
              <MoreHorizontal size={28} color="white" />
              <Text style={[textStyles.caption, styles.actionText]}>More</Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height,
    backgroundColor: 'transparent',
  },
  imageContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    objectFit: 'cover',
  },
  heartContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 80,
  },
  textContent: {
    flex: 1,
    marginRight: 80,
  },
  username: {
    color: 'white',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  caption: {
    color: 'white',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  actionsContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  actionButton: {
    alignItems: 'center',
    marginBottom: 16,
  },
  actionText: {
    color: 'white',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
});