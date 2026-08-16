import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const Layout = {
  screenWidth: width,
  screenHeight: height,
  
  // Spacing
  xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24,
  xxxl: 32, xxxxl: 40, xxxxxl: 48,
  
  // Border radius
  radiusXS: 6, radiusSM: 10, radiusMD: 14,
  radiusLG: 18, radiusXL: 22, radius2XL: 28, radiusFull: 9999,
  
  // Touch targets
  touchMin: 44,
  touchComfort: 48,
  touchLarge: 56,
  
  // Tab bar
  tabBarHeight: Platform.OS === 'ios' ? 83 : 56,
  
  // Common
  headerHeight: 96,
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  modalShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 32,
    elevation: 8,
  }
} as const;
