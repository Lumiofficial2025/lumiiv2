import { Tabs } from 'expo-router';
import { useColorScheme, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Chrome as Home, Compass, Plus, Bell, User } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { BlurView } from 'expo-blur';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const router = useRouter();
  
  const getTabBarIcon = (routeName: string) => {
    return ({ color, size }: { color: string; size: number }) => {
      switch (routeName) {
        case 'index':
          return <Home size={size} color={color} />;
        case 'discover':
          return <Compass size={size} color={color} />;
        case 'create':
          return <Plus size={size} color={color} />;
        case 'notifications':
          return <Bell size={size} color={color} />;
        case 'profile':
          return <User size={size} color={color} />;
        default:
          return <Home size={size} color={color} />;
      }
    };
  };

  const handleCreatePress = () => {
    router.push('/(tabs)/create');
  };

  const CreateButton = ({ onPress }: { onPress: () => void }) => {
    return (
      <TouchableOpacity 
        style={styles.createButtonContainer}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={[styles.createButton, { backgroundColor: colors.primary }]}>
          <Plus size={24} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.tabIconSelected,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Inter-Medium',
        },
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : colorScheme === 'dark' ? 'rgba(18, 18, 18, 0.85)' : 'rgba(255, 255, 255, 0.85)',
          borderTopWidth: 0,
          elevation: 0,
          height: 60,
        },
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView
              intensity={80}
              tint={colorScheme === 'dark' ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View style={StyleSheet.absoluteFill} />
          )
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: getTabBarIcon('index'),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: getTabBarIcon('discover'),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: '',
          tabBarButton: () => <CreateButton onPress={handleCreatePress} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Inbox',
          tabBarIcon: getTabBarIcon('notifications'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: getTabBarIcon('profile'),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  createButtonContainer: {
    height: 60,
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});