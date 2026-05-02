import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/user_model.dart';
import '../models/post_model.dart';
import '../../core/constants/app_constants.dart';

// ══ AUTH SERVİSİ ══

class AuthService {
  final _auth = FirebaseAuth.instance;
  final _db = FirebaseFirestore.instance;

  User? get currentUser => _auth.currentUser;
  bool get isLoggedIn => currentUser != null;

  Stream<User?> get authStateChanges => _auth.authStateChanges();

  // ── Google ile giriş ──
  // (google_sign_in paketi eklenince genişletilecek)
  Future<UserModel?> signInWithGoogle() async {
    // TODO: GoogleSignIn akışı
    throw UnimplementedError('Google giriş yakında');
  }

  // ── Email/şifre girişi ──
  Future<UserModel?> signInWithEmail(String email, String password) async {
    final cred = await _auth.signInWithEmailAndPassword(
      email: email,
      password: password,
    );
    return _getOrCreateUser(cred.user!);
  }

  // ── Email/şifre kaydı ──
  Future<UserModel?> registerWithEmail({
    required String email,
    required String password,
    required String displayName,
  }) async {
    final cred = await _auth.createUserWithEmailAndPassword(
      email: email,
      password: password,
    );
    await cred.user!.updateDisplayName(displayName);
    return _getOrCreateUser(cred.user!);
  }

  // ── Çıkış ──
  Future<void> signOut() async {
    await _setPresence(false);
    await _auth.signOut();
  }

  // ── Kullanıcı Firestore kaydı ──
  Future<UserModel?> _getOrCreateUser(User user) async {
    final ref = _db.collection(AppConstants.colUsers).doc(user.uid);
    final snap = await ref.get();

    if (!snap.exists) {
      final newUser = UserModel(
        uid: user.uid,
        displayName: user.displayName ?? 'Kullanıcı',
        email: user.email ?? '',
        photoUrl: user.photoURL,
      );
      await ref.set(newUser.toFirestore());
      return newUser;
    }

    return UserModel.fromFirestore(snap.data()!, user.uid);
  }

  // ── Presence güncelle ──
  Future<void> _setPresence(bool online) async {
    if (currentUser == null) return;
    await _db.collection(AppConstants.colPresence).doc(currentUser!.uid).set({
      'online': online,
      'lastSeen': FieldValue.serverTimestamp(),
      'uid': currentUser!.uid,
    }, SetOptions(merge: true));
  }

  Future<void> initPresence() => _setPresence(true);
}

// ══ SOSYAL SERVİS (Firestore) ══

class SocialService {
  final _db = FirebaseFirestore.instance;

  // ── Beğeni ──
  Future<void> toggleLike({
    required String postId,
    required String uid,
    required bool isLiking,
  }) async {
    final likeRef = _db
        .collection(AppConstants.colLikes)
        .doc('${postId}_$uid');

    final postRef = _db
        .collection(AppConstants.colComments) // likes sayacı burada
        .doc(postId);

    final batch = _db.batch();

    if (isLiking) {
      batch.set(likeRef, {
        'uid': uid,
        'postId': postId,
        'createdAt': FieldValue.serverTimestamp(),
      });
    } else {
      batch.delete(likeRef);
    }

    await batch.commit();
  }

  Future<bool> isPostLiked(String postId, String uid) async {
    final doc = await _db
        .collection(AppConstants.colLikes)
        .doc('${postId}_$uid')
        .get();
    return doc.exists;
  }

  // ── Yorum ──
  Stream<List<CommentModel>> watchComments(String postId) {
    return _db
        .collection(AppConstants.colComments)
        .where('postId', isEqualTo: postId)
        .orderBy('createdAt', descending: false)
        .snapshots()
        .map((snap) => snap.docs
            .map((d) => CommentModel.fromFirestore(d.data(), d.id))
            .toList());
  }

  Future<void> addComment({
    required String postId,
    required String authorUid,
    required String authorName,
    String? authorPhoto,
    required String text,
  }) async {
    await _db.collection(AppConstants.colComments).add({
      'postId': postId,
      'authorUid': authorUid,
      'authorName': authorName,
      'authorPhoto': authorPhoto,
      'text': text,
      'createdAt': FieldValue.serverTimestamp(),
      'likeCount': 0,
    });
  }

