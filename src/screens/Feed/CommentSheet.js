import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, Image, KeyboardAvoidingView, Platform,
  ActivityIndicator, Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { sendInAppNotification } from '../../utils/notifications';
import { COLORS, SPACING, RADIUS, FONT } from '../../constants/theme';

// Web'deki comments koleksiyonuyla birebir aynı yapı
export default function CommentSheet({ post, onClose }) {
  const [comments,  setComments]  = useState([]);
  const [text,      setText]      = useState('');
  const [loading,   setLoading]   = useState(true);
  const [sending,   setSending]   = useState(false);
  const [replyTo,   setReplyTo]   = useState(null); // { id, name }
  const { user, profile } = useAuth();
  const inputRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    // Aşağıdan yukarı slide animasyonu
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();

    // Gerçek zamanlı yorum listener — web'deki comments koleksiyonu
    const unsub = firestore()
      .collection('comments')
      .where('postId', '==', post.id)
      .orderBy('ts', 'asc')
      .limit(100)
      .onSnapshot(snap => {
        setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      }, () => setLoading(false));

    return unsub;
  }, [post.id]);

  const sendComment = async () => {
    if (!text.trim() || !user) return;
    setSending(true);
    const content = text.trim();
    setText('');
    setReplyTo(null);

    try {
      // Web'deki comments koleksiyonuna yaz — alan adları birebir aynı
      await firestore().collection('comments').add({
        postId:      post.id,
        uid:         user.uid,
        name:        profile?.displayName || user.displayName || 'Kullanıcı',
        photoURL:    profile?.photoURL    || user.photoURL    || '',
        text:        content,
        likes:       0,
        replyTo:     replyTo?.id   || null,
        replyToName: replyTo?.name || null,
        ts:          firestore.FieldValue.serverTimestamp(),
      });

      // Gönderi yorum sayacını artır
      await firestore().collection('feed').doc(post.id)
        .update({ cmtCount: firestore.FieldValue.increment(1) });

      // Gönderi sahibine bildirim — kendi yorumuysa gönderme
      if (post.uid !== user.uid) {
        await sendInAppNotification({
          toUid: post.uid,
          type:  'comment',
          fromUser: {
            uid:   user.uid,
            name:  profile?.displayName || user.displayName || 'Kullanıcı',
            photo: profile?.photoURL    || user.photoURL    || '',
          },
          extra: { postId: post.id },
        });
      }

      // Yanıtlanan kişiye de bildirim — farklıysa
      if (replyTo?.uid && replyTo.uid !== user.uid && replyTo.uid !== post.uid) {
        await sendInAppNotification({
          toUid: replyTo.uid,
          type:  'comment',
          fromUser: {
            uid:   user.uid,
            name:  profile?.displayName || user.displayName || 'Kullanıcı',
            photo: profile?.photoURL    || user.photoURL    || '',
          },
          extra: { postId: post.id },
        });
      }
    } catch (e) { console.log('Yorum hatası:', e); }
    finally { setSending(false); }
  };

  const handleReply = (cmt) => {
    setReplyTo({ id: cmt.id, name: cmt.name, uid: cmt.uid });
    inputRef.current?.focus();
  };

  const renderComment = ({ item: cmt, index }) => {
    const isMe = cmt.uid === user?.uid;
    const prevCmt = comments[index - 1];
    const grouped = prevCmt?.uid === cmt.uid;

    return (
      <View style={[s.cmtRow, grouped && s.cmtGrouped]}>
        {/* Avatar — grupluysa gizle */}
        {!grouped
          ? (cmt.photoURL
              ? <Image source={{ uri: cmt.photoURL }} style={s.cmtAvatar} />
              : <View style={[s.cmtAvatar, s.cmtAvatarFb]}>
                  <Text style={s.cmtAvatarL}>{(cmt.name||'K')[0].toUpperCase()}</Text>
                </View>)
          : <View style={s.cmtAvatarGhost} />
        }

        <View style={s.cmtBody}>
          {/* Yanıt bağlamı */}
          {cmt.replyToName && (
            <View style={s.replyCtx}>
              <MaterialCommunityIcons name="reply" size={11} color={COLORS.textMuted} />
              <Text style={s.replyCtxTxt}>{cmt.replyToName}</Text>
            </View>
          )}

          {!grouped && (
            <View style={s.cmtNameRow}>
              <Text style={[s.cmtName, isMe && { color: COLORS.brand }]}>{cmt.name}</Text>
              <Text style={s.cmtTime}>
                {cmt.ts?.seconds ? formatTime(new Date(cmt.ts.seconds * 1000)) : ''}
              </Text>
            </View>
          )}

          <View style={s.cmtBubble}>
            <Text style={s.cmtText}>{cmt.text}</Text>
          </View>

          <TouchableOpacity style={s.replyBtn} onPress={() => handleReply(cmt)}>
            <Text style={s.replyBtnTxt}>Yanıtla</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={s.overlay}>
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose} />

      <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>
        {/* Handle */}
        <View style={s.handle} />

        {/* Başlık */}
        <View style={s.sheetHeader}>
          <Text style={s.sheetTitle}>
            Yorumlar {comments.length > 0 ? `(${comments.length})` : ''}
          </Text>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <MaterialCommunityIcons name="close" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Gönderi özeti */}
        <View style={s.postPreview}>
          {post.photoURL
            ? <Image source={{ uri: post.photoURL }} style={s.postAvatar} />
            : <View style={[s.postAvatar, s.postAvatarFb]}>
                <Text style={s.postAvatarL}>{(post.name||'K')[0].toUpperCase()}</Text>
              </View>
          }
          <Text style={s.postText} numberOfLines={2}>{post.text || post.quoteText}</Text>
        </View>

        {/* Yorumlar */}
        {loading
          ? <ActivityIndicator color={COLORS.brand} style={{ marginTop: 40 }} />
          : (
            <FlatList
              data={comments}
              keyExtractor={i => i.id}
              renderItem={renderComment}
              style={s.list}
              contentContainerStyle={{ padding: SPACING.md, paddingBottom: 8 }}
              ListEmptyComponent={
                <View style={s.empty}>
                  <MaterialCommunityIcons name="comment-outline" size={36} color={COLORS.border} />
                  <Text style={s.emptyTxt}>Henüz yorum yok — ilk yorumu yap!</Text>
                </View>
              }
            />
          )
        }

        {/* Input alanı */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          {replyTo && (
            <View style={s.replyBanner}>
              <MaterialCommunityIcons name="reply" size={14} color={COLORS.brand} />
              <Text style={s.replyBannerTxt}>{replyTo.name} yanıtlanıyor</Text>
              <TouchableOpacity onPress={() => setReplyTo(null)}>
                <MaterialCommunityIcons name="close" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          )}
          {user ? (
            <View style={s.inputRow}>
              {profile?.photoURL
                ? <Image source={{ uri: profile.photoURL }} style={s.myAvatar} />
                : <View style={[s.myAvatar, s.myAvatarFb]}>
                    <Text style={s.myAvatarL}>{(profile?.displayName||'K')[0].toUpperCase()}</Text>
                  </View>
              }
              <TextInput
                ref={inputRef}
                style={s.input}
                value={text}
                onChangeText={setText}
                placeholder="Yorum yaz..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[s.sendBtn, (!text.trim() || sending) && s.sendBtnOff]}
                onPress={sendComment}
                disabled={!text.trim() || sending}>
                {sending
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <MaterialCommunityIcons name="send" size={18} color="#fff" />
                }
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.loginBanner}>
              <Text style={s.loginTxt}>Yorum yapmak için giriş yap</Text>
            </View>
          )}
        </KeyboardAvoidingView>
      </Animated.View>
    </View>
  );
}

