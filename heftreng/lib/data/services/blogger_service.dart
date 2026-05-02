import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/post_model.dart';
import '../../core/constants/app_constants.dart';

// ══ BLOGGER API SERVİSİ ══

class BloggerService {
  BloggerService._();
  static final BloggerService instance = BloggerService._();

  final _client = http.Client();
  String? _nextPageToken;
  bool _hasMore = true;

  bool get hasMore => _hasMore;

  // ── Post listesi çek ──
  Future<List<PostModel>> fetchPosts({
    String? pageToken,
    int maxResults = AppConstants.postsPerPage,
    String? label,
    String? orderBy, // published | updated
  }) async {
    final params = <String, String>{
      'key': AppConstants.bloggerApiKey,
      'maxResults': maxResults.toString(),
      'fetchImages': 'true',
      'fetchBodies': 'true',
      'status': 'live',
    };

    if (pageToken != null) params['pageToken'] = pageToken;
    if (label != null) params['labels'] = label;
    if (orderBy != null) params['orderBy'] = orderBy;

    final uri = Uri.parse(AppConstants.bloggerBaseUrl).replace(queryParameters: params);

    try {
      final response = await _client.get(uri).timeout(const Duration(seconds: 15));
      if (response.statusCode != 200) throw Exception('API hatası: ${response.statusCode}');

      final data = json.decode(response.body) as Map<String, dynamic>;
      _nextPageToken = data['nextPageToken'] as String?;
      _hasMore = _nextPageToken != null;

      final items = data['items'] as List<dynamic>? ?? [];
      return items
          .map((e) => PostModel.fromBloggerApi(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      throw Exception('Yazılar yüklenemedi: $e');
    }
  }

  // ── Daha fazla post yükle ──
  Future<List<PostModel>> fetchMorePosts({String? label}) async {
    if (!_hasMore || _nextPageToken == null) return [];
    return fetchPosts(pageToken: _nextPageToken, label: label);
  }

  // ── Tek post çek ──
  Future<PostModel> fetchPost(String postId) async {
    final uri = Uri.parse(
      '${AppConstants.bloggerBaseUrl}/$postId',
    ).replace(queryParameters: {
      'key': AppConstants.bloggerApiKey,
      'fetchImages': 'true',
      'fetchBodies': 'true',
    });

    final response = await _client.get(uri).timeout(const Duration(seconds: 15));
    if (response.statusCode != 200) throw Exception('Post bulunamadı');

    final data = json.decode(response.body) as Map<String, dynamic>;
    return PostModel.fromBloggerApi(data);
  }

  // ── Arama ──
  Future<List<PostModel>> searchPosts(String query) async {
    final uri = Uri.parse(AppConstants.bloggerBaseUrl).replace(queryParameters: {
      'key': AppConstants.bloggerApiKey,
      'q': query,
      'maxResults': '20',
      'fetchImages': 'true',
      'fetchBodies': 'false',
    });

    final response = await _client.get(uri).timeout(const Duration(seconds: 15));
    if (response.statusCode != 200) return [];

    final data = json.decode(response.body) as Map<String, dynamic>;
    final items = data['items'] as List<dynamic>? ?? [];
    return items
        .map((e) => PostModel.fromBloggerApi(e as Map<String, dynamic>))
        .toList();
  }

  // ── Arama sayfa token'ını sıfırla ──
  void reset() {
    _nextPageToken = null;
    _hasMore = true;
  }

  String? get nextPageToken => _nextPageToken;
}
