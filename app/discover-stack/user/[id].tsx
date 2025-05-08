import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, RefreshControl, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Redirect } from 'expo-router';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import { textStyles } from '@/components/TextStyles';
import { ArrowLeft, Grid3x3, Image as ImageIcon } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const GRID_SIZE = width / 3;

// UUID validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface Post {
  id: string;
  content_url: string;
  caption: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const isOwnProfile = user?.id === id;

  // Validate the ID parameter
  if (!id || typeof id !== 'string' || !UUID_REGEX.test(id)) {
    return <Redirect href={`/profile/${user?.id}`} />;
  }

  useEffect(() => {
    setProfile(null); // Clear old profile before loading new one
    fetchProfile();
    fetchUserPosts();
  }, [id]);

  const fetchUserPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching user posts:', error);
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (profileError) throw profileError;

      if (profileData) {
        setProfile({
          ...profileData,
          username: `@${profileData.name.toLowerCase().replace(/\s+/g, '')}`
        });
      }

      // Check if current user is following this profile
      if (user) {
        const { data: followData, error: followError } = await supabase
          .from('followers')
          .select('*')
          .eq('follower_id', user.id)
          .eq('following_id', id);

        if (!followError && followData) {
          setIsFollowing(followData.length > 0);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      setFollowLoading(true);
      
      if (!user) return;

      if (isFollowing) {
        // Unfollow
        await supabase
          .from('followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', id);
        setIsFollowing(false);
      } else {
        // Follow
        await supabase
          .from('followers')
          .insert({
            follower_id: user.id,
            following_id: id
          });
        setIsFollowing(true);
      }

      // Refresh profile to update counts
      await fetchProfile();
    } catch (error) {
      console.error('Error following/unfollowing:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    Promise.all([
      fetchProfile(),
      fetchUserPosts()
    ]).finally(() => setRefreshing(false));
  }, []);

  const renderPost = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={[styles.gridItem, { backgroundColor: colors.card }]}
      onPress={() => {}}
    >
      <Image
        source={{ uri: item.content_url }}
        style={styles.gridImage}
      />
    </TouchableOpacity>
  );

  if (!profile && !loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.notFound}>
          <Text style={[textStyles.h5, { color: colors.text }]}>Profile not found</Text>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={[textStyles.labelMedium, { color: 'white' }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[textStyles.h5, { color: colors.text }]}>
          {profile?.username || '@username'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.profileSection}>
          <Image
            source={{ uri: profile?.avatar_url || 'https://images.pexels.com/photos/3771839/pexels-photo-3771839.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2' }}
            style={styles.avatar}
          />

          <Text style={[textStyles.h5, { color: colors.text, marginTop: 16 }]}>
            {profile?.name || 'Loading...'}
          </Text>
          
          <Text style={[textStyles.bodySmall, { color: colors.secondaryText, textAlign: 'center', marginTop: 8, maxWidth: '80%' }]}>
            {profile?.bio || 'No bio available'}
          </Text>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[textStyles.h5, { color: colors.text }]}>
                {profile?.followers_count?.toLocaleString() || '0'}
              </Text>
              <Text style={[textStyles.caption, { color: colors.secondaryText }]}>Followers</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[textStyles.h5, { color: colors.text }]}>
                {profile?.following_count?.toLocaleString() || '0'}
              </Text>
              <Text style={[textStyles.caption, { color: colors.secondaryText }]}>Following</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statItem}>
              <Text style={[textStyles.h5, { color: colors.text }]}>
                {profile?.likes_count?.toLocaleString() || '0'}
              </Text>
              <Text style={[textStyles.caption, { color: colors.secondaryText }]}>Likes</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.followButton,
              { backgroundColor: isFollowing ? colors.card : colors.primary },
              followLoading && styles.followButtonDisabled
            ]}
            onPress={handleFollow}
            disabled={followLoading}
          >
            <Text 
              style={[
                textStyles.labelMedium, 
                { color: isFollowing ? colors.text : 'white' }
              ]}
            >
              {followLoading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.tabBar, { borderColor: colors.border }]}>
          <View style={[styles.tab, { borderBottomColor: colors.primary }]}>
            <Grid3x3 size={24} color={colors.primary} />
          </View>
        </View>

        <View style={styles.gridContainer}>
          {posts.length > 0 ? (
            <FlatList
              data={posts}
              renderItem={renderPost}
              keyExtractor={(item) => item.id}
              numColumns={3}
              scrollEnabled={false}
              contentContainerStyle={styles.gridContent}
            />
          ) : (
            <View style={[styles.emptyState, { borderColor: colors.border }]}>
              <ImageIcon size={48} color={colors.secondaryText} />
              <Text style={[textStyles.bodyMedium, { color: colors.secondaryText, marginTop: 16 }]}>
                No posts yet
              </Text>
            </View>
          )}
        </View>
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
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 16,
    marginTop: 16,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingHorizontal: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 24,
    marginHorizontal: 16,
  },
  followButton: {
    paddingHorizontal: 32,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 24,
  },
  followButtonDisabled: {
    opacity: 0.6,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
  },
  gridContainer: {
    padding: 16,
  },
  gridContent: {
    gap: 1,
  },
  gridItem: {
    width: GRID_SIZE - 1,
    height: GRID_SIZE - 1,
    marginRight: 1,
    marginBottom: 1,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
  },
});