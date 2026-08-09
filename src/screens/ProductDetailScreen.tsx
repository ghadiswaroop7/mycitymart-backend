import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Linking,
  Animated,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Alert
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '../config/firebase';
import { useRoute, useNavigation } from '@react-navigation/native';
import { HugeIcon } from '../components/HugeIcon';
import { ArrowLeft01Icon, FlashIcon, StarIcon, MinusSignIcon, Add01Icon, FavouriteIcon, Share01Icon, PlayCircleIcon, ChevronDownIcon, ChevronUpIcon, Message02Icon, Cancel01Icon, TruckIcon, Tick01Icon, Location01Icon, Shield01Icon, GlobeIcon } from '@hugeicons/core-free-icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { addToCart, removeFromCart } from '../store/slices/cartSlice';
import { toggleWishlist } from '../store/slices/wishlistSlice';
import { getProductById, getProductReviews, addReview, getRelatedProducts, getAvailableCoupons, toggleWishlistItem } from '../services/firestoreService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MiniProductCard from '../components/MiniProductCard';
import SafeImage from '../components/SafeImage';
import Carousel from 'react-native-reanimated-carousel';
import ImageViewer from 'react-native-image-zoom-viewer';
import { useVideoPlayer, VideoView } from 'expo-video';
import YoutubeVideoPlayer from './YoutubeVideoPlayer';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Extract YouTube video ID:
const getYoutubeId = (url: string): string | null => {
  if (!url) return null;
  const patterns = [
    /youtube\.com\/watch\?v=([^&\n?#]+)/,
    /youtube\.com\/embed\/([^?\n]+)/,
    /youtu\.be\/([^?\n]+)/,
    /youtube\.com\/v\/([^?\n]+)/,
    /youtube\.com\/shorts\/([^?\n#&]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m && m[1]) return m[1].trim();
  }
  return null;
};

// Extract Vimeo video ID:
const getVimeoId = (url: string): string | null => {
  if (!url) return null;
  const m = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
  return m ? m[1] : null;
};

// Check if a URL is a direct/streamable video.
// Firebase Storage URLs look like: ...o/video.mp4?alt=media&token=...
// The extension is NOT at the end, so we check the pathname portion.
const isDirectVideoUrl = (url: string): boolean => {
  if (!url) return false;
  try {
    const pathname = new URL(url).pathname;
    return /\.(mp4|mov|webm|m3u8|mkv|avi|3gp|ogv)$/i.test(pathname);
  } catch {
    // Fallback: check raw string for common video extensions anywhere
    return /\.(mp4|mov|webm|m3u8|mkv|avi|3gp|ogv)(\?|&|#|$)/i.test(url);
  }
};

// Check if a URL is clearly NOT a video host (used as a last-resort guard)
const isKnownNonVideoUrl = (url: string): boolean => {
  if (!url) return true;
  try {
    const host = new URL(url).hostname.toLowerCase();
    return /(youtube|youtu\.be|vimeo|dailymotion|tiktok)\./.test(host);
  } catch {
    return false;
  }
};

// Extract domain from URL
const getDomain = (url: string) => {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '');
  } catch (e) {
    return url;
  }
};

// Build media items (parse firestore mediaItems or fallback)
const buildMediaItems = (product: any) => {
  const items: any[] = [];

  // ── DEBUG: log the raw videoUrl from the database ──
  if (product.videoUrl) {
  }

  if (product.mediaItems && Array.isArray(product.mediaItems)) {
    product.mediaItems.forEach((item: any) => {
      items.push({ type: item.type, url: item.url, thumbnail: item.thumbnail });
    });
  } else {
    // ── Fallback: resolve legacy videoUrl field ──
    const rawVideo: string = (product.videoUrl || '').trim();
    if (rawVideo) {
      const ytId = getYoutubeId(rawVideo);
      const vimeoId = getVimeoId(rawVideo);

      if (ytId) {
        items.push({
          type: 'youtube',
          videoId: ytId,
          thumbnail: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
          url: `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&playsinline=1`,
        });
      } else if (vimeoId) {
        items.push({
          type: 'vimeo',
          videoId: vimeoId,
          url: `https://player.vimeo.com/video/${vimeoId}?autoplay=1&playsinline=1`,
        });
      } else {
        // Default: if videoUrl exists and is NOT YouTube/Vimeo, treat as direct video
        // This handles Firebase Storage URLs, S3 URLs, Cloudinary, etc.
        items.push({ type: 'video', url: rawVideo });
      }
    }

    // Images come after the video so video is always index 0
    const images: string[] = product.images || (product.imageUrl ? [product.imageUrl] : []);
    images.forEach((img: string) => {
      if (img && typeof img === 'string') items.push({ type: 'image', url: img });
    });
  }



  // Normalize any 'video' items inside mediaItems that are actually YouTube/Vimeo/direct
  return items.map(item => {
    if (item.type === 'video' || item.type === 'link') {
      const ytId = getYoutubeId(item.url);
      if (ytId) {
        return {
          ...item,
          type: 'youtube',
          videoId: ytId,
          thumbnail: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
          url: `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&playsinline=1`,
        };
      }
      const vimeoId = getVimeoId(item.url);
      if (vimeoId) {
        return {
          ...item,
          type: 'vimeo',
          videoId: vimeoId,
          url: `https://player.vimeo.com/video/${vimeoId}?autoplay=1&playsinline=1`,
        };
      }
      // If it's a 'link' that's NOT a video file, keep it as link
      if (item.type === 'link' && !isDirectVideoUrl(item.url)) return item;
      // Otherwise treat as direct video file
      if (isDirectVideoUrl(item.url)) return { ...item, type: 'video' };
    }
    return item;
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// WebVideoPlayer — HTML5 <video> for web platform (expo-av has issues on web)
// ─────────────────────────────────────────────────────────────────────────────
const WebVideoPlayer = ({ item, shouldPlay }: { item: any; shouldPlay: boolean }) => {
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<any>(null);

  useEffect(() => {
    // Attach native HTML5 <video> element to the container
    if (Platform.OS !== 'web' || !containerRef.current) return;
    const container = containerRef.current as unknown as HTMLDivElement;

    // Only create once
    if (!videoElementRef.current) {
      const vid = document.createElement('video');
      vid.src = item.url;
      vid.controls = true;
      vid.playsInline = true;
      vid.preload = 'metadata';
      vid.style.width = '100%';
      vid.style.height = '100%';
      vid.style.objectFit = 'contain';
      vid.style.backgroundColor = '#000';
      vid.style.borderRadius = '0px';
      container.innerHTML = '';
      container.appendChild(vid);
      videoElementRef.current = vid;
    }
  }, [item.url]);

  // Play / Pause based on carousel swipe
  useEffect(() => {
    const vid = videoElementRef.current;
    if (!vid) return;
    if (shouldPlay) {
      vid.play().catch(() => {});
    } else {
      vid.pause();
    }
  }, [shouldPlay]);

  return (
    <View
      ref={containerRef}
      style={{
        width: SCREEN_WIDTH,
        height: SCREEN_WIDTH * 1.35,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden' as any,
      }}
    />
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DirectVideoPlayer — renders .mp4 / .mov / .webm via expo-av (native) or
// HTML5 <video> (web), with loading state, error feedback, and auto-pause.
// ─────────────────────────────────────────────────────────────────────────────
const DirectVideoPlayer = ({ item, shouldPlay }: { item: any; shouldPlay: boolean }) => {
  const videoUrl = item?.url || '';
  const videoId = item?.videoId || getYoutubeId(videoUrl);

  if (videoId) {
    return (
      <View style={nativeVideoStyles.outerContainer}>
        <View style={nativeVideoStyles.videoWrapper}>
          <YoutubeVideoPlayer
            videoId={videoId}
            shouldPlay={shouldPlay}
            width={SCREEN_WIDTH}
            height={VIDEO_HEIGHT}
          />
        </View>
      </View>
    );
  }

  // On web, use native HTML5 video for reliability
  if (Platform.OS === 'web') {
    return <WebVideoPlayer item={item} shouldPlay={shouldPlay} />;
  }

  // On native (iOS/Android), use NativeVideoPlayer
  return <NativeVideoPlayer item={item} shouldPlay={shouldPlay} />;
};

const VIDEO_HEIGHT = Math.round(SCREEN_WIDTH * (9 / 16)); // 16:9 aspect ratio
const CAROUSEL_HEIGHT = SCREEN_WIDTH * 1.5;

const nativeVideoStyles = StyleSheet.create({
  outerContainer: {
    width: SCREEN_WIDTH,
    height: CAROUSEL_HEIGHT,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoWrapper: {
    width: SCREEN_WIDTH,
    height: VIDEO_HEIGHT,
    backgroundColor: '#000',
  },
  video: {
    width: SCREEN_WIDTH,
    height: VIDEO_HEIGHT,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ccc',
    marginTop: 12,
    fontSize: 12,
    fontWeight: '500',
  },
  errorContainer: {
    width: SCREEN_WIDTH,
    height: CAROUSEL_HEIGHT,
    backgroundColor: '#1C1C1C',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    color: '#fff',
    marginTop: 16,
    fontWeight: '700',
    fontSize: 15,
    textAlign: 'center',
  },
  errorSubtitle: {
    color: '#9CA3AF',
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#FA8C16',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});

const NativeVideoPlayerInternal = ({ url: videoUrl, shouldPlay }: { url: string; shouldPlay: boolean }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Log the video URL right before player initialization
  // Initialize the player with a valid source string (or fallback to empty string)
  const player = useVideoPlayer(videoUrl || '', playerInstance => {
    playerInstance.loop = true;
    playerInstance.muted = false;
    if (shouldPlay) {
      playerInstance.play();
    }
  });

  const lastLoadedUrlRef = useRef<string | null>(videoUrl || null);

  useEffect(() => {
    if (!player) return;
    const subPlaying = player.addListener('playingChange', (event) => {
      setIsPlaying(event.isPlaying);
    });
    const subStatus = player.addListener('statusChange', ({ status, error }) => {
      if (error) {
        console.error("Video Playback Error:", error);
        setHasError(true);
      } else {
        setHasError(false);
      }
    });
    return () => {
      subPlaying.remove();
      subStatus.remove();
    }
  }, [player]);

  // Synchronize source when videoUrl changes dynamically
  useEffect(() => {
    if (!player || !videoUrl) return;
    if (lastLoadedUrlRef.current !== videoUrl) {
      player.replace(videoUrl);
      lastLoadedUrlRef.current = videoUrl;
      if (shouldPlay) {
        player.play();
      }
    }
  }, [player, videoUrl, shouldPlay]);

  // Pause/Play when carousel swipes away or comes into view
  useEffect(() => {
    if (!player) return;
    if (shouldPlay) {
      player.play();
    } else {
      player.pause();
    }
  }, [shouldPlay, player]);

  const handlePlayPress = useCallback(() => {
    setHasError(false);
    if (player) player.play();
  }, [player]);

  if (hasError) {
    return (
      <View style={nativeVideoStyles.errorContainer}>
        <HugeIcon icon={PlayCircleIcon} color="#FA8C16" size={48} />
        <Text style={nativeVideoStyles.errorTitle}>Unable to play video</Text>
        <Text style={nativeVideoStyles.errorSubtitle}>
          The video format may not be supported on this device.
        </Text>
        <TouchableOpacity style={nativeVideoStyles.retryButton} onPress={handlePlayPress}>
          <Text style={nativeVideoStyles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={nativeVideoStyles.outerContainer}>
      <View style={nativeVideoStyles.videoWrapper}>
        <VideoView
          player={player}
          style={nativeVideoStyles.video}
          contentFit="contain"
          nativeControls={true}
          allowsPictureInPicture={true}
        />

        {/* Tap-to-play overlay (shown until user taps) */}
        {!isPlaying && (
          <TouchableOpacity
            style={nativeVideoStyles.overlay}
            activeOpacity={0.8}
            onPress={handlePlayPress}
          >
            <View style={nativeVideoStyles.playButton}>
              <HugeIcon icon={PlayCircleIcon} color="#008B45" size={44} fill="#008B45" />
            </View>
            <Text style={[nativeVideoStyles.loadingText, { color: '#fff', fontWeight: '600' }]}>Tap to play</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const NativeVideoPlayer = ({ item, shouldPlay }: { item: any; shouldPlay: boolean }) => {
  const videoUrl = item?.url || '';

  if (!videoUrl) {
    return (
      <View style={nativeVideoStyles.errorContainer}>
        <HugeIcon icon={PlayCircleIcon} color="#FA8C16" size={48} />
        <Text style={nativeVideoStyles.errorTitle}>Invalid Video</Text>
        <Text style={nativeVideoStyles.errorSubtitle}>
          The video URL is missing or invalid.
        </Text>
      </View>
    );
  }

  return <NativeVideoPlayerInternal url={videoUrl} shouldPlay={shouldPlay} />;
};

const ProductGallery = ({ product, activeImageIndex, onIndexChange }: any) => {
  const mediaItems = buildMediaItems(product);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [isZoomVisible, setIsZoomVisible] = useState(false);
  const carouselRef = useRef<any>(null);
  // NOTE: videoRef is kept only for legacy compat but DirectVideoPlayer manages its own ref.
  
  const imageUrls = mediaItems
    .filter((item: any) => item.type === 'image')
    .map((item: any) => ({ url: item.url }));
    
  const zoomIndex = imageUrls.findIndex((img: any) => img.url === (mediaItems[activeImageIndex] as any)?.url);
  const initialZoomIndex = zoomIndex >= 0 ? zoomIndex : 0;

  // No manual pause needed — DirectVideoPlayer handles shouldPlay via prop.
  
  return (
    <View style={{ backgroundColor: '#fff', position: 'relative' }}>
      {/* Main Display Area */}
      <View style={{ height: SCREEN_WIDTH * 1.35, backgroundColor: '#FFFFFF' }}>
        <Carousel
          ref={carouselRef}
          loop={false}
          width={SCREEN_WIDTH}
          height={SCREEN_WIDTH * 1.35}
          autoPlay={false}
          data={mediaItems}
          scrollAnimationDuration={250}
          onSnapToItem={(index) => {
            onIndexChange(index);
            setVideoPlaying(false);
          }}
          renderItem={({ item, index }: any) => {
            if (item.type === 'youtube' || item.type === 'video') {
              return (
                <DirectVideoPlayer
                  key={`video-${index}`}
                  item={item}
                  shouldPlay={activeImageIndex === index}
                />
              );
            }

            if (item.type === 'vimeo') {
              return (
                <View style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.35, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
                  {videoPlaying && activeImageIndex === index ? (
                    <WebView
                      source={{ uri: item.url }}
                      style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.7 }}
                      allowsInlineMediaPlayback={true}
                      mediaPlaybackRequiresUserAction={false}
                      javaScriptEnabled={true}
                    />
                  ) : (
                    <TouchableOpacity
                      style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.35, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111' }}
                      onPress={() => setVideoPlaying(true)}
                      activeOpacity={0.9}
                    >
                      <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(26,183,234,0.9)', justifyContent: 'center', alignItems: 'center' }}>
                          <HugeIcon icon={PlayCircleIcon} color="#fff" size={40} fill="#fff" />
                        </View>
                        <Text style={{ color: '#fff', marginTop: 12, fontSize: 13, fontWeight: '600', opacity: 0.8 }}>Tap to play Vimeo video</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              );
            }

            if (item.type === 'link') {
              return (
                <View style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.35, backgroundColor: '#F8F9FA', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                  <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 24, width: '100%', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 }}>
                    <HugeIcon icon={GlobeIcon} size={48} color="#FA8C16" />
                    <Text style={{ fontSize: 18, fontWeight: '800', color: '#1C1C1C', marginTop: 16, marginBottom: 8, textAlign: 'center' }}>External Product Link</Text>
                    <Text style={{ fontSize: 14, color: '#71717A', marginBottom: 24, textAlign: 'center' }}>{getDomain(item.url)}</Text>
                    <TouchableOpacity 
                      style={{ backgroundColor: '#FA8C16', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}
                      onPress={() => Linking.openURL(item.url)}
                    >
                      <HugeIcon icon={GlobeIcon} size={16} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Open in Browser</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }

            // Image type
            return (
              <TouchableOpacity
                style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.35, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}
                activeOpacity={0.95}
                onPress={() => setIsZoomVisible(true)}
              >
                <SafeImage
                  uri={item.url || 'https://via.placeholder.com/400'}
                  style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 1.35 }}
                  resizeMode="contain"
                />
              </TouchableOpacity>
            );
          }}
        />

        {/* Smooth Page Indicator (Dots) */}
        {mediaItems.length > 1 && (
          <View style={{ position: 'absolute', bottom: 16, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 }}>
            {mediaItems.map((_, i) => (
              <View 
                key={i} 
                style={{ 
                  height: 6, 
                  borderRadius: 3, 
                  backgroundColor: activeImageIndex === i ? '#FA8C16' : '#E5E7EB',
                  width: activeImageIndex === i ? 20 : 6
                }} 
              />
            ))}
          </View>
        )}
      </View>
      
      {/* Floating Vertical Thumbnail Strip (Right Side) */}
      {mediaItems.length > 1 && (
        <View 
          style={{
            position: 'absolute',
            right: 16,
            bottom: 48, // Placed safely above the -24px overlap from the white sheet
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.75)',
            borderRadius: 20,
            paddingVertical: 10,
            paddingHorizontal: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 8,
            maxHeight: 280
          }}
        >
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {mediaItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  onIndexChange(index);
                  setVideoPlaying(false);
                  carouselRef.current?.scrollTo({ index, animated: true });
                }}
                style={[
                  { width: 45, height: 45, borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent', backgroundColor: '#fff' },
                  activeImageIndex === index && { borderColor: '#008B45' } // Premium brand-green active indicator
                ]}
                activeOpacity={0.9}
              >
                {item.type === 'youtube' || item.type === 'video' || item.type === 'vimeo' ? (
                  <View style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#111' }}>
                    {item.thumbnail ? (
                      <SafeImage uri={item.thumbnail} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : (
                      <View style={{ width: '100%', height: '100%', backgroundColor: item.type === 'vimeo' ? '#1ab7ea22' : '#1C1C1C', justifyContent: 'center', alignItems: 'center' }}>
                        <HugeIcon icon={PlayCircleIcon} color={item.type === 'vimeo' ? '#1ab7ea' : '#FA8C16'} size={18} />
                      </View>
                    )}
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' }]}>
                      <HugeIcon icon={PlayCircleIcon} color="white" size={16} />
                    </View>
                  </View>
                ) : item.type === 'link' ? (
                  <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF7E6' }}>
                    <HugeIcon icon={GlobeIcon} color="#FA8C16" size={20} />
                  </View>
                ) : (
                  <SafeImage uri={item.url} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Full Screen Zoom Modal */}
      <Modal visible={isZoomVisible} transparent={true} onRequestClose={() => setIsZoomVisible(false)} animationType="fade">
        <View style={{ flex: 1, backgroundColor: '#000000', position: 'relative' }}>
          <ImageViewer
            imageUrls={imageUrls}
            index={initialZoomIndex}
            onCancel={() => setIsZoomVisible(false)}
            enableSwipeDown={true}
            saveToLocalByLongPress={false}
          />
          <TouchableOpacity
            style={{
              position: 'absolute',
              top: Platform.OS === 'ios' ? 60 : 30,
              right: 20,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(0,0,0,0.5)',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 999
            }}
            onPress={() => setIsZoomVisible(false)}
          >
            <HugeIcon icon={Cancel01Icon} color="#FFFFFF" size={24} />
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

// Skeleton Component
const SkeletonBox = ({ width, height, borderRadius = 8, style }: any) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(animatedValue, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });
  return <Animated.View style={[{ width, height, borderRadius, backgroundColor: '#E5E7EB', opacity }, style]} />;
};

export default function ProductDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const scrollY = useRef(new Animated.Value(0)).current;

  const productId = route.params?.productId;

  // Global State
  const cartItem = useSelector((state: RootState) => state.cart.items.find(i => i.id === productId));
  const quantity = cartItem ? cartItem.quantity : 0;
  const isWishlisted = useSelector((state: RootState) => state.wishlist.items.includes(productId));
  const user = useSelector((state: RootState) => state.auth.user);
  const uid = user?.uid;

  // Local State
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});

  // Features State
  const [reviews, setReviews] = useState<any[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);

  // Review Modal State
  const [isReviewModalVisible, setIsReviewModalVisible] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Fetch Data
  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) return;
      try {
        setLoading(true);
        const [productData, reviewsData] = await Promise.allSettled([
          getProductById(productId),
          getProductReviews(productId),
        ]);
        
        if (productData.status === 'fulfilled' && productData.value) {
          setProduct(productData.value);
          const related = await getRelatedProducts(productData.value.category || '', productId);
          setRelatedProducts(related);
          
          await saveToRecentlyViewed(productData.value);
          await loadRecentlyViewed();
        } else {
          setError(true);
        }
        
        if (reviewsData.status === 'fulfilled') {
          setReviews(reviewsData.value);
        }
      } catch (e) {
        console.error('Product load error:', e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [productId]);

  const saveToRecentlyViewed = async (prod: any) => {
    try {
      const stored = await AsyncStorage.getItem('mcm_recently_viewed');
      let viewed = stored ? JSON.parse(stored) : [];
      viewed = viewed.filter((p: any) => p.id !== prod.id); // Remove if exists
      viewed.unshift({ id: prod.id, name: prod.name, price: prod.price, imageUrl: prod.images?.[0] || prod.imageUrl, vendor: prod.vendor });
      if (viewed.length > 10) viewed.pop();
      await AsyncStorage.setItem('mcm_recently_viewed', JSON.stringify(viewed));
    } catch (e) {}
  };

  const loadRecentlyViewed = async () => {
    try {
      const stored = await AsyncStorage.getItem('mcm_recently_viewed');
      if (stored) {
        const viewed = JSON.parse(stored);
        setRecentlyViewed(viewed.filter((p: any) => p.id !== productId));
      }
    } catch (e) {}
  };

  const handleRateProduct = async () => {
    if (!uid) {
      Alert.alert('Login Required', 'Please login to rate this product.');
      return;
    }
    
    setLoading(true);
    try {
      const { getUserOrders } = require('../services/firestoreService');
      const userOrders = await getUserOrders(uid);
      
      const hasPurchased = userOrders.some((order: any) => 
        order.status?.toLowerCase() === 'delivered' && 
        order.items?.some((item: any) => item.id === productId)
      );
      
      if (!hasPurchased) {
        Alert.alert(
          'Verified Purchase Only', 
          'You can only review products you have successfully purchased and received.'
        );
      } else {
        setIsReviewModalVisible(true);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to verify purchase history.');
    } finally {
      setLoading(false);
    }
  };
  const pickReviewImages = async () => {
    if (reviewImages.length >= 3) {
      Alert.alert('Limit Reached', 'You can only upload up to 3 images per review.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 3 - reviewImages.length,
      quality: 0.7,
    });
    
    if (!result.canceled && result.assets) {
      const newImages = result.assets.map(a => a.uri);
      setReviewImages(prev => [...prev, ...newImages].slice(0, 3));
    }
  };

  const handleSubmitReview = async () => {
    if (reviewText.trim().length < 5) {
      Alert.alert('Too Short', 'Please write at least a few words about your experience.');
      return;
    }
    setIsSubmittingReview(true);
    try {
      const uploadedUrls: string[] = [];
      
      // Upload Images
      if (reviewImages.length > 0) {
        const storage = getStorage(app);
        for (let i = 0; i < reviewImages.length; i++) {
          const uri = reviewImages[i];
          const response = await fetch(uri);
          const blob = await response.blob();
          const filename = `reviews/${productId}/${uid}_${Date.now()}_${i}.jpg`;
          const storageRef = ref(storage, filename);
          await uploadBytes(storageRef, blob);
          const downloadUrl = await getDownloadURL(storageRef);
          uploadedUrls.push(downloadUrl);
        }
      }
      
      const reviewData = {
        userId: uid,
        userName: user?.displayName || 'Verified Buyer',
        rating: reviewRating,
        comment: reviewText.trim(),
        images: uploadedUrls,
        isVerifiedPurchase: true,
        productId
      };
      
      await addReview(productId, reviewData);
      
      // Update local state so it shows up instantly
      setReviews(prev => [{ ...reviewData, createdAt: new Date() }, ...prev]);
      
      setIsReviewModalVisible(false);
      setReviewText('');
      setReviewRating(5);
      setReviewImages([]);
      Alert.alert('Success', 'Your review has been submitted successfully!');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmittingReview(false);
    }
  };
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <SkeletonBox width="100%" height={SCREEN_WIDTH * 1.35} borderRadius={0} />
        <View style={{ padding: 20 }}>
          <SkeletonBox width="60%" height={28} style={{ marginBottom: 16 }} />
          <SkeletonBox width="30%" height={20} style={{ marginBottom: 24 }} />
          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 32 }}>
            <SkeletonBox width={60} height={60} borderRadius={30} />
            <SkeletonBox width={60} height={60} borderRadius={30} />
          </View>
          <SkeletonBox width="100%" height={100} style={{ marginBottom: 16 }} />
        </View>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: '#1C1C1C', marginBottom: 16, textAlign: 'center' }}>Product Not Found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ backgroundColor: '#FA8C16', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 24 }}>
          <Text style={{ fontWeight: '700', color: '#fff', fontSize: 16 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const productPrice = product?.price ?? 0;
  const productOriginalPrice = product?.originalPrice ?? product?.mrp ?? productPrice;
  const productName = product?.name ?? 'Product';
  const productRating = product?.rating ?? 4.0;
  const productReviewCount = product?.reviewCount ?? reviews.length;
  
  const discount = productOriginalPrice > productPrice
    ? Math.round(((productOriginalPrice - productPrice) / productOriginalPrice) * 100)
    : 0;

  // Header Animation
  const headerOpacity = scrollY.interpolate({
    inputRange: [SCREEN_WIDTH * 0.8, SCREEN_WIDTH * 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* ── FLOATING BUTTONS (Glassmorphic) ── */}
      <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + 12, left: 0, right: 0, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', zIndex: 20 }}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.85)', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 }}
        >
          <HugeIcon icon={ArrowLeft01Icon} size={24} color="#1C1C1C" />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity 
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.85)', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 }}
          >
            <HugeIcon icon={Share01Icon} size={22} color="#1C1C1C" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => {
              if (productId) {
                dispatch(toggleWishlist(productId));
                if (product && uid) toggleWishlistItem(uid, product);
              }
            }} 
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.85)', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 }}
          >
            <HugeIcon icon={FavouriteIcon} size={22} color={isWishlisted ? "#FF3366" : "#1C1C1C"} fill={isWishlisted ? "#FF3366" : "transparent"} />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 120 }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
        bounces={false}
      >
        
        {/* 1. MEDIA CAROUSEL & ZEPTO SPEED TAG */}
        <View style={{ position: 'relative' }}>
          <ProductGallery 
            product={product} 
            activeImageIndex={activeImageIndex}
            onIndexChange={setActiveImageIndex}
          />
          {/* Subtle gradient overlay at the bottom of the image for text contrast */}
          <View pointerEvents="none" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: 'rgba(0,0,0,0.03)' }} />
          
          {/* Zepto-style Speed Tag */}
          <View pointerEvents="none" style={{ position: 'absolute', top: insets.top + 72, left: 20, backgroundColor: 'rgba(255, 255, 255, 0.95)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 6 }}>
            <HugeIcon icon={FlashIcon} size={16} color="#6366F1" fill="#6366F1" />
            <Text style={{ marginLeft: 6, fontSize: 13, fontWeight: '800', color: '#1C1C1C', letterSpacing: 0.5 }}>10 MINS</Text>
          </View>
        </View>

        <View style={{ backgroundColor: '#FFFFFF', marginTop: -24, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 12, zIndex: 10 }}>
          
          {/* PRODUCT TITLE */}
          <Text style={{ fontSize: 22, color: '#1C1C1C', fontWeight: '700', lineHeight: 30, marginBottom: 8 }}>{productName}</Text>
          
          {/* Rating (Amazon style robust but clean) */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              {[1,2,3,4,5].map(s => <HugeIcon icon={StarIcon} key={s} size={16} color={s <= Math.round(productRating) ? "#038d63" : "#E5E7EB"} fill={s <= Math.round(productRating) ? "#038d63" : "#E5E7EB"} />)}
            </View>
            <Text style={{ fontSize: 14, color: '#038d63', fontWeight: '700', marginLeft: 8 }}>{productRating.toFixed(1)}</Text>
            <Text style={{ fontSize: 14, color: '#71717A', marginLeft: 8, fontWeight: '500' }}>({productReviewCount} ratings)</Text>
          </View>
          
          {/* Price Block */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginBottom: 20, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Text style={{ fontSize: 20, fontWeight: '600', color: '#1C1C1C', marginTop: 4 }}>₹</Text>
              <Text style={{ fontSize: 32, fontWeight: '800', color: '#1C1C1C', letterSpacing: -1 }}>{productPrice}</Text>
            </View>
            
            {discount > 0 && (
              <>
                <Text style={{ fontSize: 16, color: '#A1A1AA', fontWeight: '500', textDecorationLine: 'line-through', marginBottom: 4 }}>₹{productOriginalPrice}</Text>
                <View style={{ backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 4, borderWidth: 1, borderColor: '#FEE2E2' }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#EF4444' }}>{discount}% OFF</Text>
                </View>
              </>
            )}
          </View>

          {/* Flipkart-Style Vibrant Offers */}
          <View style={{ backgroundColor: '#F0FDF4', borderRadius: 12, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#DCFCE7' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <HugeIcon icon={FlashIcon} size={18} color="#16A34A" fill="#16A34A" />
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#166534', marginLeft: 8 }}>Available Offers</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
              <Text style={{ fontSize: 13, color: '#16A34A', marginRight: 8, marginTop: 2 }}>•</Text>
              <Text style={{ fontSize: 13, color: '#15803D', flex: 1, lineHeight: 20 }}><Text style={{ fontWeight: '700' }}>Bank Offer:</Text> 10% off on Select Credit Cards, up to ₹1,250.</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Text style={{ fontSize: 13, color: '#16A34A', marginRight: 8, marginTop: 2 }}>•</Text>
              <Text style={{ fontSize: 13, color: '#15803D', flex: 1, lineHeight: 20 }}><Text style={{ fontWeight: '700' }}>Special Price:</Text> Get extra 5% off (price inclusive of cashback/coupon).</Text>
            </View>
          </View>

          {/* Dynamic Variants Selection */}
          {(product.attributes || product.variants) && Object.entries(product.attributes || product.variants).map(([attrKey, attrValues]: any) => {
            if (!Array.isArray(attrValues) || attrValues.length === 0) return null;
            return (
              <View key={attrKey} style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 16, color: '#1C1C1C', fontWeight: '700', marginBottom: 12 }}>{attrKey}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 24 }}>
                  {attrValues.map((val: string) => (
                    <TouchableOpacity 
                      key={val}
                      onPress={() => setSelectedAttributes(prev => ({ ...prev, [attrKey]: val }))}
                      style={{ 
                        borderWidth: 1.5, 
                        borderColor: selectedAttributes[attrKey] === val ? '#6366F1' : '#E5E7EB', 
                        backgroundColor: selectedAttributes[attrKey] === val ? '#EEF2FF' : '#FFFFFF',
                        paddingHorizontal: 20, height: 48, borderRadius: 12, minWidth: 48,
                        justifyContent: 'center', alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 15, fontWeight: selectedAttributes[attrKey] === val ? '700' : '500', color: selectedAttributes[attrKey] === val ? '#4F46E5' : '#1C1C1C' }}>{val}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            );
          })}

          {/* Trust Badges - Amazon Style layout with modern look */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, paddingHorizontal: 20, marginBottom: 28 }} contentContainerStyle={{ gap: 24 }}>
            {[
              { icon: Shield01Icon, title: 'Top Brand' },
              { icon: ArrowLeft01Icon, title: '7 Days Return' },
              { icon: FlashIcon, title: 'Fast Pay' },
              { icon: Tick01Icon, title: 'Secure' }
            ].map((badge, i) => (
              <View key={i} style={{ alignItems: 'center', width: 70 }}>
                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#F4F4F5', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }}>
                  <HugeIcon icon={badge.icon} size={22} color="#1C1C1C" />
                </View>
                <Text style={{ fontSize: 12, color: '#3F3F46', fontWeight: '500', textAlign: 'center', lineHeight: 16 }}>{badge.title}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Highlights 2x2 Grid */}
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#1C1C1C', marginBottom: 16 }}>Highlights</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 }}>
            {[
              { label: 'Brand', value: product.brand || product.vendor || 'BazarPeth' },
              { label: 'Delivery', value: '10 - 20 Mins' },
              { label: 'Return Policy', value: '7 Days Easy Return' },
              { label: 'Quality', value: '100% Authentic' }
            ].map((spec, i) => (
              <View key={i} style={{ width: (SCREEN_WIDTH - 40 - 12) / 2, backgroundColor: '#F4F4F5', padding: 16, borderRadius: 16 }}>
                <Text style={{ fontSize: 12, color: '#71717A', marginBottom: 4, fontWeight: '500' }}>{spec.label}</Text>
                <Text style={{ fontSize: 14, color: '#1C1C1C', fontWeight: '700' }} numberOfLines={1}>{spec.value}</Text>
              </View>
            ))}
          </View>

          {/* Description (Expandable look) */}
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#1C1C1C', marginBottom: 12 }}>Product Details</Text>
          <Text style={{ fontSize: 15, color: '#3F3F46', lineHeight: 24, marginBottom: 32 }}>
            {product.description || 'Premium quality product brought to you by BazarPeth. Enjoy 20-minute local delivery and unparalleled service. This is a mix of highly efficient service and amazing product quality that stands out in the market.'}
          </Text>

          {/* MODERN RATINGS & REVIEWS */}
          <View style={{ marginBottom: 32 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#1C1C1C' }}>Ratings & Reviews</Text>
              <TouchableOpacity onPress={handleRateProduct}>
                <Text style={{ fontSize: 14, color: '#6366F1', fontWeight: '700' }}>Rate Product</Text>
              </TouchableOpacity>
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
              <View style={{ flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: '#F4F4F5', paddingRight: 16 }}>
                <Text style={{ fontSize: 44, fontWeight: '800', color: '#1C1C1C', letterSpacing: -1 }}>{productRating.toFixed(1)}</Text>
                <Text style={{ fontSize: 13, color: '#71717A', fontWeight: '500', marginTop: 4, textAlign: 'center' }}>{productReviewCount} Ratings & {reviews.length} Reviews</Text>
              </View>
              <View style={{ flex: 1.5, paddingLeft: 16, gap: 6 }}>
                {[
                  { star: 5, pct: 65, color: '#038d63' },
                  { star: 4, pct: 20, color: '#038d63' },
                  { star: 3, pct: 10, color: '#038d63' },
                  { star: 2, pct: 3, color: '#f5a623' },
                  { star: 1, pct: 2, color: '#d9534f' }
                ].map(item => (
                  <View key={item.star} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 12, color: '#52525B', width: 10, fontWeight: '600' }}>{item.star}</Text>
                    <HugeIcon icon={StarIcon} size={10} color="#A1A1AA" fill="#A1A1AA" />
                    <View style={{ flex: 1, height: 6, backgroundColor: '#F4F4F5', borderRadius: 3, overflow: 'hidden' }}>
                      <View style={{ width: `${item.pct}%`, height: '100%', backgroundColor: item.color, borderRadius: 3 }} />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* User Reviews List */}
            {reviews.length > 0 ? (
              <View style={{ gap: 16 }}>
                {reviews.slice(0, 3).map((review, index) => (
                  <View key={index} style={{ paddingBottom: 16, borderBottomWidth: index === 2 ? 0 : 1, borderBottomColor: '#F4F4F5' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <View style={{ backgroundColor: (review.rating || 5) >= 3 ? '#038d63' : '#d9534f', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{review.rating || 5}</Text>
                        <HugeIcon icon={StarIcon} size={10} color="#fff" fill="#fff" />
                      </View>
                      <Text style={{ fontSize: 14, color: '#1C1C1C', fontWeight: '700' }}>{review.userName || 'Verified Buyer'}</Text>
                      {review.isVerifiedPurchase && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ECFDF5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12, marginLeft: 'auto' }}>
                          <HugeIcon icon={Tick01Icon} size={12} color="#059669" />
                          <Text style={{ fontSize: 10, color: '#059669', fontWeight: '700' }}>Verified Purchase</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontSize: 14, color: '#3F3F46', lineHeight: 22, marginBottom: review.images?.length > 0 ? 12 : 0 }}>{review.comment || review.text || 'Excellent product, totally worth the price.'}</Text>
                    
                    {/* Review Images */}
                    {review.images && review.images.length > 0 && (
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        {review.images.map((img: string, i: number) => (
                          <View key={i} style={{ width: 64, height: 64, borderRadius: 8, overflow: 'hidden', backgroundColor: '#F4F4F5', borderWidth: 1, borderColor: '#E5E7EB' }}>
                            <SafeImage uri={img} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View style={{ paddingVertical: 24, alignItems: 'center', backgroundColor: '#F4F4F5', borderRadius: 12 }}>
                <Text style={{ fontSize: 14, color: '#A1A1AA', fontWeight: '500' }}>No reviews yet. Be the first to review!</Text>
              </View>
            )}
          </View>

        </View>
      </Animated.ScrollView>

      {/* ── ZEPTO STYLE BOTTOM ACTION BAR ── */}
      <View style={{ 
        position: 'absolute', bottom: 0, left: 0, right: 0, 
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 12),
        shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 15
      }}>
        {quantity === 0 ? (
          <TouchableOpacity 
            style={{ width: '100%', height: 56, borderRadius: 16, backgroundColor: '#6366F1', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 }}
            onPress={() => {
              dispatch(addToCart({ 
                id: product.id,
                name: product.name,
                price: productPrice,
                originalPrice: productOriginalPrice,
                quantity: 1,
                imageUrl: product.images?.[0] || product.imageUrl,
                vendor: product.vendor,
                selectedVariants: Object.keys(selectedAttributes).length > 0 ? selectedAttributes : undefined,
              }));
              navigation.navigate('Checkout');
            }}
          >
            <View>
              <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '500', opacity: 0.8, marginBottom: 2 }}>Total Price</Text>
              <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '800' }}>₹{productPrice}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700' }}>Add to Cart</Text>
              <HugeIcon icon={ChevronDownIcon} size={20} color="#FFF" style={{ transform: [{ rotate: '-90deg' }] }} />
            </View>
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ height: 56, borderRadius: 16, backgroundColor: '#EEF2FF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, flex: 0.4 }}>
              <TouchableOpacity onPress={() => dispatch(removeFromCart(product.id))} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                <HugeIcon icon={MinusSignIcon} size={20} color="#4F46E5" />
              </TouchableOpacity>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#4F46E5' }}>{quantity}</Text>
              <TouchableOpacity onPress={() => dispatch(addToCart({ id: product.id, name: product.name, price: productPrice, originalPrice: productOriginalPrice, quantity: 1, imageUrl: product.images?.[0] || product.imageUrl, vendor: product.vendor, selectedVariants: Object.keys(selectedAttributes).length > 0 ? selectedAttributes : undefined }))} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                <HugeIcon icon={Add01Icon} size={20} color="#4F46E5" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={{ flex: 1, height: 56, borderRadius: 16, backgroundColor: '#6366F1', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 }}
              onPress={() => navigation.navigate('Checkout')}
            >
              <View>
                <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '500', opacity: 0.8, marginBottom: 2 }}>Checkout Price</Text>
                <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '800' }}>₹{productPrice * quantity}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700' }}>Checkout</Text>
                <HugeIcon icon={ChevronDownIcon} size={20} color="#FFF" style={{ transform: [{ rotate: '-90deg' }] }} />
              </View>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ── REVIEW CAPTURE MODAL ── */}
      <Modal visible={isReviewModalVisible} animationType="slide" transparent={true} onRequestClose={() => setIsReviewModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Math.max(insets.bottom, 24) }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#1C1C1C' }}>Write a Review</Text>
              <TouchableOpacity onPress={() => setIsReviewModalVisible(false)} style={{ padding: 4 }}>
                <HugeIcon icon={Cancel01Icon} size={24} color="#71717A" />
              </TouchableOpacity>
            </View>

            {/* Star Rating Interactive */}
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ fontSize: 16, color: '#3F3F46', fontWeight: '600', marginBottom: 12 }}>How would you rate this product?</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setReviewRating(star)} activeOpacity={0.8}>
                    <HugeIcon icon={StarIcon} size={36} color={star <= reviewRating ? "#038d63" : "#E5E7EB"} fill={star <= reviewRating ? "#038d63" : "#E5E7EB"} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Text Input */}
            <TextInput
              style={{ backgroundColor: '#F4F4F5', borderRadius: 12, padding: 16, minHeight: 100, fontSize: 15, color: '#1C1C1C', textAlignVertical: 'top', marginBottom: 16 }}
              placeholder="What did you like or dislike? What did you use this product for?"
              placeholderTextColor="#A1A1AA"
              multiline
              value={reviewText}
              onChangeText={setReviewText}
            />

            {/* Image Picker */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#1C1C1C', marginBottom: 12 }}>Attach Photos (Optional, Max 3)</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {reviewImages.map((uri, idx) => (
                  <View key={idx} style={{ width: 72, height: 72, borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
                    <SafeImage uri={uri} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    <TouchableOpacity 
                      style={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, padding: 4 }}
                      onPress={() => setReviewImages(prev => prev.filter((_, i) => i !== idx))}
                    >
                      <HugeIcon icon={Cancel01Icon} size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
                
                {reviewImages.length < 3 && (
                  <TouchableOpacity onPress={pickReviewImages} style={{ width: 72, height: 72, borderRadius: 12, borderWidth: 1, borderColor: '#D4D4D8', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' }}>
                    <HugeIcon icon={Add01Icon} size={24} color="#71717A" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity 
              style={{ backgroundColor: '#6366F1', paddingVertical: 16, borderRadius: 16, alignItems: 'center', opacity: isSubmittingReview ? 0.7 : 1 }}
              onPress={handleSubmitReview}
              disabled={isSubmittingReview}
            >
              {isSubmittingReview ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Submit Review</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}
