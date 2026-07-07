import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

const blurhash = '|rF?hV%2WCj[ayj[a|j[az_NaeWBj@ayfRayfQfQM{M|azj[azf6fQfQfQIpWXofj[ayj[j[fQayWCoeoeaya}j[ayfQa{oLj?j[WVj[ayayj[fQoff7azayj[ayj[j[ayofayayayj[fQj[ayayj[ayfjj[j[ayjuayj[';

const SafeImage = ({ uri, style, resizeMode = 'cover', ...props }: any) => {
  // Support both network strings and local asset numbers (from require())
  const validUri = (uri !== null && uri !== undefined && uri !== '') ? uri : null;
  
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
  
  // Map react-native resizeMode to expo-image contentFit
  const contentFit = resizeMode === 'cover' ? 'cover' : resizeMode === 'contain' ? 'contain' : 'fill';

  return (
    <Image
      source={typeof validUri === 'string' ? { uri: validUri } : validUri}
      style={style}
      contentFit={contentFit}
      placeholder={blurhash}
      transition={200}
      cachePolicy="memory-disk"
      {...props}
    />
  );
};

export default SafeImage;
