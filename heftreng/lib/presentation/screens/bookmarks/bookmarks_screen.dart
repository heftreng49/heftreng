import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../data/services/firebase_service.dart';
import '../../../providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../widgets/common/common_widgets.dart';
import '../../widgets/post/post_card.dart';
import '../post_detail/post_detail_screen.dart';
import '../auth/auth_screen.dart';

// ══ KAYDEDİLENLER EKRANI ══

class BookmarksScreen extends StatelessWidget {
  const BookmarksScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final primary = Theme.of(context).colorScheme.primary;

    if (!auth.isLoggedIn) {
      return Center(
        child: EmptyState(
          icon: Icons.bookmark_border_rounded,
          title: 'Kaydedilen yazılarını gör',
          subtitle: 'Giriş yaparak yazıları kaydetmeye başla',
          action: HeftrengButton(
            label: 'Giriş Yap',
            icon: Icons.login_rounded,
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const AuthScreen()),
            ),
          ),
        ),
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
              const Icon(
                Icons.bookmark_rounded,
                size: 18,
                color: HeftrengColors.warn,
              ),
              const SizedBox(width: 8),
              Text(
                'Kaydedilenler',
                style: HeftrengTextStyles.serif(
                  size: 18,
                  color: HeftrengColors.txt,
                ),
              ),
            ],
          ),
        ),

        // Liste
        Expanded(
          child: StreamBuilder(
            stream: social.watchBookmarks(auth.user!.uid),
            builder: (_, snap) {
              if (snap.connectionState == ConnectionState.waiting) {
                return Center(
                  child: CircularProgressIndicator(
                    color: primary,
                    strokeWidth: 2,
                  ),
                );
              }

              final posts = snap.data ?? [];
              if (posts.isEmpty) {
                return const EmptyState(
                  icon: Icons.bookmark_border_rounded,
                  title: 'Henüz kaydedilen yok',
                  subtitle:
                      'Beğendiğin yazıları kaydet, burada görünsün',
                );
              }

              return ListView.builder(
                itemCount: posts.length,
                itemBuilder: (_, i) {
                  final post = posts[i].copyWith(isBookmarked: true);
                  return PostCard(
                    post: post,
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => PostDetailScreen(post: post),
                      ),
                    ),
                  );
                },
              );
            },
          ),
        ),
      ],
    );
  }
}
