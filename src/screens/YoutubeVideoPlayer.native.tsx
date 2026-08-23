import React, { useState, useEffect } from 'react';
import { View, Dimensions } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

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
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setIsPlaying(shouldPlay);
  }, [shouldPlay]);

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
        <YoutubePlayer
          height={height}
          width={width}
          play={isPlaying}
          videoId={videoId}
          onChangeState={(state: string) => {
            if (state === 'playing') {
              setIsPlaying(true);
            } else if (state === 'paused' || state === 'ended') {
              setIsPlaying(false);
            }
          }}
          webViewProps={{
            allowsInlineMediaPlayback: true,
            mediaPlaybackRequiresUserAction: false,
            androidLayerType: 'hardware',
            style: { opacity: 0.99, width: '100%', height: '100%' },
          }}
        />
      </View>
    );
  } catch (error) {
    console.error('Native YouTube Player Error:', error);
    return <View style={{ width, height, backgroundColor: '#000000' }} />;
  }
};

export default YoutubeVideoPlayer;
