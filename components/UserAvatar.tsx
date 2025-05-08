import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from 'react-native';

type UserAvatarProps = {
  size?: 'small' | 'medium' | 'large';
  uri?: string;
  username?: string;
  showUsername?: boolean;
  showFollowButton?: boolean;
};

export default function UserAvatar({ 
  size = 'medium', 
  uri, 
  username,
  showUsername = false,
  showFollowButton = false
}: UserAvatarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Define avatar sizes
  const avatarSizes = {
    small: 32,
    medium: 48,
    large: 80,
  };
  
  // Define border widths
  const borderWidths = {
    small: 1.5,
    medium: 2,
    large: 3,
  };
  
  const avatarSize = avatarSizes[size];
  const borderWidth = borderWidths[size];
  
  // Default avatar placeholder
  const defaultAvatar = 'https://images.pexels.com/photos/1462980/pexels-photo-1462980.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2';
  
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.avatarContainer,
          {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
            borderWidth,
            borderColor: colors.primary,
          },
        ]}
      >
        <Image
          source={{ uri: uri || defaultAvatar }}
          style={[
            styles.avatar,
            {
              width: avatarSize - borderWidth * 2,
              height: avatarSize - borderWidth * 2,
              borderRadius: (avatarSize - borderWidth * 2) / 2,
            },
          ]}
        />
      </View>
      
      {showUsername && username && (
        <Text 
          style={[
            styles.username,
            { color: colors.text }
          ]}
          numberOfLines={1}
        >
          {username}
        </Text>
      )}
      
      {showFollowButton && (
        <View style={[styles.followButton, { backgroundColor: colors.primary }]}>
          <Text style={styles.followButtonText}>Follow</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  avatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    overflow: 'hidden',
  },
  username: {
    marginTop: 4,
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    textAlign: 'center',
  },
  followButton: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  followButtonText: {
    color: 'white',
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
  },
});