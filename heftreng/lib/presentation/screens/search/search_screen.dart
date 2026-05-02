import 'package:flutter/material.dart';
import 'dart:async';
import '../../../data/models/post_model.dart';
import '../../../data/services/blogger_service.dart';
import '../../../core/theme/app_theme.dart';
import '../../widgets/common/common_widgets.dart';
import '../../widgets/post/post_card.dart';
import '../post_detail/post_detail_screen.dart';

// ══ ARAMA EKRANI ══

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _ctrl = TextEditingController();
  final _focus = FocusNode();
  Timer? _debounce;

  List<PostModel> _results = [];
  bool _isSearching = false;
  bool _hasSearched = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _focus.requestFocus());
  }

  @override
  void dispose() {
    _ctrl.dispose();
    _focus.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _onChanged(String q) {
    _debounce?.cancel();
    if (q.trim().isEmpty) {
      setState(() {
        _results = [];
        _hasSearched = false;
      });
      return;
    }
    _debounce = Timer(const Duration(milliseconds: 450), () => _search(q));
  }

  Future<void> _search(String q) async {
    setState(() {
      _isSearching = true;
      _hasSearched = true;
    });
    try {
      final res = await BloggerService.instance.searchPosts(q.trim());
      setState(() => _results = res);
    } catch (_) {
      setState(() => _results = []);
    } finally {
      setState(() => _isSearching = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;

    return Column(
      children: [
        // ── Arama Çubuğu ──
        Container(
          padding: EdgeInsets.fromLTRB(
            12,
            MediaQuery.of(context).padding.top + 8,
            12,
            8,
          ),
          decoration: const BoxDecoration(
            color: HeftrengColors.glass2,
            border: Border(
              bottom: BorderSide(color: HeftrengColors.border),
            ),
          ),
          child: Row(
            children: [
              Icon(Icons.search_rounded, size: 20, color: primary),
              const SizedBox(width: 10),
              Expanded(
                child: TextField(
                  controller: _ctrl,
                  focusNode: _focus,
                  onChanged: _onChanged,
                  style: HeftrengTextStyles.sans(
                    size: 16,
                    color: HeftrengColors.txt,
                  ),
                  decoration: InputDecoration(
                    hintText: 'Yazı, yazar, konu ara…',
                    hintStyle: HeftrengTextStyles.sans(
                      size: 16,
                      color: HeftrengColors.muted,
                    ),
                    border: InputBorder.none,
                    isDense: true,
                    isCollapsed: true,
                  ),
                ),
              ),
              if (_ctrl.text.isNotEmpty)
                GestureDetector(
                  onTap: () {
                    _ctrl.clear();
                    setState(() {
                      _results = [];
                      _hasSearched = false;
                    });
                  },
                  child: Container(
                    width: 30,
                    height: 30,
                    decoration: BoxDecoration(
                      color: HeftrengColors.s2,
                      borderRadius: BorderRadius.circular(9),
                      border: Border.all(color: HeftrengColors.border),
                    ),
                    child: const Icon(
                      Icons.close_rounded,
                      size: 16,
                      color: HeftrengColors.muted,
                    ),
                  ),
                ),
            ],
          ),
        ),

        // ── Sonuçlar ──
        Expanded(
          child: _isSearching
              ? Center(
                  child: CircularProgressIndicator(
                    color: primary,
                    strokeWidth: 2,
                  ),
                )
              : !_hasSearched
                  ? _buildPlaceholder()
                  : _results.isEmpty
                      ? EmptyState(
                          icon: Icons.search_off_rounded,
                          title: '"${_ctrl.text}" için sonuç yok',
                          subtitle: 'Farklı anahtar kelimeler dene',
                        )
                      : ListView.builder(
                          itemCount: _results.length,
                          itemBuilder: (_, i) => PostCard(
                            post: _results[i],
                            onTap: () => Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (_) =>
                                    PostDetailScreen(post: _results[i]),
                              ),
                            ),
                          ),
                        ),
        ),
      ],
    );
  }

  Widget _buildPlaceholder() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.search_rounded,
            size: 40,
            color: HeftrengColors.muted.withOpacity(0.2),
          ),
          const SizedBox(height: 12),
          Text(
            'Ne arıyorsun?',
            style: HeftrengTextStyles.serif(
              size: 18,
              color: HeftrengColors.muted,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Şiir, hikaye, yazar adı yazabilirsin',
            style: HeftrengTextStyles.sans(
              size: 13,
              color: HeftrengColors.muted,
            ),
          ),
        ],
      ),
    );
  }
}
