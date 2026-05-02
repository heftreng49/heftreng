import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers.dart';
import 'core/theme/app_theme.dart';
import 'presentation/screens/home/home_screen.dart';
import 'presentation/screens/search/search_screen.dart';
import 'presentation/screens/messages/messages_screen.dart';
import 'presentation/screens/notifications/notifications_screen.dart';
import 'presentation/screens/profile/profile_screen.dart';
import 'presentation/widgets/nav/nav_bar.dart';

// ══ ANA SHELL — Sekme yönetimi ══

class AppShell extends StatefulWidget {
  const AppShell({super.key});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _currentIndex = 0;

  static final _screens = [
    const HomeScreen(),
    const SearchScreen(),
    const MessagesScreen(),
    const NotificationsScreen(),
    const ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: HeftrengColors.bg,
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: HeftrengNavBar(
        currentIndex: _currentIndex,
        onTap: (i) => setState(() => _currentIndex = i),
      ),
    );
  }
}
