import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../data/models/user_model.dart';
import '../../../data/services/firebase_service.dart';
import '../../../providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../widgets/common/common_widgets.dart';

// ══ BİLDİRİMLER EKRANI ══

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final primary = Theme.of(context).colorScheme.primary;

    if (!auth.isLoggedIn) {
      return const EmptyState(
        icon: Icons.notifications_none_rounded,
        title: 'Bildirimleri görmek için giriş yap',
      );
    }

    final social = SocialService();

    return Column(
      children: [
        // Header
        Container(
          height: 56,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: const BoxDecoration(
            color: HeftrengColors.glass2,
            border: Border(
              bottom: BorderSide(color: HeftrengColors.border),
            ),
          ),
          child: Row(
            children: [
              Text(
                'Bildirimler',
                style: HeftrengTextStyles.serif(
                  size: 18,
                  color: HeftrengColors.txt,
                ),
              ),
              const Spacer(),
              GestureDetector(
                onTap: () {}, // Tümünü okundu işaretle
                child: Text(
                  'Tümünü Oku',
                  style: HeftrengTextStyles.sans(
                    size: 12,
                    color: primary,
                    weight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),

        // Liste
        Expanded(
          child: StreamBuilder<List<NotificationModel>>(
            stream: social.watchNotifications(auth.user!.uid),
            builder: (_, snap) {
              if (snap.connectionState == ConnectionState.waiting) {
                return Center(
                  child: CircularProgressIndicator(
                    color: primary,
                    strokeWidth: 2,
                  ),
                );
              }

              final notifs = snap.data ?? [];
              if (notifs.isEmpty) {
                return const EmptyState(
                  icon: Icons.notifications_none_rounded,
                  title: 'Henüz bildirim yok',
                  subtitle: 'Yeni bildirimler burada görünecek',
                );
              }

              return ListView.builder(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 8,
                ),
                itemCount: notifs.length,
                itemBuilder: (_, i) => _NotifItem(
                  notif: notifs[i],
                  onTap: () => social.markNotificationRead(
                    auth.user!.uid,
                    notifs[i].id,
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class _NotifItem extends StatelessWidget {
  final NotificationModel notif;
  final VoidCallback onTap;

  const _NotifItem({required this.notif, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;

    // İkon ve renk — temadaki .nitem-ico.like / .cmt / .follow / .bm / .sys
    final (icon, color) = switch (notif.type) {
      'like' => (Icons.favorite_rounded, HeftrengColors.error),
      'comment' => (Icons.chat_bubble_rounded, primary),
      'follow' => (Icons.person_add_rounded, HeftrengColors.ok),
      'bookmark' => (Icons.bookmark_rounded, HeftrengColors.warn),
      _ => (Icons.info_outline_rounded, HeftrengColors.muted),
    };

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(bottom: 6),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: notif.isRead
              ? HeftrengColors.s1
              : primary.withOpacity(0.07),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: notif.isRead
                ? HeftrengColors.border
                : primary.withOpacity(0.18),
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // İkon kutusu
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: color.withOpacity(0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, size: 16, color: color),
            ),
            const SizedBox(width: 10),

            // Metin
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    notif.title,
                    style: HeftrengTextStyles.sans(
                      size: 12,
                      weight: FontWeight.w600,
                      color: HeftrengColors.txt,
                    ),
                  ),
                  if (notif.subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      notif.subtitle!,
                      style: HeftrengTextStyles.sans(
                        size: 11,
                        color: HeftrengColors.muted,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  const SizedBox(height: 3),
                  Text(
                    _timeAgo(notif.createdAt),
                    style: HeftrengTextStyles.mono(
                      size: 10,
                      color: HeftrengColors.muted,
                    ),
                  ),
                ],
              ),
            ),

            // Okunmamış nokta
            if (!notif.isRead)
              Container(
                width: 8,
                height: 8,
                margin: const EdgeInsets.only(top: 4),
                decoration: BoxDecoration(
                  color: primary,
                  shape: BoxShape.circle,
                ),
              ),
          ],
        ),
      ),
    );
  }

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'şimdi';
    if (diff.inMinutes < 60) return '${diff.inMinutes} dakika önce';
    if (diff.inHours < 24) return '${diff.inHours} saat önce';
    if (diff.inDays < 7) return '${diff.inDays} gün önce';
    return '${(diff.inDays / 7).floor()} hafta önce';
  }
}
