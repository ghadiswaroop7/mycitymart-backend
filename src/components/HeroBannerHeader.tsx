import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, Dimensions, StyleSheet, 
  Pressable, Platform 
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useNavigation } from '@react-navigation/native';
import { handleSDUILink } from '../utils/sduiNavigation';
import YoutubeVideoPlayer from '../screens/YoutubeVideoPlayer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  activeTab?: string; // 'all' | 'men' | 'women' etc.
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
  style 
}: { 
  source: string; 
  isVideo: boolean; 
  style: any; 
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
    return (
      <Video
        source={{ uri: source }}
        style={style}
        resizeMode={ResizeMode.COVER}
        isLooping
        shouldPlay
        isMuted
        useNativeControls={false}
      />
    );
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

export const HeroBannerHeader: React.FC<Props> = ({ activeTab = 'all' }) => {
  const navigation = useNavigation<any>();
  const [layoutData, setLayoutData] = useState<any>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  // 1. Real-time Firestore Listener
  useEffect(() => {
    const tabId = (activeTab || 'all').toLowerCase().trim();
    const docRef = doc(db, 'app_homepage_layout', tabId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setLayoutData(docSnap.data());
      }
    }, (err) => console.warn('[AppStudio] Sync Error:', err));

    return () => unsubscribe();
  }, [activeTab]);

  const slides = layoutData?.heroSlides || (layoutData as any)?.slides || [];
  const currentSlide = slides[activeSlideIndex] || slides[0] || layoutData?.heroBanner;

  const handleBannerTap = (buttonLink?: string, title?: string) => {
    if (!buttonLink) return;
    handleSDUILink(buttonLink, navigation, title);
  };

  if (!currentSlide) return null;

  // Check if Clean Mode is active
  const isCleanAnimation = 
    currentSlide.displayLayout === 'clean_animation' || 
    currentSlide.hideOverlayContent === true;

  // Clean and direct URL
  const rawUrl = (
    currentSlide.videoUrl || 
    currentSlide.video || 
    currentSlide.mediaUrl || 
    currentSlide.url || 
    currentSlide.bgUrl || 
    currentSlide.imageUrl || 
    currentSlide.image || 
    currentSlide.mascotGifUrl || 
    currentSlide.gifUrl || 
    currentSlide.previewUrl || 
    currentSlide.src || 
    ''
  ).trim();

  const mediaUrl = rawUrl.replace('media.giphy.com/media/', 'i.giphy.com/');

  const ytId = getYoutubeId(mediaUrl);
  const isVideo = Boolean(
    ytId ||
    currentSlide.mediaType === 'video' || 
    currentSlide.type === 'video' || 
    currentSlide.bgType === 'video' ||
    Boolean(currentSlide.videoUrl) ||
    Boolean(currentSlide.video) ||
    /\.(mp4|webm|mov|m4v|ogv)(\?.*)?$/i.test(mediaUrl) ||
    mediaUrl.includes('shutterstock.com/video') ||
    mediaUrl.includes('picdn.net/shutterstock/videos') ||
    mediaUrl.includes('pexels.com/video') ||
    mediaUrl.includes('pixabay.com/videos')
  );

  const bgColor = 
    currentSlide.bgColor === 'transparent' || currentSlide.noBackground 
      ? 'transparent' 
      : (currentSlide.bgColor || '#1D58EE');

  return (
    <View style={[styles.headerContainer, { backgroundColor: bgColor }]}>
      
      {/* 🎬 100% FULL-SHAPE ANIMATED VIDEO OR GIF BACKGROUND */}
      {mediaUrl ? (
        <View style={StyleSheet.absoluteFill}>
          <UniversalMedia 
            source={mediaUrl} 
            isVideo={isVideo} 
            style={styles.fullMedia} 
          />
          {/* Add dark gradient ONLY if custom text/buttons are showing */}
          {!isCleanAnimation && <View style={styles.darkGradient} />}
        </View>
      ) : null}

      {/* ──────────────────────────────────────────────────────────
          LOWER BANNER AREA: CLEAN MODE vs CUSTOM OFFER
         ────────────────────────────────────────────────────────── */}
      {isCleanAnimation ? (
        // 🌟 100% PURE CLEAN AD: Full Tappable Area, NO text, NO buttons, NO boxes
        <Pressable 
          onPress={() => handleBannerTap(currentSlide.buttonLink || currentSlide.link || currentSlide.actionUrl, currentSlide.title)}
          style={styles.cleanTapOverlay}
        />
      ) : (
        // 📝 CUSTOM OFFER: Text & Button Layout
        <View style={styles.offerContentRow}>
          <View style={styles.textColumn}>
            {currentSlide.tag ? (
              <View style={styles.badgePill}>
                <Text style={styles.badgeText}>{currentSlide.tag}</Text>
              </View>
            ) : null}
            <Text style={styles.titleText} numberOfLines={2}>{currentSlide.title || 'BazarPeth Offer'}</Text>
            {currentSlide.subtitle ? (
              <Text style={styles.subText} numberOfLines={1}>{currentSlide.subtitle}</Text>
            ) : null}
            <TouchableOpacity 
              onPress={() => handleBannerTap(currentSlide.buttonLink || currentSlide.link || currentSlide.actionUrl, currentSlide.title)}
              style={styles.actionButton}
            >
              <Text style={styles.actionButtonText}>{currentSlide.buttonText || 'Shop Now →'}</Text>
            </TouchableOpacity>
          </View>

          {/* Right Icon / Mascot (Only in split mode) */}
          {currentSlide.displayLayout === 'split' && mediaUrl && !isVideo && (
            <View style={styles.rightBox}>
              <UniversalMedia 
                source={mediaUrl} 
                isVideo={isVideo} 
                style={styles.rightBoxImage} 
              />
            </View>
          )}
        </View>
      )}

      {/* Carousel Indicator Dots */}
      {slides.length > 1 && (
        <View style={styles.paginationRow}>
          {slides.map((_: any, i: number) => (
            <TouchableOpacity
              key={i}
              onPress={() => setActiveSlideIndex(i)}
              style={[
                styles.dot,
                activeSlideIndex === i ? styles.activeDot : styles.inactiveDot
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export default HeroBannerHeader;

const styles = StyleSheet.create({
  headerContainer: {
    width: '100%',
    minHeight: 145,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    position: 'relative',
    justifyContent: 'center',
  },
  fullMedia: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  darkGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  cleanTapOverlay: {
    width: '100%',
    height: 135,
    zIndex: 10,
  },
  offerContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
    minHeight: 110,
  },
  textColumn: {
    maxWidth: SCREEN_WIDTH * 0.58,
  },
  badgePill: {
    backgroundColor: '#FACC15',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 9.5,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#020617',
    textTransform: 'uppercase',
  },
  titleText: {
    fontSize: 15,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#FFFFFF',
    marginBottom: 2,
    lineHeight: 21,
  },
  subText: {
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.92)',
    marginBottom: 8,
    fontFamily: 'Poppins_500Medium',
  },
  actionButton: {
    backgroundColor: '#FACC15',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 10.5,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#020617',
  },
  rightBox: {
    width: 85,
    height: 85,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightBoxImage: {
    width: '100%',
    height: '100%',
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 6,
    zIndex: 10,
  },
  dot: {
    height: 5,
    borderRadius: 3,
  },
  activeDot: {
    width: 18,
    backgroundColor: '#FACC15',
  },
  inactiveDot: {
    width: 5,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
});
