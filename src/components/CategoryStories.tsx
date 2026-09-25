import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import SafeImage from './SafeImage';
import { handleSDUILink } from '../utils/sduiNavigation';
import { CATEGORY_FALLBACK_IMAGES } from '../utils/productImages';

export interface CategoryStory {
  id?: string;
  title: string;
  imageUrl?: string;
  image?: string;
  link?: string;
  tag?: string;
}

interface Props {
  stories?: CategoryStory[];
}

function CategoryStories({ stories = [] }: Props) {
  const navigation = useNavigation<any>();

  if (!stories || stories.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {stories.map((story, index) => {
          const titleKey = (story.title || '').toLowerCase();
          const fallback = Object.entries(CATEGORY_FALLBACK_IMAGES).find(([k]) => titleKey.includes(k))?.[1];
          const imageUri = story.imageUrl || story.image || fallback;
          const link = story.link || (story.id ? `category/${story.id}` : 'category/women');

          return (
            <TouchableOpacity
              key={story.id || `story_${index}`}
              activeOpacity={0.85}
              onPress={() => handleSDUILink(link, navigation, story.title)}
              style={styles.storyItem}
            >
              <View style={styles.ringContainer}>
                <SafeImage uri={imageUri} style={styles.storyImage} resizeMode="cover" fallbackText={story.title} />
                {story.tag ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{story.tag}</Text>
                  </View>
                ) : null}
              </View>
              <Text numberOfLines={1} style={styles.storyTitle}>
                {story.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 14,
  },
  storyItem: {
    alignItems: 'center',
    width: 68,
  },
  ringContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 2.5,
    borderWidth: 2,
    borderColor: '#F59E0B',
    backgroundColor: '#FFFFFF',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  badge: {
    position: 'absolute',
    bottom: -4,
    backgroundColor: '#DC2626',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontFamily: 'Poppins_800ExtraBold',
  },
  storyTitle: {
    fontSize: 10.5,
    fontFamily: 'Poppins_600SemiBold',
    color: '#334155',
    marginTop: 6,
    textAlign: 'center',
  },
});

export default React.memo(CategoryStories);
