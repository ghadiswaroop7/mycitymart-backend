import React from 'react';
import { View, Dimensions } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const DEFAULT_HEIGHT = Math.round(SCREEN_WIDTH * 1.15);

interface YoutubeVideoPlayerProps {
  videoId: string;
  shouldPlay?: boolean;
  width?: number;
  height?: number;
}

const YoutubeVideoPlayer = ({
  videoId,
  shouldPlay = false,
  width = SCREEN_WIDTH,
  height = DEFAULT_HEIGHT,
}: YoutubeVideoPlayerProps) => {
  try {
    return (
      <View
        style={{
          width,
          height,
          backgroundColor: '#000000',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=${shouldPlay ? 1 : 0}&rel=0&playsinline=1`}
          style={{ width: '100%', height: '100%', border: 'none' }}
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      </View>
    );
  } catch (error) {
    console.error('Web YouTube Player Error:', error);
    return <View style={{ width, height, backgroundColor: '#000000' }} />;
  }
};

export default YoutubeVideoPlayer;
