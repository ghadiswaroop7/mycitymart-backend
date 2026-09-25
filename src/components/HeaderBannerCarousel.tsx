import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TouchableOpacity, Dimensions, 
  FlatList, StyleSheet, Pressable, Platform 
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useNavigation } from '@react-navigation/native';
import { handleSDUILink } from '../utils/sduiNavigation';
import YoutubeVideoPlayer from '../screens/YoutubeVideoPlayer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Native Video Loop Player via expo-video (Expo 56+)
const NativeBannerVideo = ({ source, style, active }: { source: string; style: any; active?: boolean }) => {
  const player = useVideoPlayer(source, p => {
    p.loop = true;
    p.muted = true;
  });

  // Play only while this slide is the active one; pause when scrolled away
  useEffect(() => {
    try {
      if (active) {
        player.play();
      } else {
        player.pause();
      }
    } catch (e) {}
  }, [active, player]);

  // Pause the video when the slide unmounts (scrolled far away / screen left)
  useEffect(() => {
    return () => {
      try { player.pause(); } catch (e) {}
    };
  }, [player]);

  return (
    <VideoView
      player={player}
      style={style}
      contentFit="cover"
      nativeControls={false}
    />
  );
};

export interface HeroSlide {
  id?: string;
  tag?: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  link?: string;
  actionUrl?: string;
  imageUrl?: string;
  image?: string;
  videoUrl?: string;
  video?: string;
  mediaUrl?: string;
  url?: string;
  bgUrl?: string;
  gifUrl?: string;
  previewUrl?: string;
  src?: string;
  mediaType?: 'image' | 'gif' | 'video';
  type?: string;
  bgType?: string;
  displayLayout?: 'clean_animation' | 'full_cover' | 'full_offer_card' | 'split';
  hideOverlayContent?: boolean;
  bgColor?: string;
  noBackground?: boolean;
  mascotGifUrl?: string;
  mascotScale?: 'sm' | 'lg' | 'popout';
  mascotPosition?: 'right' | 'bottom_runner';
  iconType?: string;
  textColor?: string;
}

interface Props {
  slides?: HeroSlide[];
  fallbackBg?: string;
}

const getYoutubeId = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Universal Video / GIF / Image / YouTube player component
const UniversalMedia = ({ 
  source, 
  isVideo, 
  style,
  active
}: { 
  source: string; 
  isVideo: boolean; 
  style: any;
  active?: boolean;
}) => {
  const ytId = getYoutubeId(source);

  // 1. YouTube Video Loop
  if (ytId) {
    if (Platform.OS === 'web') {
      return (
        <iframe
          src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            border: 0,
            pointerEvents: 'none',
          } as any}
          allow="autoplay; encrypted-media"
          title="Banner Video"
        />
      );
    }
    return (
      <View style={[style, { overflow: 'hidden' }]}>
        <YoutubeVideoPlayer videoId={ytId} />
      </View>
    );
  }

  // 2. Direct MP4 / WebM / Video Loop
  if (isVideo) {
    if (Platform.OS === 'web') {
      return (
        <video
          src={source}
          autoPlay
          loop
          muted
          playsInline
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            pointerEvents: 'none',
          } as any}
        />
      );
    }
    return <NativeBannerVideo source={source} style={style} active={active} />;
  }

  // 3. High-Speed Animated GIF / WebP / Image
  return (
    <ExpoImage
      source={{ uri: source }}
      style={style}
      contentFit="cover"
      transition={200}
      cachePolicy="memory-disk"
    />
  );
};

