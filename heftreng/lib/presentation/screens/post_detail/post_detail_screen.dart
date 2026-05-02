import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import 'package:share_plus/share_plus.dart';
import 'package:flutter_html/flutter_html.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../data/models/post_model.dart';
import '../../../data/models/user_model.dart';
import '../../../data/services/firebase_service.dart';
import '../../../providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../widgets/common/common_widgets.dart';

// ══ POST DETAY EKRANI ══
// Temadaki .sw, .s-title, .s-meta, .pb, .cmt-wrap yapısı

class PostDetailScreen extends StatefulWidget {
  final PostModel post;

  const PostDetailScreen({super.key, required this.post});

  @override
  State<PostDetailScreen> createState() => _PostDetailScreenState();
}

class _PostDetailScreenState extends State<PostDetailScreen> {
  final _scrollCtrl = ScrollController();
  final _cmtCtrl = TextEditingController();
  final _social = SocialService();

  late bool _isLiked;
  late bool _isBookmarked;
  bool _isSending = false;

  @override
  void initState() {
    super.initState();
    _isLiked = widget.post.isLiked;
    _isBookmarked = widget.post.isBookmarked;
  }

  @override
  void dispose() {
    _scrollCtrl.dispose();
    _cmtCtrl.dispose();
    super.dispose();
  }

  // ── Beğeni ──
  void _toggleLike() async {
    final auth = context.read<AuthProvider>();
    if (!auth.isLoggedIn) return;

    setState(() => _isLiked = !_isLiked);
    HapticFeedback.lightImpact();

    await _social.toggleLike(
      postId: widget.post.id,
      uid: auth.user!.uid,
      isLiking: _isLiked,
    );
  }

  // ── Kaydet ──
  void _toggleBookmark() async {
    final auth = context.read<AuthProvider>();
    if (!auth.isLoggedIn) return;

    setState(() => _isBookmarked = !_isBookmarked);
    HapticFeedback.selectionClick();

    await _social.toggleBookmark(
      postId: widget.post.id,
      uid: auth.user!.uid,
      isSaving: _isBookmarked,
      post: widget.post,
    );
  }

  // ── Paylaş ──
  void _share() {
    Share.share(
      '${widget.post.title}\n\n${widget.post.url}',
      subject: widget.post.title,
    );
  }

  // ── Yorum gönder ──
  Future<void> _sendComment() async {
    final auth = context.read<AuthProvider>();
    if (!auth.isLoggedIn || _cmtCtrl.text.trim().isEmpty) return;

    setState(() => _isSending = true);
    await _social.addComment(
      postId: widget.post.id,
      authorUid: auth.user!.uid,
      authorName: auth.user!.displayName,
      authorPhoto: auth.user!.photoUrl,
      text: _cmtCtrl.text.trim(),
    );
    _cmtCtrl.clear();
    setState(() => _isSending = false);
  }

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    final post = widget.post;
    final auth = context.watch<AuthProvider>();
    final dateStr = DateFormat('d MMMM y', 'tr_TR').format(post.published);

