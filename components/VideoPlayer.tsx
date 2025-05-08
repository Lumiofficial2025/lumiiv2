import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, TouchableWithoutFeedback, Platform, ActivityIndicator } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/Colors';
import Animated, { useAnimatedStyle, withTiming, withSpring, useSharedValue } from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Heart, MessageCircle, Share2, MoveHorizontal as MoreHorizontal } from 'lucide-react-native';
import { textStyles } from './TextStyles';
import { useColorScheme } from 'react-native';

const { width, height } = Dimensions.get('window');

interface VideoPlayerProps {
  uri: string;
  isCurrent: boolean;
  user: {
    username: string;
    avatar?: string;
  };
  caption: string;
  audioName: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked?: boolean;
}

export default function VideoPlayer({ 
  uri, 
  isCurrent, 
  user, 
  caption, 
  audioName,
  likes,
  comments,
  shares,
  isLiked = false
}: VideoPlayerProps) {
  const videoRef = useRef<Video | HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [liked, setLiked] = useState(isLiked);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const heartScale = useSharedValue(0);
  const heartOpacity = useSharedValue(0);

  // Ensure numbers are converted to strings for display
  const formattedLikes = likes.toLocaleString();
  const formattedComments = comments.toLocaleString();
  const formattedShares = shares.toLocaleString();

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      setError('Failed to load video');
      setIsLoading(false);
      return;
    }

    setIsPlaying(status.isPlaying);
    setIsLoading(false);
    setError(null);
  };

  const togglePlayPause = async () => {
    if (!videoRef.current) return;
    
    if (Platform.OS === 'web') {
      const videoElement = videoRef.current as HTMLVideoElement;
      try {
        if (isPlaying) {
          videoElement.pause();
          setIsPlaying(false);
        } else {
          await videoElement.play();
          setIsPlaying(true);
        }
      } catch (error) {
        console.error('Error toggling web video playback:', error);
      }
      return;
    }

    // Native platforms
    const videoComponent = videoRef.current as Video;
    try {
      if (isPlaying) {
        await videoComponent.pauseAsync();
        setIsPlaying(false);
      } else {
        await videoComponent.playAsync();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error toggling native video playback:', error);
    }
  };

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onStart(() => {
      if (!liked) {
        setLiked(true);
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
      togglePlayPause();
    })
    .requireExternalGestureToFail(doubleTapGesture);

  const gesture = Gesture.Exclusive(doubleTapGesture, singleTapGesture);

  const handleLikePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setLiked(!liked);
  };

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
    opacity: heartOpacity.value,
  }));

  useEffect(() => {
    if (!videoRef.current) return;

    if (Platform.OS === 'web') {
      const videoElement = videoRef.current as HTMLVideoElement;
      try {
        if (isCurrent) {
          videoElement.play().catch(error => {
            // Handle autoplay restrictions
            console.warn('Autoplay prevented:', error);
          });
          setIsPlaying(true);
        } else {
          videoElement.pause();
          setIsPlaying(false);
        }
      } catch (error) {
        console.error('Error managing web video playback:', error);
      }
      return;
    }

    // Native platforms
    const videoComponent = videoRef.current as Video;
    if (isCurrent) {
      videoComponent.playAsync().catch(error => {
        console.error('Error playing native video:', error);
      });
      setIsPlaying(true);
    } else {
      videoComponent.pauseAsync().catch(error => {
        console.error('Error pausing native video:', error);
      });
      setIsPlaying(false);
    }
  }, [isCurrent]);

  return (
    <View style={styles.container}>
      <GestureDetector gesture={gesture}>
        <View style={styles.videoContainer}>
          {Platform.OS === 'web' ? (
            <video
              ref={videoRef}
              src={uri}
              onLoadStart={() => setIsLoading(true)}
              onLoadedData={() => setIsLoading(false)}
              onError={() => {
                setError('Failed to load video');
                setIsLoading(false);
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              playsInline={true}
              loop
              muted
              controls={false}
              webkit-playsinline="true" // iOS Safari support
            />
          ) : (
            <Video
              ref={videoRef}
              style={styles.video}
              source={{ uri }}
              useNativeControls={false}
              resizeMode={ResizeMode.COVER}
              isLooping
              shouldPlay={isCurrent}
              onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
              isMuted={true}
            />
          )}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="white" />
            </View>
          )}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          <Animated.View style={[styles.heartContainer, heartAnimatedStyle]}>
            <Heart size={100} fill={colors.primary} color={colors.primary} />
          </Animated.View>
        </View>
      </GestureDetector>
      <View style={styles.videoInfo}>
        <View style={styles.textContent}>
          <Text style={[textStyles.labelMedium, styles.username]}>{user.username}</Text>
          <Text style={[textStyles.bodySmall, styles.caption]}>{caption}</Text>
          <Text style={[textStyles.caption, styles.audioName]}>♫ {audioName}</Text>
        </View>
        <View style={styles.actionsContainer}>
          <TouchableWithoutFeedback onPress={handleLikePress}>
            <View style={styles.actionButton}>
              <Heart 
                size={28}
                color={liked ? colors.primary : colors.text} 
                fill={liked ? colors.primary : 'transparent'} 
              />
              <Text style={[textStyles.caption, styles.actionText]}>
                {formattedLikes}
              </Text>
            </View>
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback>
            <View style={styles.actionButton}>
              <MessageCircle size={28} color={colors.text} />
              <Text style={[textStyles.caption, styles.actionText]}>
                {formattedComments}
              </Text>
            </View>
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback>
            <View style={styles.actionButton}>
              <Share2 size={28} color={colors.text} />
              <Text style={[textStyles.caption, styles.actionText]}>
                {formattedShares}
              </Text>
            </View>
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback>
            <View style={styles.actionButton}>
              <MoreHorizontal size={28} color={colors.text} />
              <Text style={[textStyles.caption, styles.actionText]}>More</Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width,
    height,
    position: 'relative',
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
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
  videoInfo: {
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
  audioName: {
    color: 'white',
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'white',
    textAlign: 'center',
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
});