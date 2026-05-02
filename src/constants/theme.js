// ── Heftreng Tema — Web sitesiyle birebir (Karanlık mod varsayılan) ──

export const COLORS = {
  // Ana renkler
  brand:        '#8b5cf6',   // --pr
  brand2:       '#a78bfa',   // --pr2
  brandDark:    '#6d28d9',   // --pr3
  accent:       '#f472b6',   // --ac
  accent2:      '#fb7185',   // --ac2

  // Arka planlar (KARANLIK — web teması ile aynı)
  background:   '#060612',   // --bg
  surface:      '#0d0d1f',   // --s1
  surface2:     '#12122a',   // --s2
  surface3:     '#181833',   // --s3
  surface4:     '#1e1e40',   // --s4

  // Yazılar
  text:         '#f0eeff',   // --txt
  text2:        '#c4b8ff',   // --txt2
  textMuted:    '#7467a0',   // --mut
  textSecondary:'#c4b8ff',   // alias txt2
  textDim:      '#2a2850',   // --dim

  // Kenarlıklar
  border:       'rgba(139,92,246,0.15)',  // --bor
  borderHover:  'rgba(139,92,246,0.35)',  // --borh
  borderStrong: 'rgba(139,92,246,0.50)',  // --bors

  // Glow
  glow:         'rgba(139,92,246,0.22)',  // --glo
  glow2:        'rgba(244,114,182,0.15)', // --glo2
  glow3:        'rgba(16,217,160,0.12)',  // --glo3

  // Glass
  glass:        'rgba(13,13,31,0.82)',    // --glass
  glass2:       'rgba(6,6,18,0.92)',      // --glass2

  // Durum renkleri
  success:      '#10d9a0',   // --ok
  error:        '#f87171',   // --err
  warning:      '#fbbf24',   // --warn
  like:         '#f472b6',   // beğeni kalp = accent
};

export const SPACING = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32,
};

export const RADIUS = {
  sm: 6, md: 10, lg: 14, xl: 20, xxl: 28, full: 999,
};

export const FONT = {
  regular:  '400',
  medium:   '500',
  semibold: '600',
  bold:     '700',
};

export const shadow = (color = 'rgba(139,92,246,0.22)', elevation = 2) => ({
  shadowColor: color,
  shadowOpacity: 1,
  shadowOffset: { width: 0, height: elevation * 2 },
  shadowRadius: elevation * 4,
  elevation,
});
