import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  FlatList, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { supabase } from '../../utils/firebase';
import { COLORS, SPACING, RADIUS, FONT } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

export default function ChatScreen({ route, navigation }) {
  const { convId, otherUid, otherName, otherPhoto } = route.params;
  const [messages, setMessages] = useState([]);
  const [text,     setText]     = useState('');
  const [loading,  setLoading]  = useState(true);
  const flatRef     = useRef(null);
  const presUnsubRef = useRef(null);
  const [otherOnline, setOtherOnline] = useState(false);
  const [otherSeen,   setOtherSeen]   = useState(null);
  const { user: me } = useAuth();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadMessages();
    markRead();

    // presence — diğer kullanıcının çevrimiçi durumunu dinle
    presUnsubRef.current = firestore()
      .collection('presence').doc(otherUid)
      .onSnapshot(doc => {
        if (doc.exists) {
          setOtherOnline(doc.data().online === true);
          setOtherSeen(doc.data().lastSeen?.toDate?.() || null);
        }
      });

    // kendi presence'ımızı yaz
    if (me) {
      firestore().collection('presence').doc(me.uid)
        .set({ online: true, lastSeen: firestore.FieldValue.serverTimestamp(), uid: me.uid },
             { merge: true });
    }

    const sub = supabase
      .channel(`chat-${convId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conv_id=eq.${convId}`,
      }, payload => {
        setMessages(prev => [...prev, payload.new]);
        setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
        markRead();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
      if (presUnsubRef.current) presUnsubRef.current();
      // offline yap
      if (me) {
        firestore().collection('presence').doc(me.uid)
          .update({ online: false, lastSeen: firestore.FieldValue.serverTimestamp() })
          .catch(() => {});
      }
    };
  }, [convId]);

  const loadMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conv_id', convId)
      .order('created_at', { ascending: true })
      .limit(100);
    if (data) setMessages(data);
    setLoading(false);
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 100);
  };

  const markRead = async () => {
    if (!me) return;
    const { data: conv } = await supabase
      .from('conversations').select('uid1,uid2').eq('id', convId).single();
    if (!conv) return;
    const field = conv.uid1 === me.uid ? 'unread1' : 'unread2';
    await supabase.from('conversations').update({ [field]: 0 }).eq('id', convId);
  };

  const sendMessage = async () => {
    if (!text.trim() || !me) return;
    const content = text.trim();
    setText('');

    // Mesaj ekle
    await supabase.from('messages').insert({
      conv_id:      convId,
      sender_uid:   me.uid,
      sender_name:  me.displayName || 'Kullanıcı',
      sender_photo: me.photoURL || '',
      content,
      created_at:   new Date().toISOString(),
    });

    // Konuşma son mesajını güncelle + karşı taraf unread artır
    const { data: conv } = await supabase
      .from('conversations').select('uid1,uid2,unread1,unread2').eq('id', convId).single();
    if (conv) {
      const isUid1    = conv.uid1 === me.uid;
      const otherField = isUid1 ? 'unread2' : 'unread1';
      const otherVal   = isUid1 ? (conv.unread2 || 0) + 1 : (conv.unread1 || 0) + 1;
      await supabase.from('conversations').update({
        last_message: content,
        updated_at:   new Date().toISOString(),
        [otherField]: otherVal,
      }).eq('id', convId);
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item: msg, index }) => {
    const isMe = msg.sender_uid === me?.uid;
    const prevMsg = messages[index - 1];
    const showAvatar = !isMe && (!prevMsg || prevMsg.sender_uid !== msg.sender_uid);

    return (
      <View style={[s.msgRow, isMe ? s.msgRowMe : s.msgRowThem]}>
        {!isMe && (
          showAvatar
            ? (msg.sender_photo
                ? <Image source={{ uri: msg.sender_photo }} style={s.msgAvatar} />
                : <View style={[s.msgAvatar, s.msgAvatarFallback]}>
                    <Text style={s.msgAvatarLetter}>
                      {(msg.sender_name || 'K')[0].toUpperCase()}
                    </Text>
                  </View>
              )
            : <View style={s.msgAvatarGhost} />
        )}
        <View style={[s.msgBubble, isMe ? s.msgBubbleMe : s.msgBubbleThem]}>
          <Text style={[s.msgText, isMe ? s.msgTextMe : s.msgTextThem]}>
            {msg.content}
          </Text>
          <Text style={[s.msgTime, isMe ? s.msgTimeMe : s.msgTimeThem]}>
            {formatTime(msg.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}>

      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + SPACING.sm }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.brand} />
        </TouchableOpacity>

        {otherPhoto
          ? <Image source={{ uri: otherPhoto }} style={s.headerAvatar} />
          : <View style={[s.headerAvatar, s.headerAvatarFallback]}>
              <Text style={s.headerAvatarLetter}>
                {(otherName || 'K')[0].toUpperCase()}
              </Text>
            </View>
        }

        <TouchableOpacity style={s.headerInfo}
          onPress={() => navigation.navigate('Profile', { uid: otherUid })}>
          <Text style={s.headerName}>{otherName || 'Kullanıcı'}</Text>
          <Text style={[s.headerSub, otherOnline && { color: '#10d9a0' }]}>
            {otherOnline ? '● çevrimiçi' : otherSeen ? `son görülme: ${formatTime(otherSeen)}` : 'Profili gör'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={s.headerBtn}>
          <MaterialCommunityIcons name="dots-vertical" size={22} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Mesajlar */}
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={i => i.id?.toString() || Math.random().toString()}
        renderItem={renderMessage}
        contentContainerStyle={s.msgList}
        onLayout={() => flatRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          !loading ? (
            <View style={s.emptyChat}>
              <MaterialCommunityIcons name="message-outline" size={40} color={COLORS.border} />
              <Text style={s.emptyChatText}>Henüz mesaj yok</Text>
              <Text style={s.emptyChatSub}>İlk mesajı sen gönder!</Text>
            </View>
          ) : null
        }
      />

      {/* Input */}
      <View style={[s.inputWrap, { paddingBottom: insets.bottom + SPACING.sm }]}>
        <TextInput
          style={s.input}
          value={text}
          onChangeText={setText}
          placeholder="Mesaj yaz..."
          placeholderTextColor={COLORS.textMuted}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[s.sendBtn, !text.trim() && s.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!text.trim()}>
          <MaterialCommunityIcons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function formatTime(d) {
  if (!d) return '';
  const sec = (Date.now() - d.getTime()) / 1000;
  if (sec < 60)    return `${Math.floor(sec)}sn önce`;
  if (sec < 3600)  return `${Math.floor(sec/60)}d önce`;
  if (sec < 86400) return `${Math.floor(sec/3600)}s önce`;
  return `${Math.floor(sec/86400)}g önce`;
}

const s = StyleSheet.create({
  container:           { flex: 1, backgroundColor: COLORS.background },
  header:              { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
                         paddingHorizontal: SPACING.md, paddingBottom: SPACING.md,
                         backgroundColor: COLORS.surface,
                         borderBottomWidth: 1, borderBottomColor: COLORS.borderHover },
  backBtn:             { padding: SPACING.xs },
  headerAvatar:        { width: 38, height: 38, borderRadius: 19 },
  headerAvatarFallback:{ backgroundColor: COLORS.brand,
                         alignItems: 'center', justifyContent: 'center' },
  headerAvatarLetter:  { color: '#fff', fontWeight: FONT.bold, fontSize: 15 },
  headerInfo:          { flex: 1 },
  headerName:          { color: COLORS.text, fontSize: 15, fontWeight: FONT.bold },
  headerSub:           { color: COLORS.textMuted, fontSize: 11, marginTop: 1 },
  headerBtn:           { padding: SPACING.xs },
  msgList:             { padding: SPACING.md, gap: 3, flexGrow: 1 },
  msgRow:              { flexDirection: 'row', alignItems: 'flex-end',
                         gap: SPACING.xs, maxWidth: '80%', marginBottom: 3 },
  msgRowMe:            { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  msgRowThem:          { alignSelf: 'flex-start' },
  msgAvatar:           { width: 26, height: 26, borderRadius: 13 },
  msgAvatarFallback:   { backgroundColor: COLORS.brand,
                         alignItems: 'center', justifyContent: 'center' },
  msgAvatarLetter:     { color: '#fff', fontSize: 10, fontWeight: FONT.bold },
  msgAvatarGhost:      { width: 26 },
  msgBubble:           { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
                         borderRadius: RADIUS.lg, maxWidth: 260 },
  msgBubbleMe:         { backgroundColor: COLORS.brand, borderBottomRightRadius: 4 },
  msgBubbleThem:       { backgroundColor: COLORS.surface2, borderBottomLeftRadius: 4,
                         borderWidth: 1, borderColor: COLORS.border },
  msgText:             { fontSize: 15, lineHeight: 22 },
  msgTextMe:           { color: '#fff' },
  msgTextThem:         { color: COLORS.text },
  msgTime:             { fontSize: 10, marginTop: 3 },
  msgTimeMe:           { color: 'rgba(255,255,255,0.65)', textAlign: 'right' },
  msgTimeThem:         { color: COLORS.textMuted },
  inputWrap:           { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm,
                         paddingHorizontal: SPACING.md, paddingTop: SPACING.sm,
                         backgroundColor: COLORS.surface,
                         borderTopWidth: 1, borderTopColor: COLORS.border },
  input:               { flex: 1, backgroundColor: COLORS.surface2,
                         borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border,
                         color: COLORS.text, fontSize: 15,
                         paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
                         maxHeight: 120 },
  sendBtn:             { width: 42, height: 42, borderRadius: 21,
                         backgroundColor: COLORS.brand,
                         alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled:     { opacity: 0.4 },
  emptyChat:           { alignItems: 'center', justifyContent: 'center',
                         padding: SPACING.xxl, flex: 1 },
  emptyChatText:       { color: COLORS.textMuted, fontSize: 15, marginTop: SPACING.md },
  emptyChatSub:        { color: COLORS.textMuted, fontSize: 13, marginTop: 4 },
});
