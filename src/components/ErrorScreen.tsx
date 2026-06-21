import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

const ErrorScreen = ({ message, onRetry }: { message?: string; onRetry: () => void }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
    <Text style={{ fontSize: 48 }}>😕</Text>
    <Text style={{ fontSize: 18, fontWeight: '600', marginTop: 16 }}>
      Something went wrong
    </Text>
    <Text style={{ color: '#757575', textAlign: 'center', marginTop: 8 }}>
      {message || 'Please check your connection'}
    </Text>
    <TouchableOpacity
      style={{
        marginTop: 24, backgroundColor: '#008B45',
        paddingHorizontal: 32, paddingVertical: 12,
        borderRadius: 10
      }}
      onPress={onRetry}
    >
      <Text style={{ color: '#fff', fontWeight: '600' }}>
        Try Again
      </Text>
    </TouchableOpacity>
  </View>
);

export default ErrorScreen;
