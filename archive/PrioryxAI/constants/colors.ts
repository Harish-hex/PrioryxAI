export const Colors = {
  light: {
    // Brand
    brandViolet: '#7C3AED',
    brandCyan: '#06B6D4',
    brandEmerald: '#10B981',
    brandAmber: '#F59E0B',
    brandRed: '#EF4444',
    
    // Backgrounds
    bgPrimary: '#FFFFFF',
    bgSecondary: '#F2F2F7',
    bgTertiary: '#FFFFFF',
    bgGrouped: '#F2F2F7',
    
    // Surfaces
    surface1: '#FFFFFF',
    surface2: '#F2F2F7',
    surface3: '#E5E5EA',
    
    // Labels
    labelPrimary: '#000000',
    labelSecondary: 'rgba(60,60,67,0.6)',
    labelTertiary: 'rgba(60,60,67,0.3)',
    labelDisabled: 'rgba(60,60,67,0.18)',
    
    // Separator
    separator: 'rgba(60,60,67,0.12)',
    
    // Status
    urgentBg: '#FEF2F2',
    urgentText: '#EF4444',
    urgentBorder: '#FECACA',
    highBg: '#FFF7ED',
    highText: '#F97316',
    highBorder: '#FED7AA',
    mediumBg: '#FEFCE8',
    mediumText: '#EAB308',
    mediumBorder: '#FEF08A',
    lowBg: '#F0FDF4',
    lowText: '#22C55E',
    lowBorder: '#BBF7D0',
  },
  dark: {
    brandViolet: '#7C3AED',
    brandCyan: '#06B6D4',
    brandEmerald: '#10B981',
    brandAmber: '#F59E0B',
    brandRed: '#EF4444',
    bgPrimary: '#000000',
    bgSecondary: '#1C1C1E',
    bgTertiary: '#2C2C2E',
    bgGrouped: '#000000',
    surface1: '#1C1C1E',
    surface2: '#2C2C2E',
    surface3: '#3A3A3C',
    labelPrimary: '#FFFFFF',
    labelSecondary: 'rgba(235,235,245,0.6)',
    labelTertiary: 'rgba(235,235,245,0.3)',
    labelDisabled: 'rgba(235,235,245,0.18)',
    separator: 'rgba(84,84,88,0.65)',
    urgentBg: 'rgba(239,68,68,0.15)',
    urgentText: '#FCA5A5',
    urgentBorder: 'rgba(239,68,68,0.3)',
    highBg: 'rgba(249,115,22,0.15)',
    highText: '#FDBA74',
    highBorder: 'rgba(249,115,22,0.3)',
    mediumBg: 'rgba(234,179,8,0.15)',
    mediumText: '#FDE047',
    mediumBorder: 'rgba(234,179,8,0.3)',
    lowBg: 'rgba(34,197,94,0.15)',
    lowText: '#86EFAC',
    lowBorder: 'rgba(34,197,94,0.3)',
  }
} as const;

export const Gradients = {
  brand: ['#7C3AED', '#06B6D4'],
  purple: ['#7C3AED', '#9333EA'],
  success: ['#10B981', '#06B6D4'],
  warm: ['#F59E0B', '#EF4444'],
  dark: ['#0A0A0A', '#1F1F1F'],
} as const;
