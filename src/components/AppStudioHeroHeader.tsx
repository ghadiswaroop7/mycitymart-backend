import React from 'react';
import HeaderBannerCarousel, { HeroSlide } from './HeaderBannerCarousel';
import { useHomepageData } from '../hooks/useHomepageData';

interface Props {
  activeTab?: string;
  fallbackSlides?: HeroSlide[];
}

export const AppStudioHeroHeader: React.FC<Props> = ({ activeTab = 'all', fallbackSlides = [] }) => {
  const { data: layoutData } = useHomepageData(activeTab);
  const slides = layoutData?.heroSlides || (layoutData as any)?.slides || fallbackSlides;

  if (!slides || slides.length === 0) return null;

  return <HeaderBannerCarousel slides={slides} />;
};

export default AppStudioHeroHeader;
