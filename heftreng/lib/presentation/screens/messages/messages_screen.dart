import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../data/models/user_model.dart';
import '../../../data/services/firebase_service.dart';
import '../../../providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../widgets/common/common_widgets.dart';
import '../auth/auth_screen.dart';

// ══ MESAJLAŞMA EKRANI ══

class MessagesScreen extends StatelessWidget {
  const MessagesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final primary = Theme.of(context).colorScheme.primary;

    if (!auth.isLoggedIn) {
      return Center(
        child: EmptyState(
          icon: Icons.mail_outline_rounded,
          title: 'Mesajlarını görmek için giriş yap',
          action: HeftrengButton(
            label: 'Giriş Yap',
            icon: Icons.login_rounded,
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const AuthScreen()),
            ),
          ),
        ),
      );
    }

    final db = FirebaseFirestore.instance;
    final uid = auth.user!.uid;

    return Column(
      children: [
        // Header
        Container(
          height: 56,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: const BoxDecoration(
            color: HeftrengColors.glass2,
            border: Border(
              bottom: BorderSide(color: HeftrengColors.border),
            ),
          ),
          child: Row(
            children: [
              Text(
                'Mesajlar',
                style: HeftrengTextStyles.serif(
                  size: 18,
                  color: HeftrengColors.txt,
                ),
              ),
              const Spacer(),
              Icon(Icons.edit_rounded, size: 20, color: primary),
            ],
          ),
        ),

        // Konuşmalar
        Expanded(
          child: StreamBuilder<QuerySnapshot>(
            stream: db
                .collection('conversations')
                .where('participants', arrayContains: uid)
                .orderBy('lastMessageAt', descending: true)
                .snapshots(),
            builder: (_, snap) {
              if (snap.connectionState == ConnectionState.waiting) {
                return Center(
                  child: CircularProgressIndicator(
                    color: primary,
                    strokeWidth: 2,
                  ),
                );
              }

              final docs = snap.data?.docs ?? [];
              if (docs.isEmpty) {
                return const EmptyState(
                  icon: Icons.forum_outlined,
                  title: 'Henüz mesaj yok',
                  subtitle: 'Bir kullanıcının profilinden mesaj gönderebilirsin',
                );
              }

              return ListView.builder(
                itemCount: docs.length,
                itemBuilder: (_, i) {
                  final data = docs[i].data() as Map<String, dynamic>;
                  final convId = docs[i].id;
                  final participants =
                      List<String>.from(data['participants'] as List? ?? []);
                  final otherUid = participants.firstWhere(
                    (p) => p != uid,
                    orElse: () => '',
                  );

                  return _ConvItem(
                    convId: convId,
                    otherUid: otherUid,
                    lastMessage: data['lastMessage'] as String? ?? '',
                    lastMessageAt: (data['lastMessageAt'] as Timestamp?)
                        ?.toDate(),
                    unreadCount: data['unread_$uid'] as int? ?? 0,
                    currentUid: uid,
                    currentUser: auth.user!,
                  );
                },
              );
            },
          ),
        ),
      ],
    );
  }
}

// ── Konuşma satırı ──
class _ConvItem extends StatelessWidget {
  final String convId;
  final String otherUid;
  final String lastMessage;
  final DateTime? lastMessageAt;
  final int unreadCount;
  final String currentUid;
  final dynamic currentUser;

  const _ConvItem({
    required this.convId,
    required this.otherUid,
    required this.lastMessage,
    this.lastMessageAt,
    required this.unreadCount,
    required this.currentUid,
    required this.currentUser,
  });

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    final social = SocialService();