  Future<void> deleteComment(String commentId) async {
    await _db.collection(AppConstants.colComments).doc(commentId).delete();
  }

  // ── Kaydetme (Bookmark) ──
  Future<void> toggleBookmark({
    required String postId,
    required String uid,
    required bool isSaving,
    PostModel? post,
  }) async {
    final ref = _db
        .collection(AppConstants.colBookmarks)
        .doc(uid)
        .collection('saved')
        .doc(postId);

    if (isSaving && post != null) {
      await ref.set({
        ...post.toJson(),
        'savedAt': FieldValue.serverTimestamp(),
      });
    } else {
      await ref.delete();
    }
  }

  Stream<List<PostModel>> watchBookmarks(String uid) {
    return _db
        .collection(AppConstants.colBookmarks)
        .doc(uid)
        .collection('saved')
        .orderBy('savedAt', descending: true)
        .snapshots()
        .map((snap) => snap.docs.map((d) {
              final data = d.data();
              return PostModel(
                id: data['id'] as String,
                title: data['title'] as String,
                content: '',
                snippet: data['snippet'] as String? ?? '',
                featuredImage: data['featuredImage'] as String?,
                url: data['url'] as String,
                authorName: data['authorName'] as String,
                authorPhoto: data['authorPhoto'] as String?,
                published: DateTime.tryParse(data['published'] as String? ?? '') ?? DateTime.now(),
                updated: DateTime.now(),
                labels: List<String>.from(data['labels'] as List? ?? []),
                isBookmarked: true,
              );
            }).toList());
  }

  // ── Takip ──
  Future<void> toggleFollow({
    required String currentUid,
    required String targetUid,
    required bool isFollowing,
  }) async {
    final followRef = _db
        .collection(AppConstants.colFollows)
        .doc('${currentUid}_$targetUid');

    if (isFollowing) {
      await followRef.set({
        'followerUid': currentUid,
        'followingUid': targetUid,
        'createdAt': FieldValue.serverTimestamp(),
      });
    } else {
      await followRef.delete();
    }
  }

  Future<bool> isFollowing(String currentUid, String targetUid) async {
    final doc = await _db
        .collection(AppConstants.colFollows)
        .doc('${currentUid}_$targetUid')
        .get();
    return doc.exists;
  }

  // ── Bildirimler ──
  Stream<List<NotificationModel>> watchNotifications(String uid) {
    return _db
        .collection(AppConstants.colNotifications)
        .doc(uid)
        .collection('items')
        .orderBy('createdAt', descending: true)
        .limit(AppConstants.notificationsPerPage)
        .snapshots()
        .map((snap) => snap.docs
            .map((d) => NotificationModel.fromFirestore(d.data(), d.id))
            .toList());
  }

  Future<void> markNotificationRead(String uid, String notifId) async {
    await _db
        .collection(AppConstants.colNotifications)
        .doc(uid)
        .collection('items')
        .doc(notifId)
        .update({'isRead': true});
  }

  // ── Profil güncelle ──
  Future<void> updateProfile({
    required String uid,
    String? displayName,
    String? bio,
    String? photoUrl,
  }) async {
    final updates = <String, dynamic>{};
    if (displayName != null) updates['displayName'] = displayName;
    if (bio != null) updates['bio'] = bio;
    if (photoUrl != null) updates['photoUrl'] = photoUrl;

    await _db
        .collection(AppConstants.colUsers)
        .doc(uid)
        .update(updates);
  }

  // ── Kullanıcı profili ──
  Future<UserModel?> getUser(String uid) async {
    final snap = await _db.collection(AppConstants.colUsers).doc(uid).get();
    if (!snap.exists) return null;
    return UserModel.fromFirestore(snap.data()!, uid);
  }

  // ── Presence durumu ──
  Stream<bool> watchPresence(String uid) {
    return _db
        .collection(AppConstants.colPresence)
        .doc(uid)
        .snapshots()
        .map((snap) => snap.data()?['online'] as bool? ?? false);
  }
}
