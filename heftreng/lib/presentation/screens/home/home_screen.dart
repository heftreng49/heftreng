import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:provider/provider.dart';
import '../../../providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../widgets/common/common_widgets.dart';
import '../../widgets/post/post_card.dart';
import '../post_detail/post_detail_screen.dart';

// ══ ANA SAYFA ══
// Blog yazı akışı — temadaki .blog-wrap + .pc kartları

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _scrollCtrl = ScrollController();
  String? _activeLabel;
  bool _isNavVisible = true;
  double _lastOffset = 0;

  // ── Kategoriler (label'lar Blogger'dan çekilir; örnek liste) ──
  final _labels = <String>['Şiir', 'Edebiyat', 'Kültür', 'Toplum', 'Müzik'];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PostProvider>().fetchPosts();
    });
    _scrollCtrl.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollCtrl.dispose();
    super.dispose();
  }

  void _onScroll() {
    // Scroll yönüne göre nav bar'ı gizle/göster
    final offset = _scrollCtrl.offset;
    if ((offset - _lastOffset).abs() < 4) return;

    final goingDown = offset > _lastOffset;
    if (goingDown && _isNavVisible) {
      setState(() => _isNavVisible = false);
    } else if (!goingDown && !_isNavVisible) {
      setState(() => _isNavVisible = true);
    }
    _lastOffset = offset;

    // Sayfa sonu → daha fazla yükle
    if (offset >= _scrollCtrl.position.maxScrollExtent - 200) {
      context.read<PostProvider>().loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<PostProvider>(
      builder: (_, provider, __) {
        return RefreshIndicator(
          color: Theme.of(context).colorScheme.primary,
          backgroundColor: HeftrengColors.s1,
          onRefresh: () => provider.fetchPosts(
            label: _activeLabel,
            refresh: true,
          ),
          child: CustomScrollView(
            controller: _scrollCtrl,
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              // ── Üst bar (SliverAppBar) ──
              _buildAppBar(),

              // ── Kategori chips ──
              SliverPersistentHeader(
                pinned: true,
                delegate: _LabelBarDelegate(
                  labels: _labels,
                  activeLabel: _activeLabel,
                  onSelect: (label) {
                    setState(() => _activeLabel = label);
                    provider.fetchPosts(label: label, refresh: true);
                  },
                ),
              ),

              // ── İçerik ──
              if (provider.isLoading)
                const SliverToBoxAdapter(child: _ShimmerList())
              else if (provider.error != null)
                SliverFillRemaining(
                  child: EmptyState(
                    icon: Icons.wifi_off_rounded,
                    title: 'Bağlantı hatası',
                    subtitle: provider.error,
                    action: HeftrengButton(
                      label: 'Tekrar Dene',
                      onTap: () => provider.fetchPosts(label: _activeLabel, refresh: true),
                    ),
                  ),
                )
              else if (provider.posts.isEmpty)
                const SliverFillRemaining(
                  child: EmptyState(
                    icon: Icons.article_outlined,
                    title: 'Henüz yazı yok',
                  ),
                )
              else ...[
                SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (_, index) {
                      final post = provider.posts[index];
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
                    childCount: provider.posts.length,
                  ),
                ),

                // Load more göstergesi
                SliverToBoxAdapter(
                  child: _buildLoadMore(provider),
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _buildLoadMore(PostProvider provider) {
    if (provider.isLoadingMore) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 24),
        child: Center(
          child: SizedBox(
            width: 20,
            height: 20,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: Theme.of(context).colorScheme.primary,
            ),
          ),
        ),
      );
    }

    if (!provider.hasMore) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 16),
        child: Row(
          children: [
            Expanded(
              child: Container(
                height: 1,
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Colors.transparent, HeftrengColors.border],
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Text(
                '— SON —',
                style: HeftrengTextStyles.mono(
                  size: 11,
                  color: HeftrengColors.muted,
                  letterSpacing: 1,
                ),
              ),
            ),
            Expanded(
              child: Container(
                height: 1,
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [HeftrengColors.border, Colors.transparent],
                  ),
                ),
              ),
            ),
          ],
        ),
      );
    }

    return const SizedBox(height: 80);
  }

  SliverAppBar _buildAppBar() {
    return SliverAppBar(
      floating: true,
      snap: true,
      backgroundColor: HeftrengColors.glass2,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      title: const HeftrengLogo(),
      actions: [
        IconButton(
          icon: const Icon(Icons.search_rounded),
          color: HeftrengColors.muted,
          onPressed: () {}, // Arama sekme değişimi parent'ta handle edilecek
        ),
        IconButton(
          icon: const Icon(Icons.tune_rounded),
          color: HeftrengColors.muted,
          onPressed: _showSortSheet,
        ),
      ],
    );
  }

  void _showSortSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: HeftrengColors.s1,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => _SortSheet(
        onSort: (order) {
          Navigator.pop(context);
          context.read<PostProvider>().fetchPosts(
                label: _activeLabel,
                refresh: true,
              );
        },
      ),
    );
  }
}

