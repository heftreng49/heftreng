// ══ POST MODELİ ══

class PostModel {
  final String id;
  final String title;
  final String content;
  final String snippet;
  final String? featuredImage;
  final String url;
  final String authorName;
  final String? authorPhoto;
  final String? authorId;
  final DateTime published;
  final DateTime updated;
  final List<String> labels;
  final int? likeCount;
  final int? commentCount;
  bool isLiked;
  bool isBookmarked;

  PostModel({
    required this.id,
    required this.title,
    required this.content,
    required this.snippet,
    this.featuredImage,
    required this.url,
    required this.authorName,
    this.authorPhoto,
    this.authorId,
    required this.published,
    required this.updated,
    required this.labels,
    this.likeCount,
    this.commentCount,
    this.isLiked = false,
    this.isBookmarked = false,
  });

  factory PostModel.fromBloggerApi(Map<String, dynamic> json) {
    final author = json['author'] as Map<String, dynamic>? ?? {};
    final image = json['images'] as List<dynamic>?;

    // İçerikten ilk görseli çek
    String? featuredImage;
    if (image != null && image.isNotEmpty) {
      featuredImage = image.first['url'] as String?;
    }
    // Alternatif: içerik HTML'inden ilk img src'yi çek
    featuredImage ??= _extractFirstImage(json['content'] as String? ?? '');

    final labels = (json['labels'] as List<dynamic>?)
            ?.map((e) => e.toString())
            .toList() ??
        [];

    return PostModel(
      id: json['id'] as String,
      title: json['title'] as String? ?? '',
      content: json['content'] as String? ?? '',
      snippet: _buildSnippet(json['content'] as String? ?? ''),
      featuredImage: featuredImage,
      url: json['url'] as String? ?? '',
      authorName: author['displayName'] as String? ?? 'Heftreng',
      authorPhoto: (author['image'] as Map<String, dynamic>?)?['url'] as String?,
      authorId: author['id'] as String?,
      published: DateTime.tryParse(json['published'] as String? ?? '') ??
          DateTime.now(),
      updated: DateTime.tryParse(json['updated'] as String? ?? '') ??
          DateTime.now(),
      labels: labels,
    );
  }

  // HTML'den düz metin snippet oluştur (ilk 120 karakter)
  static String _buildSnippet(String html) {
    final clean = html
        .replaceAll(RegExp(r'<[^>]*>'), '')
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();
    if (clean.length <= 120) return clean;
    return '${clean.substring(0, 120)}…';
  }

  // HTML içinden ilk img src'yi çek
  static String? _extractFirstImage(String html) {
    final match = RegExp(r'<img[^>]+src=["\']([^"\']+)["\']').firstMatch(html);
    return match?.group(1);
  }

  // Firestore'a kaydetmek için
  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'snippet': snippet,
        'featuredImage': featuredImage,
        'url': url,
        'authorName': authorName,
        'authorPhoto': authorPhoto,
        'published': published.toIso8601String(),
        'labels': labels,
      };

  PostModel copyWith({
    bool? isLiked,
    bool? isBookmarked,
    int? likeCount,
    int? commentCount,
  }) =>
      PostModel(
        id: id,
        title: title,
        content: content,
        snippet: snippet,
        featuredImage: featuredImage,
        url: url,
        authorName: authorName,
        authorPhoto: authorPhoto,
        authorId: authorId,
        published: published,
        updated: updated,
        labels: labels,
        likeCount: likeCount ?? this.likeCount,
        commentCount: commentCount ?? this.commentCount,
        isLiked: isLiked ?? this.isLiked,
        isBookmarked: isBookmarked ?? this.isBookmarked,
      );
}
