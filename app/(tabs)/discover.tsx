import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, FlatList } from 'react-native';
import { useColorScheme, TextInput, ActivityIndicator } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import Colors from '@/constants/Colors';
import { textStyles } from '@/components/TextStyles';
import { Search, TrendingUp, UserX as UserX2, EyeOff as Close } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import UserAvatar from '@/components/UserAvatar';
import { debounce } from '@/lib/utils';

// Mock data for trending categories
const TRENDING_CATEGORIES = [
  { id: '1', name: 'Dance' },
  { id: '2', name: 'Comedy' },
  { id: '3', name: 'Food' },
  { id: '4', name: 'Travel' },
  { id: '5', name: 'Music' },
  { id: '6', name: 'Fitness' },
  { id: '7', name: 'Gaming' },
  { id: '8', name: 'Fashion' },
];

// Mock data for trending videos
const TRENDING_VIDEOS = [
  {
    id: '1',
    thumbnail: 'https://images.pexels.com/photos/1701202/pexels-photo-1701202.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    views: '8.2M',
    username: '@dancepro',
  },
  {
    id: '2',
    thumbnail: 'https://images.pexels.com/photos/2252584/pexels-photo-2252584.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    views: '4.7M',
    username: '@comedyking',
  },
  {
    id: '3',
    thumbnail: 'https://images.pexels.com/photos/1684151/pexels-photo-1684151.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    views: '3.9M',
    username: '@foodie',
  },
  {
    id: '4',
    thumbnail: 'https://images.pexels.com/photos/1670187/pexels-photo-1670187.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    views: '6.1M',
    username: '@traveler',
  },
  {
    id: '5',
    thumbnail: 'https://images.pexels.com/photos/45243/saxophone-music-gold-gloss-45243.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    views: '5.3M',
    username: '@musiclover',
  },
  {
    id: '6',
    thumbnail: 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    views: '2.8M',
    username: '@fitnessguru',
  },
];

// Mock data for creator spotlights
const CREATOR_SPOTLIGHTS = [
  {
    id: '1',
    name: 'Sarah Johnson',
    username: '@dance_sarah',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    followers: '2.4M',
    category: 'Dance',
  },
  {
    id: '2',
    name: 'Mike Chen',
    username: '@chefmike',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    followers: '3.8M',
    category: 'Cooking',
  },
  {
    id: '3',
    name: 'Emma Watson',
    username: '@emma_travels',
    avatar: 'https://images.pexels.com/photos/1382731/pexels-photo-1382731.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    followers: '1.7M',
    category: 'Travel',
  },
];