// ── Shimmer listesi ──
class _ShimmerList extends StatelessWidget {
  const _ShimmerList();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: List.generate(4, (_) => const ShimmerPost()),
    );
  }
}

// ── Kategori bar ──
class _LabelBarDelegate extends SliverPersistentHeaderDelegate {
  final List<String> labels;
  final String? activeLabel;
  final ValueChanged<String?> onSelect;

  _LabelBarDelegate({
    required this.labels,
    required this.activeLabel,
    required this.onSelect,
  });

  @override
  double get minExtent => 48;
  @override
  double get maxExtent => 48;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    final primary = Theme.of(context).colorScheme.primary;
    return Container(
      color: HeftrengColors.bg,
      height: 48,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        children: [
          // "Tümü" chip
          _Chip(
            label: 'Tümü',
            isActive: activeLabel == null,
            primary: primary,
            onTap: () => onSelect(null),
          ),
          ...labels.map((l) => _Chip(
                label: l,
                isActive: activeLabel == l,
                primary: primary,
                onTap: () => onSelect(activeLabel == l ? null : l),
              )),
        ],
      ),
    );
  }

  @override
  bool shouldRebuild(_LabelBarDelegate old) =>
      old.activeLabel != activeLabel || old.labels != labels;
}

class _Chip extends StatelessWidget {
  final String label;
  final bool isActive;
  final Color primary;
  final VoidCallback onTap;

  const _Chip({
    required this.label,
    required this.isActive,
    required this.primary,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(right: 6),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
        decoration: BoxDecoration(
          color: isActive ? primary : HeftrengColors.s1,
          borderRadius: BorderRadius.circular(99),
          border: Border.all(
            color: isActive ? Colors.transparent : HeftrengColors.border,
          ),
        ),
        child: Text(
          label,
          style: HeftrengTextStyles.sans(
            size: 12,
            weight: FontWeight.w600,
            color: isActive ? Colors.white : HeftrengColors.muted,
          ),
        ),
      ),
    );
  }
}

// ── Sıralama sheet ──
class _SortSheet extends StatelessWidget {
  final ValueChanged<String> onSort;
  const _SortSheet({required this.onSort});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Sırala',
            style: HeftrengTextStyles.serif(size: 18, color: HeftrengColors.txt),
          ),
          const SizedBox(height: 16),
          _sortTile(context, 'En Yeni', Icons.schedule_rounded, 'published'),
          _sortTile(context, 'En Çok Beğenilen', Icons.favorite_border_rounded, 'likes'),
          _sortTile(context, 'Güncellenen', Icons.update_rounded, 'updated'),
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  Widget _sortTile(BuildContext ctx, String label, IconData icon, String val) {
    final primary = Theme.of(ctx).colorScheme.primary;
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(icon, color: primary, size: 20),
      title: Text(
        label,
        style: HeftrengTextStyles.sans(
          size: 14,
          weight: FontWeight.w500,
          color: HeftrengColors.txt,
        ),
      ),
      onTap: () => onSort(val),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    );
  }
}
