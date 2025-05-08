import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import ImagePost from '@/components/ImagePost';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

const { height } = Dimensions.get('window');

interface Post {
  id: string;
  content_url: string;
  caption: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user: {
    id: string;
    name: string;
    avatar_url: string;
  };
}

export default function HomeScreen() {
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    fetchPosts();
    subscribeToNewPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      logger.info('Starting posts fetch', 'home_screen');

      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          content_url,
          caption,
          likes_count,
          comments_count,
          created_at,
          user_id,
          profiles (
            id,
            name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        logger.info('No posts found', 'home_screen');
        setPosts([]);
        return;
      }

      // Filter out any posts with undefined IDs
      const validPosts = data.filter(post => post.id);

      const formattedPosts = validPosts.map(post => ({
        id: post.id,
        content_url: post.content_url,
        caption: post.caption,
        likes_count: post.likes_count,
        comments_count: post.comments_count,
        created_at: post.created_at || new Date().toISOString(),
        user: {
          id: post.profiles?.id || post.user_id,
          name: post.profiles?.name || 'Unknown User',
          avatar_url: post.profiles?.avatar_url || null,
        }
      }));

      formattedPosts.forEach(post => {
        logger.info(`Post ${post.id} content URL: ${post.content_url}`, 'home_screen');
      });

      setPosts(formattedPosts);
      logger.info(`Fetched ${formattedPosts.length} posts`, 'home_screen');
    } catch (error) {
      logger.error('Error fetching posts:', error, 'home_screen');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const subscribeToNewPosts = () => {
    const subscription = supabase
      .channel('posts_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts'
        },
        async (payload) => {
          logger.info('New post received', 'home_screen');
          await fetchPosts(); // Refresh the entire list for now
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  // Handle when video becomes visible
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveVideoIndex(viewableItems[0].index);
    }
  }).current;

  // Configuration for viewability
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50
  }).current;

  // Load more posts
  const handleLoadMore = () => {
    if (!loading) {
      setLoading(true);
      fetchPosts();
    }
  };

  // Render the loading indicator
  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  };

  if (initialLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Render each video
  const renderPost = ({ item, index }: { item: Post; index: number }) => {
    logger.info(`Rendering post with content_url: ${item.content_url}`, 'home_screen');
    
    if (!item.content_url || !item.id) {
      logger.error('Post has no content URL or ID', null, 'home_screen');
      return null;
    }

    return (
      <ImagePost
        id={item.id}
        uri={item.content_url}
        user={{
          username: `@${item.user.name.toLowerCase().replace(/\s+/g, '')}`,
          avatar: item.user.avatar_url,
        }}
        caption={item.caption}
        likes={item.likes_count}
        comments={item.comments_count}
        shares={0}
        isLiked={false}
      />
    );
  };

  return (
    <View style={styles.container}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <FlatList
          ref={flatListRef}
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={height}
          snapToAlignment="start"
          decelerationRate="fast"
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
        />
      </GestureHandlerRootView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
});