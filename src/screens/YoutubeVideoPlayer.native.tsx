import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';

interface YoutubeVideoPlayerProps {
  videoId: string;
  shouldPlay: boolean;
  width: number;
  height: number;
}

const YoutubeVideoPlayer = ({ videoId, shouldPlay, width, height }: YoutubeVideoPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setIsPlaying(shouldPlay);
  }, [shouldPlay]);

  try {
    return (
      <View style={{ width, height, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
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
          }}
        />
      </View>
    );
  } catch (error) {
    console.error("Native YouTube Player Error:", error);
    return <View style={{ width, height, backgroundColor: '#000' }} />;
  }
};

export default YoutubeVideoPlayer;
