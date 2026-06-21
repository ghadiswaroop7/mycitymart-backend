import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const SafeImage = ({ uri, style, resizeMode = 'cover', ...props }: any) => {
  const validUri = uri && typeof uri === 'string' && uri.trim() !== '' ? uri : null;
  
  if (!validUri) {
    return (
      <View style={[
        style, 
        { 
          backgroundColor: '#F5F5F5', 
          justifyContent: 'center', 
          alignItems: 'center' 
        }
      ]}>
        <Text style={{ fontSize: 30 }}>🛍️</Text>
      </View>
    );
  }
  
  return (
    <Image
      source={{ uri: validUri }}
      style={style}
      resizeMode={resizeMode}
      {...props}
    />
  );
};

export default SafeImage;
