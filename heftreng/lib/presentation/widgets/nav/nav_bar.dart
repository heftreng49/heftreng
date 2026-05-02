import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';

// ══ ALT NAVİGASYON ÇUBUĞU ══
// Temadaki .tabnav → .tb yapısının Flutter karşılığı
// Sekmeler: Ana Sayfa, Arama, Mesajlar, Bildirimler, Profil

class HeftrengNavBar extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;
  final int unreadNotifications;
  final int unreadMessages;

  const HeftrengNavBar({
    super.key,
    required this.currentIndex,
    required this.onTap,
    this.unreadNotifications = 0,
    this.unreadMessages = 0,
  });

  static const _items = [
    _NavItem(icon: Icons.home_rounded, label: 'Ana Sayfa'),
    _NavItem(icon: Icons.search_rounded, label: 'Ara'),
    _NavItem(icon: Icons.mail_outline_rounded, label: 'Mesajlar'),
    _NavItem(icon: Icons.notifications_none_rounded, label: 'Bildirimler'),
    _NavItem(icon: Icons.person_outline_rounded, label: 'Profil'),
  ];

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;

    return Container(
      height: 60 + MediaQuery.of(context).padding.bottom,
      decoration: const BoxDecoration(
        color: HeftrengColors.glass2,
        border: Border(
          top: BorderSide(color: HeftrengColors.border, width: 1),
        ),
      ),
      child: Row(
        children: List.generate(_items.length, (index) {
          final item = _items[index];
          final isActive = index == currentIndex;
          int badge = 0;
          if (index == 2) badge = unreadMessages;
          if (index == 3) badge = unreadNotifications;

          return Expanded(
            child: GestureDetector(
              onTap: () => onTap(index),
              behavior: HitTestBehavior.opaque,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 220),
                curve: Curves.easeInOut,
                margin: const EdgeInsets.symmetric(horizontal: 2, vertical: 6),
                decoration: isActive
                    ? BoxDecoration(
                        borderRadius: BorderRadius.circular(14),
                        gradient: LinearGradient(
                          colors: [
                            primary.withOpacity(0.18),
                            primary.withOpacity(0.1),
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        border: Border.all(
                          color: primary.withOpacity(0.2),
                          width: 1,
                        ),
                      )
                    : null,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Stack(
                      clipBehavior: Clip.none,
                      children: [
                        AnimatedScale(
                          scale: isActive ? 1.1 : 1.0,
                          duration: const Duration(milliseconds: 220),
                          child: Icon(
                            item.icon,
                            size: 24,
                            color: isActive ? primary : HeftrengColors.muted,
                          ),
                        ),
                        if (badge > 0)
                          Positioned(
                            top: -4,
                            right: -6,
                            child: Container(
                              padding: const EdgeInsets.all(2),
                              constraints: const BoxConstraints(
                                minWidth: 16,
                                minHeight: 16,
                              ),
                              decoration: BoxDecoration(
                                color: HeftrengColors.error,
                                borderRadius: BorderRadius.circular(99),
                              ),
                              child: Text(
                                badge > 99 ? '99+' : badge.toString(),
                                style: HeftrengTextStyles.mono(
                                  size: 9,
                                  color: Colors.white,
                                ).copyWith(fontWeight: FontWeight.w700),
                                textAlign: TextAlign.center,
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 3),
                    AnimatedDefaultTextStyle(
                      duration: const Duration(milliseconds: 220),
                      style: HeftrengTextStyles.mono(
                        size: 10,
                        color: isActive ? primary : HeftrengColors.muted,
                        letterSpacing: 0.3,
                      ).copyWith(fontWeight: FontWeight.w600),
                      child: Text(item.label),
                    ),
                  ],
                ),
              ),
            ),
          );
        }),
      ),
    );
  }
}

class _NavItem {
  final IconData icon;
  final String label;
  const _NavItem({required this.icon, required this.label});
}
