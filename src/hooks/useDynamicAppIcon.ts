import { useEffect, useState } from 'react';
import { listenToGlobalAppIconConfig, changeAppIcon, AllowedAppIcon } from '../services/appIconService';

/**
 * Custom hook that subscribes to Firestore `app_settings/global_config`
 * and dynamically updates the device's home screen icon.
 */
export function useDynamicAppIcon() {
  const [currentIcon, setCurrentIcon] = useState<string>('default_icon');

  useEffect(() => {
    const unsubscribe = listenToGlobalAppIconConfig((newIcon) => {
      setCurrentIcon(newIcon);
    });

    return () => unsubscribe();
  }, []);

  return {
    currentIcon,
    changeAppIcon: (iconName: AllowedAppIcon) => changeAppIcon(iconName),
  };
}

export default useDynamicAppIcon;
