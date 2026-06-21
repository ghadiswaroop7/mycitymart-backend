import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { StyleProp, ViewStyle } from 'react-native';

export interface HugeIconProps {
  icon: any;
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  style?: StyleProp<ViewStyle>;
  fill?: string;
  className?: string;
  opacity?: number;
}

export const HugeIcon = ({ icon, size = 24, color = '#1C1C1C', strokeWidth = 1.5, style, fill, className }: HugeIconProps) => {
  return (
    <HugeiconsIcon
      icon={icon}
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      style={style as any}
      // className is used by NativeWind but TS might complain if not passed properly, we just accept it.
    />
  );
};
