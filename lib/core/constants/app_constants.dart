// ══ HEFTRENG SABİTLERİ ══

class AppConstants {
  AppConstants._();

  // ── Blogger API ──
  static const String blogId = 'YOUR_BLOGGER_BLOG_ID';        // Blogger blog ID'si
  static const String bloggerApiKey = 'YOUR_BLOGGER_API_KEY'; // Google Cloud Console'dan
  static const String blogUrl = 'https://www.heftreng.com';   // Blog URL'si

  static const String bloggerBaseUrl =
      'https://www.googleapis.com/blogger/v3/blogs/$blogId/posts';

  // ── Firebase Collections ──
  static const String colComments = 'comments';
  static const String colPresence = 'presence';
  static const String colTyping = 'typing';
  static const String colNotifications = 'notifications';
  static const String colConvMessages = 'convMessages';
  static const String colUsers = 'users';
  static const String colBookmarks = 'bookmarks';
  static const String colLikes = 'likes';
  static const String colFollows = 'follows';

  // ── Pagination ──
  static const int postsPerPage = 10;
  static const int commentsPerPage = 20;
  static const int notificationsPerPage = 30;

  // ── Önbellek ──
  static const Duration cacheExpiry = Duration(minutes: 15);
  static const int maxCacheSize = 50; // post sayısı

  // ── Uygulama Bilgisi ──
  static const String appName = 'Heftreng';
  static const String appTagline = 'Civaka Nivîskar';
  static const String appVersion = '1.0.0';

  // ── Hive Box İsimleri ──
  static const String boxSettings = 'hf_settings';
  static const String boxBookmarks = 'hf_bookmarks';
  static const String boxDrafts = 'hf_drafts';
  static const String boxPostCache = 'hf_post_cache';

  // ── Paylaşım ──
  static const String twitterHandle = '@heftreng';
}

// ── Uygulamada kullanılan rota isimleri ──
class AppRoutes {
  AppRoutes._();

  static const String home = '/';
  static const String postDetail = '/post';
  static const String profile = '/profile';
  static const String messages = '/messages';
  static const String conversation = '/conversation';
  static const String notifications = '/notifications';
  static const String search = '/search';
  static const String bookmarks = '/bookmarks';
  static const String settings = '/settings';
  static const String login = '/login';
  static const String labelPosts = '/label';
}
