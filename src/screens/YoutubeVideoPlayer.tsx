import React from 'react';
import { View } from 'react-native';

interface YoutubeVideoPlayerProps {
  videoId: string;
  shouldPlay: boolean;
  width: number;
  height: number;
}

const YoutubeVideoPlayer = ({ videoId, shouldPlay, width, height }: YoutubeVideoPlayerProps) => {
  try {
    return (
      <View style={{ width, height, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=${shouldPlay ? 1 : 0}&rel=0`}
          style={{ width: '100%', height: '100%', border: 'none' }}
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      </View>
    );
  } catch (error) {
    console.error("Web YouTube Player Error:", error);
    return <View style={{ width, height, backgroundColor: '#000' }} />;
  }
};

export default YoutubeVideoPlayer;
