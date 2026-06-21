import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';

const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" color="#008B45" />
    <Text style={{ marginTop: 12, color: '#757575' }}>
      Loading...
    </Text>
  </View>
);

export default LoadingScreen;
