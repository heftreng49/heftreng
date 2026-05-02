import 'package:flutter/material.dart';

// ══ HEFTRENG RENK PALETİ ══
// Kaynak: heftreng-final-fixed.xml CSS :root değişkenleri

class HeftrengColors {
  HeftrengColors._();

  // Ana renk — canlı mor-leylak
  static const Color primary = Color(0xFF8B5CF6);
  static const Color primary2 = Color(0xFFA78BFA);
  static const Color primary3 = Color(0xFF6D28D9);

  // Vurgu — sıcak pembe-koral
  static const Color accent = Color(0xFFF472B6);
  static const Color accent2 = Color(0xFFFB7185);

  // Durum renkleri
  static const Color ok = Color(0xFF10D9A0);
  static const Color error = Color(0xFFF87171);
  static const Color warn = Color(0xFFFBBF24);

  // Arka plan katmanları — karanlık mod
  static const Color bg = Color(0xFF060612);
  static const Color s1 = Color(0xFF0D0D1F);
  static const Color s2 = Color(0xFF12122A);
  static const Color s3 = Color(0xFF181833);
  static const Color s4 = Color(0xFF1E1E40);

  // Metin
  static const Color txt = Color(0xFFF0EEFF);
  static const Color txt2 = Color(0xFFC4B8FF);
  static const Color muted = Color(0xFF7467A0);
  static const Color dim = Color(0xFF2A2850);

  // Kenarlık
  static const Color border = Color(0x268B5CF6);       // rgba(139,92,246,.15)
  static const Color borderHover = Color(0x598B5CF6);  // rgba(139,92,246,.35)
  static const Color borderStrong = Color(0x808B5CF6); // rgba(139,92,246,.5)

  // Glow
  static const Color glow = Color(0x388B5CF6);         // rgba(139,92,246,.22)
  static const Color glow2 = Color(0x26F472B6);        // rgba(244,114,182,.15)
  static const Color glow3 = Color(0x1F10D9A0);        // rgba(16,217,160,.12)

  // Cam efekti
  static const Color glass = Color(0xD10D0D1F);        // rgba(13,13,31,.82)
  static const Color glass2 = Color(0xEB060612);       // rgba(6,6,18,.92)

  // ── Aydınlık mod ──
  static const Color bgLight = Color(0xFFF5F3FF);
  static const Color s1Light = Color(0xFFFFFFFF);
  static const Color s2Light = Color(0xFFEDE9FF);
  static const Color s3Light = Color(0xFFE0D9FF);
  static const Color txtLight = Color(0xFF1A1040);
  static const Color txt2Light = Color(0xFF3D2F80);
  static const Color mutedLight = Color(0xFF8878B8);

  // ── Renk temaları (tema seçici) ──
  static const Map<String, Color> themeColors = {
    'violet': primary,
    'indigo': Color(0xFF6366F1),
    'rose': Color(0xFFF43F5E),
    'emerald': Color(0xFF10B981),
    'amber': Color(0xFFF59E0B),
    'sky': Color(0xFF0EA5E9),
  };
}

// ══ TİPOGRAFİ ══
class HeftrengTextStyles {
  HeftrengTextStyles._();

  // DM Serif Display — başlıklar, logo
  static const String serifFamily = 'DMSerifDisplay';
  // DM Sans — gövde metni
  static const String sansFamily = 'DMSans';
  // JetBrains Mono — kod, tarih, sayaçlar
  static const String monoFamily = 'JetBrainsMono';

  static TextStyle serif({
    double size = 16,
    bool italic = true,
    FontWeight weight = FontWeight.w400,
    Color? color,
  }) =>
      TextStyle(
        fontFamily: serifFamily,
        fontSize: size,
        fontStyle: italic ? FontStyle.italic : FontStyle.normal,
        fontWeight: weight,
        color: color,
        letterSpacing: -0.3,
      );

  static TextStyle sans({
    double size = 14,
    FontWeight weight = FontWeight.w400,
    Color? color,
    double? letterSpacing,
    double lineHeight = 1.7,
  }) =>
      TextStyle(
        fontFamily: sansFamily,
        fontSize: size,
        fontWeight: weight,
        color: color,
        letterSpacing: letterSpacing,
        height: lineHeight,
      );

