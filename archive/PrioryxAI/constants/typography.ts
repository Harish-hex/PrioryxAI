import { StyleSheet } from 'react-native';

export const Typography = StyleSheet.create({
  titleXL: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: -0.5 },
  titleLG: { fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.3 },
  titleMD: { fontSize: 20, lineHeight: 26, fontWeight: '600', letterSpacing: -0.2 },
  titleSM: { fontSize: 17, lineHeight: 22, fontWeight: '600', letterSpacing: 0 },
  bodyLG: { fontSize: 17, lineHeight: 26, fontWeight: '400', letterSpacing: 0 },
  bodyMD: { fontSize: 15, lineHeight: 22, fontWeight: '400', letterSpacing: 0 },
  bodySM: { fontSize: 13, lineHeight: 18, fontWeight: '400', letterSpacing: 0 },
  captionLG: { fontSize: 12, lineHeight: 16, fontWeight: '500', letterSpacing: 0.2 },
  captionSM: { fontSize: 11, lineHeight: 14, fontWeight: '400', letterSpacing: 0.3 },
  overline: { fontSize: 11, lineHeight: 14, fontWeight: '500', letterSpacing: 1.2 },
  mono: { fontSize: 13, lineHeight: 18, letterSpacing: 0 },
});
