import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import { textStyles } from '@/components/TextStyles';
import { Heart, MessageCircle, User, AtSign, Bell } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import UserAvatar from '@/components/UserAvatar';
import { useRouter } from 'expo-router';

type NotificationType = 'like' | 'comment' | 'follow';

interface Notification {
  id: string;
  type: NotificationType;
  actor: {
    id: string;
    name: string;
    avatar_url: string;
  };
  post_id?: string;
  post_preview?: string;
  created_at: string;
  read: boolean;
}

// Function to get icon for notification type
const getNotificationIcon = (type: NotificationType, color: string) => {
  switch (type) {
    case 'like':
      return <Heart size={24} color={color} fill={color} />;
    case 'comment':
      return <MessageCircle size={24} color={color} />;
    case 'follow':
      return <User size={24} color={color} />;
    case 'mention':
      return <AtSign size={24} color={color} />;
    default:
      return <Heart size={24} color={color} />;
  }
};

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [activeTab, setActiveTab] = useState<'all' | 'mentions'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
    subscribeToNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id,
          type,
          created_at,
          read,
          post_id,
          actor:actor_id (
            id,
            name,
            avatar_url
          ),
          posts (
            content_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setNotifications(data.map(notification => ({
        ...notification,
        post_preview: notification.posts?.content_url
      })));
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNotifications = () => {
    const subscription = supabase
      .channel('notifications_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        async () => {
          await fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read
    supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notification.id)
      .then(() => {
        // Navigate based on type
        if (notification.type === 'follow') {
          router.push(`/profile/${notification.actor.id}`);
        } else if (notification.post_id) {
          // TODO: Implement post detail view navigation
          console.log('Navigate to post:', notification.post_id);
        }
      });
  };

  // Filter notifications based on active tab
  const filteredNotifications = notifications;

  // Render each notification item
  const renderNotificationItem = ({ item }: { item: Notification }) => {
    const iconColor = item.type === 'like' ? colors.primary : colors.secondary;
    const timeAgo = new Date(item.created_at).toLocaleDateString();
    
    return (
      <TouchableOpacity 
        style={[
          styles.notificationItem, 
          { backgroundColor: item.read ? colors.background : (colorScheme === 'dark' ? '#1a1a1a' : '#f7f9fc') }
        ]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.notificationIcon}>
          {getNotificationIcon(item.type, iconColor)}
        </View>
        
        <View style={styles.notificationContent}>
          <View style={styles.userInfo}>
            <UserAvatar 
              size="small"
              uri={item.actor.avatar_url}
            />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={[textStyles.labelMedium, { color: colors.text }]}>
                <Text style={{ fontFamily: 'Inter-SemiBold' }}>
                  {item.actor.name}
                </Text>{' '}
                {item.type === 'like' && 'liked your post'}
                {item.type === 'comment' && 'commented on your post'}
                {item.type === 'follow' && 'started following you'}
              </Text>
              <Text style={[textStyles.caption, { color: colors.secondaryText, marginTop: 2 }]}>
                {timeAgo}
              </Text>
            </View>
          </View>
          
          {item.post_preview && (
            <Image 
              source={{ uri: item.post_preview }} 
              style={styles.videoThumbnail} 
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[textStyles.h4, { color: colors.text }]}>Notifications</Text>
        
        {loading && (
          <ActivityIndicator size="small" color={colors.primary} />
        )}
      </View>
      
      <FlatList
        data={filteredNotifications}
        renderItem={renderNotificationItem}
        keyExtractor={item => item.id}
        contentContainerStyle={[
          styles.listContent,
          notifications.length === 0 && styles.emptyList
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyState}>
              <Bell size={48} color={colors.secondaryText} />
              <Text style={[textStyles.bodyMedium, { color: colors.secondaryText, marginTop: 16 }]}>
                No notifications yet
              </Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    paddingVertical: 16,
  },
  tabButtons: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 8,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  notificationItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  notificationContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoThumbnail: {
    width: 50,
    height: 70,
    borderRadius: 4,
    marginLeft: 10,
  },
  actionText: {
    color: 'white',
    marginTop: 4,
  },
  listContent: {
    paddingBottom: 80,
  },
  emptyList: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 48,
  },
});