  static TextStyle mono({
    double size = 12,
    FontWeight weight = FontWeight.w400,
    Color? color,
    double? letterSpacing,
  }) =>
      TextStyle(
        fontFamily: monoFamily,
        fontSize: size,
        fontWeight: weight,
        color: color,
        letterSpacing: letterSpacing,
      );
}

// ══ TEMA ══
class HeftrengTheme {
  HeftrengTheme._();

  static ThemeData dark({Color primary = HeftrengColors.primary}) {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: HeftrengColors.bg,
      colorScheme: ColorScheme.dark(
        primary: primary,
        secondary: HeftrengColors.accent,
        surface: HeftrengColors.s1,
        error: HeftrengColors.error,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: HeftrengColors.txt,
        onError: Colors.white,
      ),
      fontFamily: HeftrengTextStyles.sansFamily,
      appBarTheme: AppBarTheme(
        backgroundColor: HeftrengColors.glass2,
        elevation: 0,
        scrolledUnderElevation: 0,
        foregroundColor: HeftrengColors.txt,
        titleTextStyle: HeftrengTextStyles.serif(
          size: 20,
          color: HeftrengColors.txt,
        ),
        iconTheme: const IconThemeData(
          color: HeftrengColors.muted,
          size: 22,
        ),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: HeftrengColors.glass2,
        selectedItemColor: primary,
        unselectedItemColor: HeftrengColors.muted,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
        selectedLabelStyle: HeftrengTextStyles.mono(size: 10, letterSpacing: 0.3),
        unselectedLabelStyle: HeftrengTextStyles.mono(size: 10),
      ),
      cardTheme: CardTheme(
        color: HeftrengColors.s1,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: HeftrengColors.border, width: 1),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: HeftrengColors.border,
        thickness: 1,
        space: 0,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: HeftrengColors.s1,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: HeftrengColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: HeftrengColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: primary, width: 1.5),
        ),
        hintStyle: HeftrengTextStyles.sans(color: HeftrengColors.muted),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      ),
      textTheme: TextTheme(
        displayLarge: HeftrengTextStyles.serif(size: 46, color: HeftrengColors.txt),
        displayMedium: HeftrengTextStyles.serif(size: 36, color: HeftrengColors.txt),
        displaySmall: HeftrengTextStyles.serif(size: 24, color: HeftrengColors.txt),
        headlineLarge: HeftrengTextStyles.serif(size: 21, color: HeftrengColors.txt),
        headlineMedium: HeftrengTextStyles.serif(size: 19, color: HeftrengColors.txt),
        headlineSmall: HeftrengTextStyles.serif(size: 17, color: HeftrengColors.txt),
        bodyLarge: HeftrengTextStyles.sans(size: 15, color: HeftrengColors.txt),
        bodyMedium: HeftrengTextStyles.sans(size: 13.5, color: HeftrengColors.txt),
        bodySmall: HeftrengTextStyles.sans(size: 12, color: HeftrengColors.muted),
        labelLarge: HeftrengTextStyles.mono(size: 11, color: HeftrengColors.muted, letterSpacing: 0.3),
        labelSmall: HeftrengTextStyles.mono(size: 10, color: HeftrengColors.muted, letterSpacing: 0.5),
      ),
      pageTransitionsTheme: const PageTransitionsTheme(
        builders: {
          TargetPlatform.android: CupertinoPageTransitionsBuilder(),
          TargetPlatform.iOS: CupertinoPageTransitionsBuilder(),
        },
      ),
    );
  }

  static ThemeData light({Color primary = HeftrengColors.primary}) {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: HeftrengColors.bgLight,
      colorScheme: ColorScheme.light(
        primary: primary,
        secondary: HeftrengColors.accent,
        surface: HeftrengColors.s1Light,
        error: HeftrengColors.error,
      ),
      fontFamily: HeftrengTextStyles.sansFamily,
    );
  }
}
