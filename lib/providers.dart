import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../data/models/post_model.dart';
import '../data/models/user_model.dart';
import '../data/services/blogger_service.dart';
import '../data/services/firebase_service.dart';
import '../core/theme/app_theme.dart';

// ══ UYGULAMA DURUMU ══

class AppProvider extends ChangeNotifier {
  // ── Tema ──
  bool _isDark = true;
  String _accentKey = 'violet'; // violet, indigo, rose, emerald, amber, sky

  bool get isDark => _isDark;
  String get accentKey => _accentKey;
  Color get accentColor =>
      HeftrengColors.themeColors[_accentKey] ?? HeftrengColors.primary;

  ThemeData get theme =>
      _isDark ? HeftrengTheme.dark(primary: accentColor) : HeftrengTheme.light(primary: accentColor);

  void toggleTheme() {
    _isDark = !_isDark;
    _savePrefs();
    notifyListeners();
  }

  void setAccent(String key) {
    _accentKey = key;
    _savePrefs();
    notifyListeners();
  }

  // ── Font boyutu (temada fdec/finc ile değiştiriliyor) ──
  double _fontScale = 1.0;
  double get fontScale => _fontScale;

  void increaseFontScale() {
    if (_fontScale < 1.4) {
      _fontScale = (_fontScale + 0.1).clamp(0.8, 1.4);
      _savePrefs();
      notifyListeners();
    }
  }

  void decreaseFontScale() {
    if (_fontScale > 0.8) {
      _fontScale = (_fontScale - 0.1).clamp(0.8, 1.4);
      _savePrefs();
      notifyListeners();
    }
  }

  // ── Prefs yükle/kaydet ──
  Future<void> loadPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    _isDark = prefs.getBool('isDark') ?? true;
    _accentKey = prefs.getString('accentKey') ?? 'violet';
    _fontScale = prefs.getDouble('fontScale') ?? 1.0;
    notifyListeners();
  }

  Future<void> _savePrefs() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('isDark', _isDark);
    await prefs.setString('accentKey', _accentKey);
    await prefs.setDouble('fontScale', _fontScale);
  }
}

// ══ POST DURUMU ══

class PostProvider extends ChangeNotifier {
  final _service = BloggerService.instance;

  List<PostModel> _posts = [];
  bool _isLoading = false;
  bool _isLoadingMore = false;
  String? _error;
  String? _activeLabel;

  List<PostModel> get posts => _posts;
  bool get isLoading => _isLoading;
  bool get isLoadingMore => _isLoadingMore;
  String? get error => _error;
  bool get hasMore => _service.hasMore;

  // ── İlk yükleme ──
  Future<void> fetchPosts({String? label, bool refresh = false}) async {
    if (refresh || label != _activeLabel) {
      _service.reset();
      _posts = [];
      _activeLabel = label;
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final result = await _service.fetchPosts(label: label);
      _posts = result;
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // ── Sayfalama ──
  Future<void> loadMore() async {
    if (_isLoadingMore || !hasMore) return;
    _isLoadingMore = true;
    notifyListeners();

    try {
      final more = await _service.fetchMorePosts(label: _activeLabel);
      _posts = [..._posts, ...more];
    } catch (_) {
      // sessizce geç
    } finally {
      _isLoadingMore = false;
      notifyListeners();
    }
  }

  // ── Beğeni güncelle (lokal) ──
  void updateLike(String postId, bool liked) {
    final idx = _posts.indexWhere((p) => p.id == postId);
    if (idx >= 0) {
      _posts[idx] = _posts[idx].copyWith(isLiked: liked);
      notifyListeners();
    }
  }

  // ── Kaydetme güncelle (lokal) ──
  void updateBookmark(String postId, bool saved) {
    final idx = _posts.indexWhere((p) => p.id == postId);
    if (idx >= 0) {
      _posts[idx] = _posts[idx].copyWith(isBookmarked: saved);
      notifyListeners();
    }
  }
}

// ══ AUTH DURUMU ══

class AuthProvider extends ChangeNotifier {
  final _authService = AuthService();
  final _socialService = SocialService();

  UserModel? _user;
  bool _isLoading = false;

  UserModel? get user => _user;
  bool get isLoggedIn => _user != null;
  bool get isLoading => _isLoading;

  void init() {
    _authService.authStateChanges.listen((firebaseUser) async {
      if (firebaseUser == null) {
        _user = null;
      } else {
        _user = await _socialService.getUser(firebaseUser.uid);
        await _authService.initPresence();
      }
      notifyListeners();
    });
  }

  Future<bool> signInWithEmail(String email, String password) async {
    _isLoading = true;
    notifyListeners();
    try {
      _user = await _authService.signInWithEmail(email, password);
      return true;
    } catch (_) {
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> register({
    required String email,
    required String password,
    required String displayName,
  }) async {
    _isLoading = true;
    notifyListeners();
    try {
      _user = await _authService.registerWithEmail(
        email: email,
        password: password,
        displayName: displayName,
      );
      return true;
    } catch (_) {
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> signOut() async {
    await _authService.signOut();
    _user = null;
    notifyListeners();
  }

  Future<void> updateProfile({
    String? displayName,
    String? bio,
    String? photoUrl,
  }) async {
    if (_user == null) return;
    await _socialService.updateProfile(
      uid: _user!.uid,
      displayName: displayName,
      bio: bio,
      photoUrl: photoUrl,
    );
    _user = _user!.copyWith(
      displayName: displayName,
      bio: bio,
      photoUrl: photoUrl,
    );
    notifyListeners();
  }
}
