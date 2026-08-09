import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { HugeIcon } from '../components/HugeIcon';
import { ArrowLeft01Icon, CallIcon, Mail01Icon, ArrowDown01Icon, ArrowUp01Icon } from '@hugeicons/core-free-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQS = [
  { question: 'Where is my order?', answer: 'You can track your order status in real-time from the "My Orders" or "Live Delivery" section on the Profile page.' },
  { question: 'How to cancel an order?', answer: 'Orders can only be cancelled before they are confirmed by the seller. Go to My Orders, select the order, and tap Cancel.' },
  { question: 'Refund policy', answer: 'Refunds for cancelled orders are processed immediately to your BazarPeth wallet, or within 3-5 days to your original payment method.' },
  { question: 'Payment issues', answer: 'If money was deducted but the order failed, it will be automatically refunded within 24 hours. Contact support for immediate help.' },
];

export default function HelpSupportScreen() {
  const navigation = useNavigation();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F8F9FA]" edges={['top']}>
      {/* Header */}
      <View className="px-5 py-4 flex-row items-center bg-white border-b border-zinc-100">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
          <HugeIcon icon={ArrowLeft01Icon} size={28} color="#1C1C1C" />
        </TouchableOpacity>
        <Text className="text-xl font-black text-[#1C1C1C]">Help & Support</Text>
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        <Text className="text-[#1C1C1C] text-2xl font-black mb-2">How can we help you?</Text>
        <Text className="text-zinc-500 mb-6">Our support team is always here to help you out.</Text>

        <View className="bg-white p-4 rounded-xl shadow-sm border border-zinc-100 mb-4">
          <View className="flex-row items-center mb-3">
            <View className="w-10 h-10 bg-green-50 rounded-full items-center justify-center mr-3">
              <HugeIcon icon={CallIcon} size={20} color="#008B45" />
            </View>
            <View>
              <Text className="font-bold text-[#1C1C1C]">Call Us</Text>
              <Text className="text-zinc-500 text-xs">+91 98765 43210</Text>
            </View>
          </View>
          <View className="h-[1px] bg-zinc-100 mb-3" />
          <View className="flex-row items-center">
            <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center mr-3">
              <HugeIcon icon={Mail01Icon} size={20} color="#2196F3" />
            </View>
            <View>
              <Text className="font-bold text-[#1C1C1C]">Email Us</Text>
              <Text className="text-zinc-500 text-xs">support@bazarpeth.com</Text>
            </View>
          </View>
        </View>

        <Text className="text-[#1C1C1C] text-lg font-bold mb-3 mt-4">FAQs</Text>
        
        {FAQS.map((item, index) => {
          const isExpanded = expandedIndex === index;
          return (
            <TouchableOpacity 
              key={index} 
              activeOpacity={0.7}
              onPress={() => toggleExpand(index)}
              className="bg-white p-4 rounded-xl shadow-sm border border-zinc-100 mb-3"
            >
              <View className="flex-row justify-between items-center">
                <Text className="font-bold text-[#1C1C1C] flex-1 mr-2">{item.question}</Text>
                <HugeIcon icon={isExpanded ? ArrowUp01Icon : ArrowDown01Icon} size={20} color="#9CA3AF" />
              </View>
              {isExpanded && (
                <View className="mt-3 pt-3 border-t border-zinc-100">
                  <Text className="text-zinc-600 text-sm leading-5">{item.answer}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

      </ScrollView>
    </SafeAreaView>
  );
}