export default function DiscoverScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const searchInputRef = useRef<TextInput | null>(null);
  const navigation = useNavigation();

  // Reset search when screen loses focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      setSearchQuery('');
      setSearchResults([]);
      setShowSearchResults(false);
      if (searchInputRef.current) {
        searchInputRef.current.blur();
      }
    });

    return unsubscribe;
  }, [navigation]);

  const searchProfiles = async (query: string) => {
    try {
      setIsSearching(true);
      const { data, error } = await supabase.rpc('search_profiles', { 
        search_query: query 
      });

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching profiles:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const debouncedSearch = useRef(
    debounce((query: string) => {
      if (query.trim()) {
        searchProfiles(query);
      } else {
        setSearchResults([]);
      }
    }, 300)
  ).current;

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    setShowSearchResults(!!text.trim());
    debouncedSearch(text);
  };

  // Render a category button
  const renderCategoryItem = ({ item }: { item: { id: string; name: string } }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        { backgroundColor: colors.card, borderColor: colors.border }
      ]}
    >
      <Text style={[textStyles.labelMedium, { color: colors.text }]}>{item.name}</Text>
    </TouchableOpacity>
  );

  // Render a trending video
  const renderTrendingVideo = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.trendingVideoContainer}>
      <View style={styles.videoThumbnailContainer}>
        <Image source={{ uri: item.thumbnail }} style={styles.videoThumbnail} />
        <View style={styles.viewsContainer}>
          <Text style={styles.viewsText}>{item.views}</Text>
        </View>
      </View>
      <Text 
        style={[textStyles.caption, { color: colors.text, marginTop: 4 }]}
        numberOfLines={1}
      >
        {item.username}
      </Text>
    </TouchableOpacity>
  );

  // Render a creator spotlight
  const renderCreatorSpotlight = ({ item }: { item: any }) => (
    <TouchableOpacity style={[styles.creatorCard, { backgroundColor: colors.card }]}>
      <Image source={{ uri: item.avatar }} style={styles.creatorAvatar} />
      <View style={styles.creatorInfo}>
        <Text style={[textStyles.labelMedium, { color: colors.text }]}>{item.name}</Text>
        <Text style={[textStyles.caption, { color: colors.secondaryText }]}>{item.username}</Text>
        <View style={styles.creatorMetrics}>
          <Text style={[textStyles.captionBold, { color: colors.primary }]}>{item.followers}</Text>
          <Text style={[textStyles.caption, { color: colors.secondaryText }]}> followers</Text>
        </View>
        <View style={[styles.categoryTag, { backgroundColor: colors.primaryLight }]}>
          <Text style={[textStyles.labelSmall, { color: 'white' }]}>{item.category}</Text>
        </View>
      </View>
      <TouchableOpacity style={[styles.followButton, { backgroundColor: colors.primary }]}>
        <Text style={[textStyles.labelSmall, { color: 'white' }]}>Follow</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderSearchResult = ({ item }: { item: any }) => {
    // Only navigate if we have a valid ID
    const handleProfilePress = () => {
      if (!item?.id) return;
      router.push(`/discover-stack/user/${item.id}`);
    };

    if (!item?.id || !item?.name) {
      return null;
    }
    
    return (
      <TouchableOpacity 
        style={[
          styles.searchResultItem,
          { 
            borderBottomColor: colors.border,
            backgroundColor: colors.card,
            marginBottom: 8,
            borderRadius: 12,
            padding: 12
          }
        ]}
        onPress={handleProfilePress}
      >
        <View style={styles.searchResultContent}>
          <UserAvatar 
            size="medium"
            uri={item.avatar_url}
            showUsername={false}
          />
          <View style={styles.searchResultInfo}>
            <Text style={[textStyles.labelMedium, { color: colors.text }]}>
              {item.name}
            </Text>
            <Text style={[textStyles.caption, { color: colors.secondaryText }]}>
              @{item.username || item.name.toLowerCase().replace(/\s+/g, '')}
            </Text>
            {item.bio && (
              <Text 
                style={[textStyles.caption, { color: colors.secondaryText }]}
                numberOfLines={2}
              >
                {item.bio}
              </Text>
            )}
            <Text style={[textStyles.caption, { color: colors.secondaryText }]}>
              {item.followers_count.toLocaleString()} followers
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Search size={20} color={colors.icon} />
        <TextInput
          ref={searchInputRef}
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search"
          placeholderTextColor={colors.secondaryText}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            onPress={() => {
              setSearchQuery('');
              setShowSearchResults(false);
              setSearchResults([]);
              searchInputRef.current?.blur();
            }}
            style={styles.clearButton}
          >
            <Close size={20} color={colors.secondaryText} />
          </TouchableOpacity>
        )}
      </View>

      {showSearchResults ? (
        <View style={styles.searchResultsContainer}>
          {isSearching ? (
            <ActivityIndicator style={styles.loadingIndicator} color={colors.primary} />
          ) : searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.searchResultsList}
            />
          ) : searchQuery.trim() ? (
            <View style={styles.noResults}>
              <UserX2 size={48} color={colors.secondaryText} />
              <Text style={[textStyles.bodyMedium, { color: colors.secondaryText, marginTop: 12 }]}>
                No users found
              </Text>
            </View>
          ) : null}
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Categories */}
          <View style={styles.section}>
            <Text style={[textStyles.h5, { color: colors.text, marginBottom: 12 }]}>
              Browse Categories
            </Text>
            <FlatList
              data={TRENDING_CATEGORIES}
              renderItem={renderCategoryItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContainer}
            />
          </View>

          {/* Trending Now */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <TrendingUp size={20} color={colors.primary} />
              <Text style={[textStyles.h5, { color: colors.text, marginLeft: 8 }]}>
                Trending Now
              </Text>
            </View>
            <FlatList
              data={TRENDING_VIDEOS}
              renderItem={renderTrendingVideo}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.trendingVideoRow}
              scrollEnabled={false}
            />
          </View>

          {/* Creator Spotlights */}
          <View style={styles.section}>
            <Text style={[textStyles.h5, { color: colors.text, marginBottom: 12 }]}>
              Creator Spotlights
            </Text>
            {CREATOR_SPOTLIGHTS.filter(creator => 
              creator?.id && creator?.name && creator?.username && creator?.avatar
            ).map((creator) => (
              <View key={creator.id} style={{ marginBottom: 12 }}>
                {renderCreatorSpotlight({ item: creator })}
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  clearButton: {
    padding: 8,
  },
  searchResultsContainer: {
    flex: 1,
  },
  searchResultsList: {
    padding: 16,
    gap: 8,
  },
  searchResultItem: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  searchResultContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchResultInfo: {
    marginLeft: 12,
    flex: 1,
    gap: 4,
  },
  loadingIndicator: {
    marginTop: 24,
  },
  noResults: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 48,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoriesContainer: {
    paddingRight: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
  },
  trendingVideoRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  trendingVideoContainer: {
    width: '48%',
    marginBottom: 12,
  },
  videoThumbnailContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    aspectRatio: 9 / 16,
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  viewsContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  viewsText: {
    color: 'white',
    fontFamily: 'Inter-Medium',
    fontSize: 10,
  },
  creatorCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 12,
  },
  creatorAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  creatorInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  creatorMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  followButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'center',
  },
});