    return FutureBuilder<UserModel?>(
      future: social.getUser(otherUid),
      builder: (_, snap) {
        final other = snap.data;
        final name = other?.displayName ?? '…';
        final photo = other?.photoUrl;
        final initials = other?.initials ?? '?';

        return GestureDetector(
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => ChatScreen(
                convId: convId,
                otherUser: other,
                currentUid: currentUid,
                currentUser: currentUser,
              ),
            ),
          ),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: const BoxDecoration(
              border: Border(
                bottom: BorderSide(color: HeftrengColors.border, width: 1),
              ),
            ),
            child: Row(
              children: [
                // Online presence
                StreamBuilder<bool>(
                  stream: social.watchPresence(otherUid),
                  builder: (_, presSnap) {
                    return HeftrengAvatar(
                      photoUrl: photo,
                      initials: initials,
                      size: 46,
                      showOnlineDot: true,
                      isOnline: presSnap.data ?? false,
                    );
                  },
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        style: HeftrengTextStyles.sans(
                          size: 14,
                          weight: FontWeight.w700,
                          color: HeftrengColors.txt,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        lastMessage,
                        style: HeftrengTextStyles.sans(
                          size: 12,
                          color: unreadCount > 0
                              ? HeftrengColors.txt2
                              : HeftrengColors.muted,
                          weight: unreadCount > 0
                              ? FontWeight.w600
                              : FontWeight.w400,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    if (lastMessageAt != null)
                      Text(
                        _timeShort(lastMessageAt!),
                        style: HeftrengTextStyles.mono(
                          size: 10,
                          color: unreadCount > 0 ? primary : HeftrengColors.muted,
                        ),
                      ),
                    if (unreadCount > 0) ...[
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: primary,
                          borderRadius: BorderRadius.circular(99),
                        ),
                        child: Text(
                          unreadCount.toString(),
                          style: HeftrengTextStyles.mono(
                            size: 10,
                            color: Colors.white,
                          ).copyWith(fontWeight: FontWeight.w700),
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  String _timeShort(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inMinutes < 60) return '${diff.inMinutes}dk';
    if (diff.inHours < 24) return '${diff.inHours}s';
    if (diff.inDays < 7) return '${diff.inDays}g';
    return '${dt.day}/${dt.month}';
  }
}

// ══ CHAT EKRANI ══

class ChatScreen extends StatefulWidget {
  final String convId;
  final UserModel? otherUser;
  final String currentUid;
  final dynamic currentUser;

  const ChatScreen({
    super.key,
    required this.convId,
    required this.otherUser,
    required this.currentUid,
    required this.currentUser,
  });

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _ctrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  final _db = FirebaseFirestore.instance;
  bool _isSending = false;
  bool _isTyping = false;

  @override
  void dispose() {
    _ctrl.dispose();
    _scrollCtrl.dispose();
    _setTyping(false);
    super.dispose();
  }

  // ── Yazıyor durumu — temadaki typing sistemi ──
  void _setTyping(bool typing) {
    _db
        .collection('typing')
        .doc('${widget.convId}_${widget.currentUid}')
        .set({
      'uid': widget.currentUid,
      'convId': widget.convId,
      'typing': typing,
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }

  void _onTextChanged(String val) {
    final shouldType = val.isNotEmpty;
    if (shouldType != _isTyping) {
      _isTyping = shouldType;
      _setTyping(_isTyping);
    }
  }

  Future<void> _send() async {
    final text = _ctrl.text.trim();
    if (text.isEmpty || _isSending) return;

    setState(() => _isSending = true);
    _ctrl.clear();
    _setTyping(false);

    final msg = MessageModel(
      id: '',
      senderUid: widget.currentUid,
      senderName: widget.currentUser.displayName,
      senderPhoto: widget.currentUser.photoUrl,
      text: text,
      sentAt: DateTime.now(),
    );

    await _db
        .collection('convMessages')
        .doc(widget.convId)
        .collection('messages')
        .add(msg.toFirestore());

    // Konuşma metadata güncelle
    await _db.collection('conversations').doc(widget.convId).update({
      'lastMessage': text,
      'lastMessageAt': FieldValue.serverTimestamp(),
      'unread_${widget.otherUser?.uid ?? ''}': FieldValue.increment(1),
    });

    setState(() => _isSending = false);

    // Scroll alta
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    final other = widget.otherUser;
    final social = SocialService();

    return Scaffold(
      backgroundColor: HeftrengColors.bg,
      body: SafeArea(
        child: Column(
          children: [
            // ── AppBar ──
            Container(
              height: 56,
              padding: const EdgeInsets.symmetric(horizontal: 8),
              decoration: const BoxDecoration(
                color: HeftrengColors.glass2,
                border: Border(
                  bottom: BorderSide(color: HeftrengColors.border),
                ),
              ),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back_rounded),
                    color: HeftrengColors.muted,
                    onPressed: () => Navigator.pop(context),
                  ),
                  StreamBuilder<bool>(
                    stream: other != null
                        ? social.watchPresence(other.uid)
                        : const Stream.empty(),
                    builder: (_, snap) {
                      return HeftrengAvatar(
                        photoUrl: other?.photoUrl,
                        initials: other?.initials ?? '?',
                        size: 34,
                        showOnlineDot: true,
                        isOnline: snap.data ?? false,
                      );
                    },
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          other?.displayName ?? '…',
                          style: HeftrengTextStyles.sans(
                            size: 14,
                            weight: FontWeight.w700,
                            color: HeftrengColors.txt,
                          ),
                        ),
                        // Yazıyor durumu
                        StreamBuilder<DocumentSnapshot>(
                          stream: _db
                              .collection('typing')
                              .doc('${widget.convId}_${other?.uid ?? ''}')
                              .snapshots(),
                          builder: (_, snap) {
                            final typing =
                                snap.data?.get('typing') as bool? ?? false;
                            return AnimatedSwitcher(
                              duration: const Duration(milliseconds: 200),
                              child: typing
                                  ? Text(
                                      'yazıyor…',
                                      key: const ValueKey('typing'),
                                      style: HeftrengTextStyles.mono(
                                        size: 11,
                                        color: primary,
                                      ),
                                    )
                                  : const SizedBox.shrink(
                                      key: ValueKey('idle'),
                                    ),
                            );
                          },
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // ── Mesajlar ──
            Expanded(
              child: StreamBuilder<QuerySnapshot>(
                stream: _db
                    .collection('convMessages')
                    .doc(widget.convId)
                    .collection('messages')
                    .orderBy('sentAt', descending: false)
                    .snapshots(),
                builder: (_, snap) {
                  if (snap.connectionState == ConnectionState.waiting) {
                    return Center(
                      child: CircularProgressIndicator(
                        color: primary,
                        strokeWidth: 2,
                      ),
                    );
                  }

                  final docs = snap.data?.docs ?? [];

                  WidgetsBinding.instance.addPostFrameCallback((_) {
                    if (_scrollCtrl.hasClients) {
                      _scrollCtrl.jumpTo(
                          _scrollCtrl.position.maxScrollExtent);
                    }
                  });

                  if (docs.isEmpty) {
                    return const EmptyState(
                      icon: Icons.waving_hand_rounded,
                      title: 'Henüz mesaj yok',
                      subtitle: 'İlk mesajı sen gönder!',
                    );
                  }

                  return ListView.builder(
                    controller: _scrollCtrl,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 10,
                    ),
                    itemCount: docs.length,
                    itemBuilder: (_, i) {
                      final data =
                          docs[i].data() as Map<String, dynamic>;
                      final msg = MessageModel.fromFirestore(data, docs[i].id);
                      final isOwn = msg.senderUid == widget.currentUid;

                      return _MessageBubble(msg: msg, isOwn: isOwn);
                    },
                  );
                },
              ),
            ),

            // ── Mesaj giriş alanı ──
            Container(
              padding: EdgeInsets.fromLTRB(
                12,
                10,
                12,
                10 + MediaQuery.of(context).padding.bottom,
              ),
              decoration: const BoxDecoration(
                color: HeftrengColors.s1,
                border: Border(
                  top: BorderSide(color: HeftrengColors.border),
                ),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: HeftrengColors.s2,
                        borderRadius: BorderRadius.circular(22),
                        border: Border.all(color: HeftrengColors.border),
                      ),
                      child: TextField(
                        controller: _ctrl,
                        onChanged: _onTextChanged,
                        style: HeftrengTextStyles.sans(
                          size: 14,
                          color: HeftrengColors.txt,
                        ),
                        decoration: InputDecoration(
                          hintText: 'Mesaj yaz…',
                          hintStyle: HeftrengTextStyles.sans(
                            size: 14,
                            color: HeftrengColors.muted,
                          ),
                          border: InputBorder.none,
                          isDense: true,
                          isCollapsed: true,
                        ),
                        maxLines: null,
                        textCapitalization: TextCapitalization.sentences,
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  GestureDetector(
                    onTap: _isSending ? null : _send,
                    child: Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [primary, HeftrengColors.primary2],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: primary.withOpacity(0.4),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: _isSending
                          ? const Padding(
                              padding: EdgeInsets.all(10),
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            )
                          : const Icon(
                              Icons.send_rounded,
                              color: Colors.white,
                              size: 18,
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Mesaj baloncuğu ──
class _MessageBubble extends StatelessWidget {
  final MessageModel msg;
  final bool isOwn;

  const _MessageBubble({required this.msg, required this.isOwn});

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment:
            isOwn ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isOwn) ...[
            HeftrengAvatar(
              photoUrl: msg.senderPhoto,
              initials: msg.senderName.isNotEmpty
                  ? msg.senderName[0].toUpperCase()
                  : '?',
              size: 28,
            ),
            const SizedBox(width: 6),
          ],
          Flexible(
            child: Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              constraints: BoxConstraints(
                maxWidth: MediaQuery.of(context).size.width * 0.72,
              ),
              decoration: BoxDecoration(
                gradient: isOwn
                    ? LinearGradient(
                        colors: [primary, HeftrengColors.primary2],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      )
                    : null,
                color: isOwn ? null : HeftrengColors.s1,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(isOwn ? 16 : 4),
                  bottomRight: Radius.circular(isOwn ? 4 : 16),
                ),
                border: isOwn
                    ? null
                    : Border.all(color: HeftrengColors.border),
                boxShadow: isOwn
                    ? [
                        BoxShadow(
                          color: primary.withOpacity(0.3),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ]
                    : null,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    msg.text,
                    style: HeftrengTextStyles.sans(
                      size: 14,
                      color: isOwn ? Colors.white : HeftrengColors.txt,
                      lineHeight: 1.5,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        _timeStr(msg.sentAt),
                        style: HeftrengTextStyles.mono(
                          size: 10,
                          color: isOwn
                              ? Colors.white.withOpacity(0.65)
                              : HeftrengColors.muted,
                        ),
                      ),
                      if (isOwn) ...[
                        const SizedBox(width: 4),
                        Icon(
                          msg.seen
                              ? Icons.done_all_rounded
                              : Icons.done_rounded,
                          size: 12,
                          color: Colors.white.withOpacity(0.65),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ),
          if (isOwn) const SizedBox(width: 8),
        ],
      ),
    );
  }

  String _timeStr(DateTime dt) {
    final h = dt.hour.toString().padLeft(2, '0');
    final m = dt.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }
}
