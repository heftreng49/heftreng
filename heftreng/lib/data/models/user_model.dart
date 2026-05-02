// ══ KULLANICI MODELİ ══

class UserModel {
  final String uid;
  final String displayName;
  final String email;
  final String? photoUrl;
  final String? bio;
  final int postCount;
  final int followerCount;
  final int followingCount;
  final bool isOnline;
  final DateTime? lastSeen;

  UserModel({
    required this.uid,
    required this.displayName,
    required this.email,
    this.photoUrl,
    this.bio,
    this.postCount = 0,
    this.followerCount = 0,
    this.followingCount = 0,
    this.isOnline = false,
    this.lastSeen,
  });

  factory UserModel.fromFirestore(Map<String, dynamic> data, String uid) {
    return UserModel(
      uid: uid,
      displayName: data['displayName'] as String? ?? 'Kullanıcı',
      email: data['email'] as String? ?? '',
      photoUrl: data['photoUrl'] as String?,
      bio: data['bio'] as String?,
      postCount: data['postCount'] as int? ?? 0,
      followerCount: data['followerCount'] as int? ?? 0,
      followingCount: data['followingCount'] as int? ?? 0,
      isOnline: data['online'] as bool? ?? false,
      lastSeen: (data['lastSeen'] as dynamic)?.toDate() as DateTime?,
    );
  }

  Map<String, dynamic> toFirestore() => {
        'displayName': displayName,
        'email': email,
        'photoUrl': photoUrl,
        'bio': bio,
        'postCount': postCount,
        'followerCount': followerCount,
        'followingCount': followingCount,
      };

  // Avatar için baş harf
  String get initials {
    if (displayName.isEmpty) return '?';
    final parts = displayName.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
    }
    return displayName[0].toUpperCase();
  }

  UserModel copyWith({
    String? displayName,
    String? photoUrl,
    String? bio,
    int? postCount,
    int? followerCount,
    int? followingCount,
    bool? isOnline,
  }) =>
      UserModel(
        uid: uid,
        displayName: displayName ?? this.displayName,
        email: email,
        photoUrl: photoUrl ?? this.photoUrl,
        bio: bio ?? this.bio,
        postCount: postCount ?? this.postCount,
        followerCount: followerCount ?? this.followerCount,
        followingCount: followingCount ?? this.followingCount,
        isOnline: isOnline ?? this.isOnline,
        lastSeen: lastSeen,
      );
}

// ── Yorum Modeli ──
class CommentModel {
  final String id;
  final String postId;
  final String authorUid;
  final String authorName;
  final String? authorPhoto;
  final String text;
  final DateTime createdAt;
  final int likeCount;
  bool isLiked;

  CommentModel({
    required this.id,
    required this.postId,
    required this.authorUid,
    required this.authorName,
    this.authorPhoto,
    required this.text,
    required this.createdAt,
    this.likeCount = 0,
    this.isLiked = false,
  });

  factory CommentModel.fromFirestore(Map<String, dynamic> data, String id) {
    return CommentModel(
      id: id,
      postId: data['postId'] as String? ?? '',
      authorUid: data['authorUid'] as String? ?? '',
      authorName: data['authorName'] as String? ?? 'Anonim',
      authorPhoto: data['authorPhoto'] as String?,
      text: data['text'] as String? ?? '',
      createdAt: (data['createdAt'] as dynamic)?.toDate() ?? DateTime.now(),
      likeCount: data['likeCount'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toFirestore() => {
        'postId': postId,
        'authorUid': authorUid,
        'authorName': authorName,
        'authorPhoto': authorPhoto,
        'text': text,
        'createdAt': createdAt,
        'likeCount': likeCount,
      };
}

// ── Bildirim Modeli ──
class NotificationModel {
  final String id;
  final String type; // like, comment, follow, bookmark, system
  final String title;
  final String? subtitle;
  final String? postId;
  final String? fromUid;
  final bool isRead;
  final DateTime createdAt;

  NotificationModel({
    required this.id,
    required this.type,
    required this.title,
    this.subtitle,
    this.postId,
    this.fromUid,
    this.isRead = false,
    required this.createdAt,
  });

  factory NotificationModel.fromFirestore(Map<String, dynamic> data, String id) {
    return NotificationModel(
      id: id,
      type: data['type'] as String? ?? 'system',
      title: data['title'] as String? ?? '',
      subtitle: data['subtitle'] as String?,
      postId: data['postId'] as String?,
      fromUid: data['fromUid'] as String?,
      isRead: data['isRead'] as bool? ?? false,
      createdAt: (data['createdAt'] as dynamic)?.toDate() ?? DateTime.now(),
    );
  }
}

// ── Mesaj Modeli ──
class MessageModel {
  final String id;
  final String senderUid;
  final String senderName;
  final String? senderPhoto;
  final String text;
  final DateTime sentAt;
  final bool seen;
  final String? seenByName;
  final String? seenByPhoto;

  MessageModel({
    required this.id,
    required this.senderUid,
    required this.senderName,
    this.senderPhoto,
    required this.text,
    required this.sentAt,
    this.seen = false,
    this.seenByName,
    this.seenByPhoto,
  });

  factory MessageModel.fromFirestore(Map<String, dynamic> data, String id) {
    return MessageModel(
      id: id,
      senderUid: data['senderUid'] as String? ?? '',
      senderName: data['senderName'] as String? ?? '',
      senderPhoto: data['senderPhoto'] as String?,
      text: data['text'] as String? ?? '',
      sentAt: (data['sentAt'] as dynamic)?.toDate() ?? DateTime.now(),
      seen: data['seen'] as bool? ?? false,
      seenByName: data['seenByName'] as String?,
      seenByPhoto: data['seenByPhoto'] as String?,
    );
  }

  Map<String, dynamic> toFirestore() => {
        'senderUid': senderUid,
        'senderName': senderName,
        'senderPhoto': senderPhoto,
        'text': text,
        'sentAt': sentAt,
        'seen': seen,
      };
}
