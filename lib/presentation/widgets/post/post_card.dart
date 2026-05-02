import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../../data/models/post_model.dart';
import '../../../data/services/firebase_service.dart';
import '../../../providers.dart';
import '../../../core/theme/app_theme.dart';
import '../common/common_widgets.dart';

// ══ POST KARTI ══
// Temadaki .pc, .pc-date, .pc-title, .pc-snip, .pc-bar yapısına karşılık gelir

class PostCard extends StatefulWidget {
  final PostModel post;
  final VoidCallback onTap;

  const PostCard({super.key, required this.post, required this.onTap});

  @override
  State<PostCard> createState() => _PostCardState();
}

class _PostCardState extends State<PostCard> with SingleTickerProviderStateMixin {
  late bool _isLiked;
  late bool _isBookmarked;
  late AnimationController _likeAnim;

  @override
  void initState() {
    super.initState();
    _isLiked = widget.post.isLiked;
    _isBookmarked = widget.post.isBookmarked;
    _likeAnim = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 350),
    );
  }

  @override
  void dispose() {
    _likeAnim.dispose();
    super.dispose();
  }

  void _handleLike() async {
    final auth = context.read<AuthProvider>();
    if (!auth.isLoggedIn) {
      _showLoginSnack();
      return;
    }

    setState(() => _isLiked = !_isLiked);
    _likeAnim.forward(from: 0);

    final social = SocialService();
    await social.toggleLike(
      postId: widget.post.id,
      uid: auth.user!.uid,
      isLiking: _isLiked,
    );

    context.read<PostProvider>().updateLike(widget.post.id, _isLiked);
  }

  void _handleBookmark() async {
    final auth = context.read<AuthProvider>();
    if (!auth.isLoggedIn) {
      _showLoginSnack();
      return;
    }

    setState(() => _isBookmarked = !_isBookmarked);

    final social = SocialService();
    await social.toggleBookmark(
      postId: widget.post.id,
      uid: auth.user!.uid,
      isSaving: _isBookmarked,
      post: widget.post,
    );

    context.read<PostProvider>().updateBookmark(widget.post.id, _isBookmarked);
  }

  void _showLoginSnack() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'Bu özellik için giriş yapmalısın',
          style: HeftrengTextStyles.sans(color: Colors.white, size: 13),
        ),
        backgroundColor: HeftrengColors.s2,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    final post = widget.post;
    final dateStr = DateFormat('d MMMM y', 'tr_TR').format(post.published);

    return InkWell(
      onTap: widget.onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 22),
        decoration: const BoxDecoration(
          border: Border(
            bottom: BorderSide(color: HeftrengColors.border, width: 1),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Tarih — .pc-date ──
            Row(
              children: [
                Container(
                  width: 16,
                  height: 1.5,
                  decoration: BoxDecoration(
                    color: primary,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(width: 7),
                Text(
                  dateStr,
                  style: HeftrengTextStyles.mono(
                    size: 11,
                    color: primary,
                    letterSpacing: 0.3,
                  ).copyWith(fontWeight: FontWeight.w600),
                ),
                if (post.labels.isNotEmpty) ...[
                  const SizedBox(width: 10),
                  _LabelChip(label: post.labels.first),
                ],
              ],
            ),

            const SizedBox(height: 10),

            // ── Başlık — .pc-title ──
            Text(
              post.title,
              style: HeftrengTextStyles.serif(
                size: 19,
                color: HeftrengColors.txt,
              ),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),

            const SizedBox(height: 8),

            // ── Snippet — .pc-snip ──
            Text(
              post.snippet,
              style: HeftrengTextStyles.sans(
                size: 13.5,
                color: HeftrengColors.muted,
                lineHeight: 1.65,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),

            // ── Görsel — .pc-img-row ──
            if (post.featuredImage != null) ...[
              const SizedBox(height: 14),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: AspectRatio(
                  aspectRatio: 52 / 27, // padding-bottom: 52% → yaklaşık 16:8.3
                  child: CachedNetworkImage(
                    imageUrl: post.featuredImage!,
                    fit: BoxFit.cover,
                    placeholder: (_, __) => Container(color: HeftrengColors.s2),
                    errorWidget: (_, __, ___) => Container(color: HeftrengColors.s2),
                  ),
                ),
              ),
            ],

            const SizedBox(height: 14),

            // ── Action Bar — .pc-bar ──
            Container(
              padding: const EdgeInsets.only(top: 10),
              decoration: const BoxDecoration(
                border: Border(
                  top: BorderSide(color: HeftrengColors.border, width: 1),
                ),
              ),
              child: Row(
                children: [
                  // Yazar
                  HeftrengAvatar(
                    photoUrl: post.authorPhoto,
                    initials: post.authorName.isNotEmpty
                        ? post.authorName[0].toUpperCase()
                        : '?',
                    size: 22,
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      post.authorName,
                      style: HeftrengTextStyles.sans(
                        size: 11,
                        color: HeftrengColors.muted,
                        weight: FontWeight.w600,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),

                  // Beğen butonu — .pc-btn + heartPop animasyonu
                  _ActionBtn(
                    icon: _isLiked
                        ? Icons.favorite_rounded
                        : Icons.favorite_border_rounded,
                    color: _isLiked ? HeftrengColors.error : null,
                    label: post.likeCount?.toString(),
                    onTap: _handleLike,
                    animation: _likeAnim,
                    isLiked: _isLiked,
                  ),

                  // Yorum
                  _ActionBtn(
                    icon: Icons.chat_bubble_outline_rounded,
                    label: post.commentCount?.toString(),
                    onTap: widget.onTap,
                  ),

                  // Kaydet — .ptb.saved
                  _ActionBtn(
                    icon: _isBookmarked
                        ? Icons.bookmark_rounded
                        : Icons.bookmark_border_rounded,
                    color: _isBookmarked ? HeftrengColors.warn : null,
                    onTap: _handleBookmark,
                  ),

                  const Spacer(),

                  // Oku butonu — .rd-btn
                  _ReadBtn(onTap: widget.onTap),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Küçük label chip ──
class _LabelChip extends StatelessWidget {
  final String label;
  const _LabelChip({required this.label});

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: primary.withOpacity(0.1),
        borderRadius: BorderRadius.circular(99),
        border: Border.all(color: primary.withOpacity(0.25)),
      ),
      child: Text(
        label,
        style: HeftrengTextStyles.mono(
          size: 10,
          color: primary,
          letterSpacing: 0.3,
        ).copyWith(fontWeight: FontWeight.w600),
      ),
    );
  }
}

// ── Action Button ──
class _ActionBtn extends StatelessWidget {
  final IconData icon;
  final Color? color;
  final String? label;
  final VoidCallback? onTap;
  final AnimationController? animation;
  final bool isLiked;

  const _ActionBtn({
    required this.icon,
    this.color,
    this.label,
    this.onTap,
    this.animation,
    this.isLiked = false,
  });

  @override
  Widget build(BuildContext context) {
    Widget btn = GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 16,
              color: color ?? HeftrengColors.muted,
            ),
            if (label != null) ...[
              const SizedBox(width: 3),
              Text(
                label!,
                style: HeftrengTextStyles.mono(
                  size: 11,
                  color: HeftrengColors.muted,
                ).copyWith(fontWeight: FontWeight.w700),
              ),
            ],
          ],
        ),
      ),
    );

    if (animation != null && isLiked) {
      return ScaleTransition(
        scale: Tween<double>(begin: 1.0, end: 1.0).animate(animation!),
        child: TweenAnimationBuilder<double>(
          tween: Tween(begin: 0, end: 1),
          duration: const Duration(milliseconds: 350),
          builder: (_, value, child) {
            final scale = value < 0.4
                ? 1 + 0.45 * (value / 0.4)
                : value < 0.7
                    ? 1.45 - 0.55 * ((value - 0.4) / 0.3)
                    : 0.9 + 0.1 * ((value - 0.7) / 0.3);
            return Transform.scale(scale: scale, child: child);
          },
          child: btn,
        ),
      );
    }

    return btn;
  }
}

// ── Oku Butonu — .rd-btn ──
class _ReadBtn extends StatelessWidget {
  final VoidCallback onTap;
  const _ReadBtn({required this.onTap});

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(99),
          border: Border.all(color: primary, width: 1.5),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'OKU',
              style: HeftrengTextStyles.mono(
                size: 10,
                color: primary,
                letterSpacing: 0.8,
              ).copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(width: 5),
            Icon(Icons.arrow_forward_rounded, size: 13, color: primary),
          ],
        ),
      ),
    );
  }
}