    return Scaffold(
      backgroundColor: HeftrengColors.bg,
      body: SafeArea(
        child: Column(
          children: [
            // ── AppBar ──
            _buildAppBar(context, primary),

            // ── İçerik ──
            Expanded(
              child: CustomScrollView(
                controller: _scrollCtrl,
                slivers: [
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 18,
                        vertical: 36,
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // ── Öne çıkan görsel — .s-fi ──
                          if (post.featuredImage != null) ...[
                            ClipRRect(
                              borderRadius: BorderRadius.circular(16),
                              child: AspectRatio(
                                aspectRatio: 16 / 9,
                                child: CachedNetworkImage(
                                  imageUrl: post.featuredImage!,
                                  fit: BoxFit.cover,
                                ),
                              ),
                            ),
                            const SizedBox(height: 26),
                          ],

                          // ── Başlık — .s-title ──
                          Text(
                            post.title,
                            style: HeftrengTextStyles.serif(
                              size: 36,
                              color: HeftrengColors.txt,
                            ).copyWith(
                              letterSpacing: -0.5,
                              height: 1.15,
                            ),
                          ),

                          const SizedBox(height: 16),

                          // ── Meta — .s-meta ──
                          _buildMeta(post, dateStr, primary),

                          const SizedBox(height: 24),
                          const HeftrengDivider(),
                          const SizedBox(height: 24),

                          // ── İçerik — .pb ──
                          _buildContent(post),

                          const SizedBox(height: 40),

                          // ── Aksiyon butonları — .s-acts ──
                          _buildActions(primary),

                          const SizedBox(height: 40),
                          const HeftrengDivider(),

                          // ── Yorumlar — .cmt-wrap ──
                          _buildCommentSection(auth, primary),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // ── Yorum giriş alanı ──
            if (auth.isLoggedIn) _buildCommentInput(auth, primary),
          ],
        ),
      ),
    );
  }

  // ── AppBar ──
  Widget _buildAppBar(BuildContext context, Color primary) {
    return Container(
      height: 56,
      padding: const EdgeInsets.symmetric(horizontal: 8),
      decoration: const BoxDecoration(
        color: HeftrengColors.glass2,
        border: Border(
          bottom: BorderSide(color: HeftrengColors.border, width: 1),
        ),
      ),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back_rounded),
            color: HeftrengColors.muted,
            onPressed: () => Navigator.pop(context),
          ),
          const Expanded(
            child: HeftrengLogo(fontSize: 18),
          ),
          IconButton(
            icon: Icon(
              _isBookmarked
                  ? Icons.bookmark_rounded
                  : Icons.bookmark_border_rounded,
            ),
            color: _isBookmarked ? HeftrengColors.warn : HeftrengColors.muted,
            onPressed: _toggleBookmark,
          ),
          IconButton(
            icon: const Icon(Icons.share_rounded),
            color: HeftrengColors.muted,
            onPressed: _share,
          ),
        ],
      ),
    );
  }

  // ── Meta bilgileri ──
  Widget _buildMeta(PostModel post, String dateStr, Color primary) {
    return Wrap(
      spacing: 10,
      runSpacing: 8,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        HeftrengAvatar(
          photoUrl: post.authorPhoto,
          initials: post.authorName.isNotEmpty
              ? post.authorName[0].toUpperCase()
              : '?',
          size: 30,
        ),
        Text(
          post.authorName,
          style: HeftrengTextStyles.sans(
            size: 13,
            weight: FontWeight.w600,
            color: HeftrengColors.txt,
          ),
        ),
        Container(
          width: 3,
          height: 3,
          decoration: const BoxDecoration(
            color: HeftrengColors.dim,
            shape: BoxShape.circle,
          ),
        ),
        Text(
          dateStr,
          style: HeftrengTextStyles.sans(
            size: 12,
            color: HeftrengColors.muted,
          ),
        ),
        ...post.labels.map(
          (l) => Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(99),
              border: Border.all(color: primary.withOpacity(0.2)),
            ),
            child: Text(
              l,
              style: HeftrengTextStyles.mono(
                size: 10,
                color: primary,
                letterSpacing: 0.3,
              ).copyWith(fontWeight: FontWeight.w600),
            ),
          ),
        ),
      ],
    );
  }

  // ── HTML İçerik — .pb stilleri ──
  Widget _buildContent(PostModel post) {
    return Html(
      data: post.content,
      style: {
        'body': Style(
          fontSize: FontSize(15),
          lineHeight: LineHeight(1.92),
          fontFamily: HeftrengTextStyles.sansFamily,
          color: HeftrengColors.txt,
          fontWeight: FontWeight.w300,
          margin: Margins.zero,
          padding: HtmlPaddings.zero,
        ),
        'h2': Style(
          fontFamily: HeftrengTextStyles.serifFamily,
          fontStyle: FontStyle.italic,
          fontSize: FontSize(25),
          fontWeight: FontWeight.w400,
          color: HeftrengColors.txt,
          margin: Margins.only(top: 34, bottom: 12),
        ),
        'h3': Style(
          fontFamily: HeftrengTextStyles.serifFamily,
          fontStyle: FontStyle.italic,
          fontSize: FontSize(19),
          fontWeight: FontWeight.w400,
          color: HeftrengColors.txt,
          margin: Margins.only(top: 24, bottom: 9),
        ),
        'p': Style(
          margin: Margins.only(bottom: 20),
          color: HeftrengColors.txt,
        ),
        'a': Style(
          color: HeftrengColors.primary,
          textDecoration: TextDecoration.underline,
          textDecorationColor: HeftrengColors.primary.withOpacity(0.3),
        ),
        'blockquote': Style(
          backgroundColor: HeftrengColors.s1,
          fontStyle: FontStyle.italic,
          fontFamily: HeftrengTextStyles.serifFamily,
          color: HeftrengColors.muted,
          padding: HtmlPaddings.symmetric(horizontal: 16, vertical: 12),
          margin: Margins.symmetric(vertical: 20),
          border: const Border(
            left: BorderSide(color: HeftrengColors.primary, width: 3),
          ),
        ),
        'code': Style(
          fontFamily: HeftrengTextStyles.monoFamily,
          fontSize: FontSize(12),
          backgroundColor: HeftrengColors.s2,
          color: HeftrengColors.txt2,
          padding: HtmlPaddings.symmetric(horizontal: 5, vertical: 1),
        ),
        'pre': Style(
          fontFamily: HeftrengTextStyles.monoFamily,
          fontSize: FontSize(12),
          backgroundColor: HeftrengColors.s2,
          color: HeftrengColors.txt2,
          padding: HtmlPaddings.all(16),
          margin: Margins.symmetric(vertical: 20),
        ),
        'img': Style(
          margin: Margins.symmetric(vertical: 8),
        ),
      },
    );
  }

  // ── Aksiyon butonları ──
  Widget _buildActions(Color primary) {
    return Wrap(
      spacing: 7,
      runSpacing: 7,
      children: [
        // Beğen
        GestureDetector(
          onTap: _toggleLike,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: _isLiked
                  ? HeftrengColors.error.withOpacity(0.1)
                  : HeftrengColors.s1,
              borderRadius: BorderRadius.circular(99),
              border: Border.all(
                color: _isLiked
                    ? HeftrengColors.error.withOpacity(0.3)
                    : HeftrengColors.border,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  _isLiked
                      ? Icons.favorite_rounded
                      : Icons.favorite_border_rounded,
                  size: 16,
                  color: _isLiked ? HeftrengColors.error : HeftrengColors.muted,
                ),
                const SizedBox(width: 5),
                Text(
                  'Beğen',
                  style: HeftrengTextStyles.sans(
                    size: 13,
                    weight: FontWeight.w500,
                    color: _isLiked
                        ? HeftrengColors.error
                        : HeftrengColors.muted,
                  ),
                ),
              ],
            ),
          ),
        ),

        // Kaydet
        GestureDetector(
          onTap: _toggleBookmark,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: _isBookmarked
                  ? HeftrengColors.warn.withOpacity(0.1)
                  : HeftrengColors.s1,
              borderRadius: BorderRadius.circular(99),
              border: Border.all(
                color: _isBookmarked
                    ? HeftrengColors.warn.withOpacity(0.3)
                    : HeftrengColors.border,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  _isBookmarked
                      ? Icons.bookmark_rounded
                      : Icons.bookmark_border_rounded,
                  size: 16,
                  color: _isBookmarked
                      ? HeftrengColors.warn
                      : HeftrengColors.muted,
                ),
                const SizedBox(width: 5),
                Text(
                  'Kaydet',
                  style: HeftrengTextStyles.sans(
                    size: 13,
                    weight: FontWeight.w500,
                    color: _isBookmarked
                        ? HeftrengColors.warn
                        : HeftrengColors.muted,
                  ),
                ),
              ],
            ),
          ),
        ),

        // Paylaş
        GestureDetector(
          onTap: _share,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [primary, HeftrengColors.primary2],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(99),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.share_rounded, size: 16, color: Colors.white),
                const SizedBox(width: 5),
                Text(
                  'Paylaş',
                  style: HeftrengTextStyles.sans(
                    size: 13,
                    weight: FontWeight.w500,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // ── Yorumlar ──
  Widget _buildCommentSection(AuthProvider auth, Color primary) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 40),
        Row(
          children: [
            Text(
              'Yorumlar',
              style: HeftrengTextStyles.serif(
                size: 20,
                color: HeftrengColors.txt,
              ),
            ),
          ],
        ),
        const SizedBox(height: 18),

        // Yorumlar listesi — Firestore stream
        StreamBuilder<List<CommentModel>>(
          stream: _social.watchComments(widget.post.id),
          builder: (_, snap) {
            if (snap.connectionState == ConnectionState.waiting) {
              return const Center(
                child: Padding(
                  padding: EdgeInsets.all(20),
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              );
            }

            final comments = snap.data ?? [];

            if (comments.isEmpty) {
              return const EmptyState(
                icon: Icons.chat_bubble_outline_rounded,
                title: 'Henüz yorum yok',
                subtitle: 'İlk yorumu sen yap!',
              );
            }

            return Column(
              children: comments
                  .map((c) => _CommentBubble(
                        comment: c,
                        currentUid: auth.user?.uid,
                        onDelete: auth.user?.uid == c.authorUid
                            ? () => _social.deleteComment(c.id)
                            : null,
                      ))
                  .toList(),
            );
          },
        ),

        if (!auth.isLoggedIn) ...[
          const SizedBox(height: 16),
          Center(
            child: Text(
              'Yorum yapmak için giriş yapmalısın',
              style: HeftrengTextStyles.sans(
                size: 12,
                color: HeftrengColors.muted,
              ),
            ),
          ),
        ],

        const SizedBox(height: 40),
      ],
    );
  }

  // ── Yorum giriş alanı ──
  Widget _buildCommentInput(AuthProvider auth, Color primary) {
    return Container(
      padding: EdgeInsets.fromLTRB(
        12,
        10,
        12,
        10 + MediaQuery.of(context).padding.bottom,
      ),
      decoration: const BoxDecoration(
        color: HeftrengColors.s1,
        border: Border(
          top: BorderSide(color: HeftrengColors.border, width: 1),
        ),
      ),
      child: Row(
        children: [
          HeftrengAvatar(
            photoUrl: auth.user?.photoUrl,
            initials: auth.user?.initials,
            size: 30,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
              decoration: BoxDecoration(
                color: HeftrengColors.s2,
                borderRadius: BorderRadius.circular(99),
                border: Border.all(color: HeftrengColors.border),
              ),
              child: TextField(
                controller: _cmtCtrl,
                style: HeftrengTextStyles.sans(
                  size: 13,
                  color: HeftrengColors.txt,
                ),
                decoration: InputDecoration(
                  hintText: 'Yorumunu yaz…',
                  hintStyle: HeftrengTextStyles.sans(
                    size: 13,
                    color: HeftrengColors.muted,
                  ),
                  border: InputBorder.none,
                  isCollapsed: true,
                  isDense: true,
                ),
                maxLines: null,
                textCapitalization: TextCapitalization.sentences,
              ),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: _isSending ? null : _sendComment,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [primary, HeftrengColors.primary2],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                shape: BoxShape.circle,
              ),
              child: _isSending
                  ? const Padding(
                      padding: EdgeInsets.all(8),
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2,
                      ),
                    )
                  : const Icon(
                      Icons.send_rounded,
                      color: Colors.white,
                      size: 16,
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Yorum baloncuğu ──
class _CommentBubble extends StatelessWidget {
  final CommentModel comment;
  final String? currentUid;
  final VoidCallback? onDelete;

  const _CommentBubble({
    required this.comment,
    this.currentUid,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final isOwn = comment.authorUid == currentUid;

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment:
            isOwn ? MainAxisAlignment.end : MainAxisAlignment.start,
        children: [
          if (!isOwn) ...[
            HeftrengAvatar(
              photoUrl: comment.authorPhoto,
              initials: comment.authorName.isNotEmpty
                  ? comment.authorName[0].toUpperCase()
                  : '?',
              size: 30,
            ),
            const SizedBox(width: 9),
          ],
          Flexible(
            child: Column(
              crossAxisAlignment:
                  isOwn ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 13,
                    vertical: 9,
                  ),
                  constraints: BoxConstraints(
                    maxWidth: MediaQuery.of(context).size.width * 0.75,
                  ),
                  decoration: BoxDecoration(
                    color: isOwn
                        ? HeftrengColors.primary
                        : HeftrengColors.s1,
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(10),
                      topRight: const Radius.circular(10),
                      bottomLeft: Radius.circular(isOwn ? 10 : 4),
                      bottomRight: Radius.circular(isOwn ? 4 : 10),
                    ),
                    border: isOwn
                        ? null
                        : Border.all(color: HeftrengColors.border),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (!isOwn)
                        Text(
                          comment.authorName,
                          style: HeftrengTextStyles.sans(
                            size: 11,
                            weight: FontWeight.w700,
                            color: HeftrengColors.primary,
                          ),
                        ),
                      Text(
                        comment.text,
                        style: HeftrengTextStyles.sans(
                          size: 13,
                          color: isOwn ? Colors.white : HeftrengColors.txt,
                          lineHeight: 1.55,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 3),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      _timeAgo(comment.createdAt),
                      style: HeftrengTextStyles.mono(
                        size: 10,
                        color: HeftrengColors.muted,
                      ),
                    ),
                    if (onDelete != null) ...[
                      const SizedBox(width: 8),
                      GestureDetector(
                        onTap: onDelete,
                        child: const Icon(
                          Icons.delete_outline_rounded,
                          size: 14,
                          color: HeftrengColors.muted,
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
          if (isOwn) const SizedBox(width: 9),
        ],
      ),
    );
  }

  String _timeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'şimdi';
    if (diff.inMinutes < 60) return '${diff.inMinutes}dk';
    if (diff.inHours < 24) return '${diff.inHours}s';
    return '${diff.inDays}g';
  }
}
