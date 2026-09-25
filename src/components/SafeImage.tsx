import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image, ImageContentFit } from 'expo-image';

interface SafeImageProps {
  uri?: string | number | null | { uri: string };
  style?: any;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center' | 'fill';
  fallbackEmoji?: string;
  fallbackText?: string;
  alt?: string;
  className?: string;
  [key: string]: any;
}

// Light neutral blurhash (soft greyish shimmer)
const NEUTRAL_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

export const SafeImage: React.FC<SafeImageProps> = ({
  uri,
  style,
  resizeMode = 'cover',
  fallbackEmoji = '🛍️',
  fallbackText,
  className,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);

  // Extract raw string or asset number
  let rawSource: any = null;
  if (uri !== null && uri !== undefined && uri !== '') {
    if (typeof uri === 'object' && 'uri' in uri) {
      rawSource = uri.uri;
    } else {
      rawSource = uri;
    }
  }

  // Sanitize remote string URLs
  let cleanUri: string | null = null;
  if (typeof rawSource === 'string') {
    const trimmed = rawSource.trim();
    if (trimmed.length > 0) {
      // Upgrade cleartext HTTP to HTTPS to avoid Android cleartext blocking
      cleanUri = trimmed.startsWith('http://') ? trimmed.replace('http://', 'https://') : trimmed;
    }
  }

  // Reset error state when uri changes
  useEffect(() => {
    setHasError(false);
  }, [cleanUri, rawSource]);

  // Determine source object for expo-image
  const finalSource = cleanUri
    ? { uri: cleanUri, headers: { Accept: 'image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8' } }
    : typeof rawSource === 'number'
    ? rawSource
    : null;

  // Map react-native resizeMode to expo-image contentFit
  const contentFit: ImageContentFit =
    resizeMode === 'cover' ? 'cover' : resizeMode === 'contain' ? 'contain' : resizeMode === 'fill' ? 'fill' : 'cover';

  // Merge default width & height so image never collapses to 0x0 on Android Yoga layout
  const imageStyle = [
    { width: '100%', height: '100%' },
    style,
  ];

  if (!finalSource || hasError) {
    return (
      <View
        style={[
          imageStyle,
          styles.fallbackContainer,
        ]}
      >
        <Text style={styles.fallbackEmoji}>{fallbackEmoji || '🛍️'}</Text>
        {fallbackText ? (
          <Text style={styles.fallbackText} numberOfLines={1}>
            {fallbackText}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <Image
      source={finalSource}
      style={imageStyle}
      contentFit={contentFit}
      placeholder={{ blurhash: NEUTRAL_BLURHASH }}
      transition={150}
      cachePolicy="memory-disk"
      onError={() => {
        setHasError(true);
      }}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  fallbackContainer: {
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  fallbackEmoji: {
    fontSize: 40,
  },
  fallbackText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default SafeImage;
