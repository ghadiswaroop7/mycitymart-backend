import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HugeIcon } from '../components/HugeIcon';
import { Tick01Icon, ArrowRightIcon, ShoppingCart01Icon } from '@hugeicons/core-free-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function OrderSuccessScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { orderId } = route.params || { orderId: 'ORD-UNKNOWN' };
  
  const scaleValue = useRef(new Animated.Value(0)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-1 justify-center items-center px-6">
        
        <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
          <View className="w-32 h-32 bg-green-50 rounded-full items-center justify-center mb-6 border-4 border-green-100">
            <HugeIcon icon={Tick01Icon} size={64} color="#16A34A" />
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: opacityValue, alignItems: 'center', width: '100%' }}>
          <Text className="text-2xl font-black text-[#1C1C1C] text-center mb-2">Order Placed Successfully! 🎉</Text>
          <Text className="text-zinc-500 font-medium text-center text-sm mb-6">
            Thank you for shopping with Jhat-Pat. Your order is being processed.
          </Text>

          <View className="bg-zinc-50 border border-zinc-200 px-6 py-3 rounded-xl mb-10 w-full flex-row justify-between items-center">
            <Text className="text-zinc-500 font-bold">Order ID:</Text>
            <Text className="font-black text-[#1C1C1C]">{orderId.substring(0, 8).toUpperCase()}</Text>
          </View>

          <TouchableOpacity 
            onPress={() => navigation.navigate('DeliveryTracking', { orderId })}
            className="bg-[#1C1C1C] w-full py-4 rounded-xl items-center flex-row justify-center mb-3 shadow-md"
          >
            <HugeIcon icon={ShoppingCart01Icon} size={20} color="white" className="mr-2" />
            <Text className="text-white font-black text-base">Track Order</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
            className="bg-red-50 border border-[#008B45] w-full py-4 rounded-xl items-center flex-row justify-center"
          >
            <Text className="text-[#008B45] font-black text-base mr-2">Continue Shopping</Text>
            <HugeIcon icon={ArrowRightIcon} size={20} color="#008B45" />
          </TouchableOpacity>
        </Animated.View>

      </View>
    </SafeAreaView>
  );
}