function HeaderBannerCarousel({ slides = [], fallbackBg }: Props) {
  const navigation = useNavigation<any>();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const activeIndexRef = useRef(0);

  // Auto-slide every 4.5 seconds (stable interval; no reset on every tick)
  useEffect(() => {
    if (!slides || slides.length <= 1) return;
    const interval = setInterval(() => {
      const nextIndex = (activeIndexRef.current + 1) % slides.length;
      activeIndexRef.current = nextIndex;
      try {
        flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        setActiveIndex(nextIndex);
      } catch (e) {
        // Fallback for flatlist scroll
      }
    }, 4500);
    return () => clearInterval(interval);
  }, [slides]);

  const handlePress = (link?: string, title?: string) => {
    if (!link) return;
    handleSDUILink(link, navigation, title);
  };

  if (!slides || slides.length === 0) return null;

  const currentSlide = slides[activeIndex] || slides[0];
  const currentBg = currentSlide?.noBackground || currentSlide?.bgColor === 'transparent'
    ? 'transparent'
    : ((currentSlide?.bgColor && currentSlide.bgColor !== '#1D58EE') ? currentSlide.bgColor : (fallbackBg || '#008B45'));

  return (
    <View style={[styles.container, { backgroundColor: currentBg }]}>
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item, index) => item.id || `slide_${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          if (index >= 0 && index < slides.length) {
            activeIndexRef.current = index;
            setActiveIndex(index);
          }
        }}
        renderItem={({ item, index }) => {
          const rawMedia = (
            item.videoUrl || 
            item.video || 
            item.mediaUrl || 
            item.url || 
            item.bgUrl || 
            item.imageUrl || 
            item.image || 
            item.mascotGifUrl || 
            item.gifUrl || 
            item.previewUrl || 
            item.src || 
            ''
          ).trim();

          const mediaSource = rawMedia.replace('media.giphy.com/media/', 'i.giphy.com/');
          const bannerLink = item.buttonLink || item.link || item.actionUrl || 'deals';
          const bannerTag = item.tag;
          const bannerButton = item.buttonText || 'Shop Now →';

          const ytId = getYoutubeId(mediaSource);
          const isVideo = Boolean(
            ytId ||
            item.mediaType === 'video' || 
            item.type === 'video' || 
            item.bgType === 'video' ||
            Boolean(item.videoUrl) ||
            Boolean(item.video) ||
            /\.(mp4|webm|mov|m4v|ogv)(\?.*)?$/i.test(mediaSource) ||
            mediaSource.includes('shutterstock.com/video') ||
            mediaSource.includes('picdn.net/shutterstock/videos') ||
            mediaSource.includes('pexels.com/video') ||
            mediaSource.includes('pixabay.com/videos')
          );

          const isCleanAnimation = 
            item.displayLayout === 'clean_animation' || 
            item.hideOverlayContent === true;

          const isFullCover = 
            item.displayLayout === 'full_cover' || isCleanAnimation;

          // 🌟 1. 100% PURE CLEAN ANIMATION MODE (Full-bleed animated GIF / Video with ZERO text/boxes)
          if (isCleanAnimation && mediaSource) {
            return (
              <Pressable
                onPress={() => handlePress(bannerLink, item.title)}
                style={styles.cleanFullSlide}
              >
                <UniversalMedia 
                  source={mediaSource} 
                  isVideo={isVideo} 
                  style={styles.fullCoverMedia} 
                  active={activeIndex === index}
                />
              </Pressable>
            );
          }

          // 🌟 2. FULL COVER BANNER (Media Background with Sleek Dark Overlay Text)
          if (isFullCover && mediaSource) {
            return (
              <TouchableOpacity
                activeOpacity={0.92}
                onPress={() => handlePress(bannerLink, item.title)}
                style={styles.fullCoverSlide}
              >
                <UniversalMedia 
                  source={mediaSource} 
                  isVideo={isVideo} 
                  style={styles.fullCoverMedia} 
                  active={activeIndex === index}
                />
                <View style={styles.gradientScrim}>
                  <View style={styles.textContainer}>
                    {bannerTag ? (
                      <View style={styles.tagBadge}>
                        <Text style={styles.tagText}>{bannerTag}</Text>
                      </View>
                    ) : null}
                    {item.title ? (
                      <Text numberOfLines={2} style={styles.titleText}>{item.title}</Text>
                    ) : null}
                    {item.subtitle ? (
                      <Text numberOfLines={1} style={styles.subtitleText}>{item.subtitle}</Text>
                    ) : null}
                    {bannerButton ? (
                      <View style={styles.ctaButton}>
                        <Text style={styles.ctaText}>{bannerButton}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }

          // 🌟 3. STANDARD SPLIT BANNER (Left text & CTA button, Right Mascot/Product Image)
          return (
            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={() => handlePress(bannerLink, item.title)}
              style={styles.slideCard}
            >
              <View style={styles.textContainer}>
                {bannerTag ? (
                  <View style={styles.tagBadge}>
                    <Text style={styles.tagText}>{bannerTag}</Text>
                  </View>
                ) : null}
                <Text numberOfLines={3} style={styles.titleText}>{item.title || 'BazarPeth Special'}</Text>
                {item.subtitle ? (
                  <Text numberOfLines={2} style={styles.subtitleText}>{item.subtitle}</Text>
                ) : null}
                {bannerButton ? (
                  <View style={styles.ctaButton}>
                    <Text style={styles.ctaText}>{bannerButton}</Text>
                  </View>
                ) : null}
              </View>

              {/* Right Media Slot */}
              <View style={styles.imageBox}>
                {mediaSource ? (
                  <UniversalMedia 
                    source={mediaSource} 
                    isVideo={isVideo} 
                    style={styles.bannerImg} 
                    active={activeIndex === index}
                  />
                ) : (
                  <Text style={{ fontSize: 36 }}>{item.iconType || '🎉'}</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Pagination Dot Indicators */}
      {slides.length > 1 && (
        <View style={styles.paginationRow}>
          {slides.map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.dot, 
                activeIndex === i ? styles.activeDot : styles.inactiveDot
              ]} 
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 12,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    paddingBottom: 10,
  },
  cleanFullSlide: {
    width: SCREEN_WIDTH,
    height: 155,
    position: 'relative',
    overflow: 'hidden',
  },
  fullCoverSlide: {
    width: SCREEN_WIDTH,
    height: 155,
    position: 'relative',
    overflow: 'hidden',
  },
  fullCoverMedia: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  gradientScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.38)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  slideCard: {
    width: SCREEN_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    minHeight: 130,
  },
  textContainer: { flex: 1, paddingRight: 12 },
  tagBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FACC15',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    marginBottom: 4,
  },
  tagText: { 
    color: '#0F172A', 
    fontFamily: 'Poppins_800ExtraBold', 
    fontSize: 9.5,
    textTransform: 'uppercase'
  },
  titleText: { 
    color: '#FFFFFF', 
    fontFamily: 'Poppins_800ExtraBold', 
    fontSize: 16, 
    lineHeight: 22 
  },
  subtitleText: { 
    color: 'rgba(255,255,255,0.92)', 
    fontSize: 11.5, 
    marginTop: 2, 
    fontFamily: 'Poppins_500Medium' 
  },
  ctaButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FACC15',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  ctaText: { color: '#0F172A', fontFamily: 'Poppins_800ExtraBold', fontSize: 10.5 },
  imageBox: {
    width: 95,
    height: 95,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  bannerImg: { width: '100%', height: '100%' },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    gap: 4,
  },
  dot: { height: 5, borderRadius: 3 },
  activeDot: { width: 20, backgroundColor: '#FACC15' },
  inactiveDot: { width: 5, backgroundColor: 'rgba(255,255,255,0.45)' },
});

export default React.memo(HeaderBannerCarousel);