function formatTime(d) {
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 60)    return `${Math.floor(s)}sn`;
  if (s < 3600)  return `${Math.floor(s/60)}d`;
  if (s < 86400) return `${Math.floor(s/3600)}s`;
  return `${Math.floor(s/86400)}g`;
}

const s = StyleSheet.create({
  overlay:       { position:'absolute', top:0, left:0, right:0, bottom:0, zIndex:999 },
  backdrop:      { position:'absolute', top:0, left:0, right:0, bottom:0, backgroundColor:'rgba(0,0,0,0.5)' },
  sheet:         { position:'absolute', left:0, right:0, bottom:0, backgroundColor:COLORS.surface, borderTopLeftRadius:20, borderTopRightRadius:20, maxHeight:'80%', minHeight:'50%' },
  handle:        { width:40, height:4, borderRadius:2, backgroundColor:COLORS.border, alignSelf:'center', marginTop:10, marginBottom:4 },
  sheetHeader:   { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:SPACING.lg, paddingVertical:SPACING.md, borderBottomWidth:1, borderBottomColor:COLORS.border },
  sheetTitle:    { color:COLORS.text, fontWeight:FONT.bold, fontSize:16 },
  closeBtn:      { padding:SPACING.xs },
  postPreview:   { flexDirection:'row', alignItems:'center', gap:SPACING.sm, paddingHorizontal:SPACING.lg, paddingVertical:SPACING.sm, backgroundColor:COLORS.surface2, borderBottomWidth:1, borderBottomColor:COLORS.border },
  postAvatar:    { width:28, height:28, borderRadius:14 },
  postAvatarFb:  { backgroundColor:COLORS.brand, alignItems:'center', justifyContent:'center' },
  postAvatarL:   { color:'#fff', fontSize:11, fontWeight:FONT.bold },
  postText:      { flex:1, color:COLORS.textMuted, fontSize:13 },
  list:          { flex:1 },
  cmtRow:        { flexDirection:'row', gap:SPACING.sm, marginBottom:SPACING.sm },
  cmtGrouped:    { marginBottom:2 },
  cmtAvatar:     { width:32, height:32, borderRadius:16 },
  cmtAvatarFb:   { backgroundColor:COLORS.brand, alignItems:'center', justifyContent:'center' },
  cmtAvatarL:    { color:'#fff', fontSize:12, fontWeight:FONT.bold },
  cmtAvatarGhost:{ width:32 },
  cmtBody:       { flex:1 },
  cmtNameRow:    { flexDirection:'row', alignItems:'center', gap:SPACING.xs, marginBottom:3 },
  cmtName:       { color:COLORS.text, fontWeight:FONT.bold, fontSize:13 },
  cmtTime:       { color:COLORS.textMuted, fontSize:11 },
  cmtBubble:     { backgroundColor:COLORS.surface2, borderRadius:RADIUS.md, borderTopLeftRadius:4, paddingHorizontal:SPACING.md, paddingVertical:SPACING.sm },
  cmtText:       { color:COLORS.text, fontSize:14, lineHeight:20 },
  replyCtx:      { flexDirection:'row', alignItems:'center', gap:3, marginBottom:3 },
  replyCtxTxt:   { color:COLORS.textMuted, fontSize:11 },
  replyBtn:      { marginTop:4 },
  replyBtnTxt:   { color:COLORS.textMuted, fontSize:11 },
  replyBanner:   { flexDirection:'row', alignItems:'center', gap:SPACING.xs, backgroundColor:COLORS.surface2, paddingHorizontal:SPACING.lg, paddingVertical:SPACING.xs, borderTopWidth:1, borderTopColor:COLORS.border },
  replyBannerTxt:{ flex:1, color:COLORS.brand, fontSize:12 },
  inputRow:      { flexDirection:'row', alignItems:'flex-end', gap:SPACING.sm, padding:SPACING.md, borderTopWidth:1, borderTopColor:COLORS.border },
  myAvatar:      { width:34, height:34, borderRadius:17 },
  myAvatarFb:    { backgroundColor:COLORS.brand, alignItems:'center', justifyContent:'center' },
  myAvatarL:     { color:'#fff', fontSize:13, fontWeight:FONT.bold },
  input:         { flex:1, backgroundColor:COLORS.surface2, borderRadius:RADIUS.lg, borderWidth:1, borderColor:COLORS.border, color:COLORS.text, fontSize:14, paddingHorizontal:SPACING.md, paddingVertical:SPACING.sm, maxHeight:100 },
  sendBtn:       { width:38, height:38, borderRadius:19, backgroundColor:COLORS.brand, alignItems:'center', justifyContent:'center' },
  sendBtnOff:    { opacity:0.4 },
  loginBanner:   { padding:SPACING.lg, alignItems:'center', borderTopWidth:1, borderTopColor:COLORS.border },
  loginTxt:      { color:COLORS.textMuted, fontSize:14 },
  empty:         { alignItems:'center', paddingVertical:SPACING.xxl, gap:SPACING.md },
  emptyTxt:      { color:COLORS.textMuted, fontSize:14, textAlign:'center' },
});
