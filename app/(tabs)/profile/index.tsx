import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, RefreshControl, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import { textStyles } from '@/components/TextStyles';
import { Settings, Grid3x3, Bookmark, Heart, Lock, Share2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { retryWithBackoff } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { Redirect } from 'expo-router';

const GRID_ITEMS = [
  {
    id: '1',
    image: 'https://images.pexels.com/photos/3049121/pexels-photo-3049121.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    likes: '1.2K',
    isVideo: true,
  },
  {
    id: '2',
    image: 'https://images.pexels.com/photos/3771836/pexels-photo-3771836.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    likes: '856',
  },
  {
    id: '3',
    image: 'https://images.pexels.com/photos/3771807/pexels-photo-3771807.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    likes: '2.1K',
    isVideo: true,
  },
  {
    id: '4',
    image: 'https://images.pexels.com/photos/3771838/pexels-photo-3771838.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    likes: '543',
  },
];

export default function ProfileScreen() {
  const { user } = useAuth();
  
  if (!user) {
    return <Redirect href="/(auth)/sign-in" />;
  }
  
  return <Redirect href={`/profile/${user.id}`} />;
}