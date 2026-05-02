import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'firebase_options.dart';
import 'providers.dart';
import 'app_shell.dart';
import 'core/theme/app_theme.dart';

// ══ HEFTRENG — Giriş Noktası ══

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Türkçe tarih formatı
  await initializeDateFormatting('tr_TR');

  // Firebase başlat
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  // Durum çubuğu şeffaf
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: HeftrengColors.bg,
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );

  // Sadece dikey yön
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AppProvider()..loadPrefs()),
        ChangeNotifierProvider(create: (_) => AuthProvider()..init()),
        ChangeNotifierProvider(create: (_) => PostProvider()),
      ],
      child: const HeftrengApp(),
    ),
  );
}

class HeftrengApp extends StatelessWidget {
  const HeftrengApp({super.key});

  @override
  Widget build(BuildContext context) {
    final appProvider = context.watch<AppProvider>();

    return MaterialApp(
      title: 'Heftreng',
      debugShowCheckedModeBanner: false,

      // Tema
      theme: HeftrengTheme.light(primary: appProvider.accentColor),
      darkTheme: HeftrengTheme.dark(primary: appProvider.accentColor),
      themeMode: appProvider.isDark ? ThemeMode.dark : ThemeMode.light,

      // Ana ekran
      home: const AppShell(),

      // Yazı boyutu kullanıcı tercihine göre
      builder: (context, child) {
        return MediaQuery(
          data: MediaQuery.of(context).copyWith(
            textScaler: TextScaler.linear(appProvider.fontScale),
          ),
          child: child!,
        );
      },
    );
  }
}
