import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  FlatList, TextInput, ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { supabase } from '../../utils/firebase';
import { COLORS, SPACING, RADIUS, FONT } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

export default function MessagesScreen({ navigation }) {
  const [convs,    setConvs]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const { user: me } = useAuth();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!me) { setLoading(false); return; }
    loadConversations();

    // Gerçek zamanlı güncelleme
    const sub = supabase
      .channel('convs-' + me.uid)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'conversations',
      }, () => loadConversations())
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, [me]);

  const loadConversations = async () => {
    if (!me) return;
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`uid1.eq.${me.uid},uid2.eq.${me.uid}`)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (data) setConvs(data);
    setLoading(false);
  };

  const getOtherInfo = (conv) => {
    const isUid1 = conv.uid1 === me?.uid;
    return {
      uid:   isUid1 ? conv.uid2   : conv.uid1,
      name:  isUid1 ? conv.name2  : conv.name1,
      photo: isUid1 ? conv.photo2 : conv.photo1,
      unread: isUid1 ? (conv.unread1 || 0) : (conv.unread2 || 0),
    };
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60)    return 'şimdi';
    if (diff < 3600)  return `${Math.floor(diff / 60)}d`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}s`;
    return `${Math.floor(diff / 86400)}g`;
  };

  const filtered = convs.filter(c => {
    if (!search) return true;
    const other = getOtherInfo(c);
    return (other.name || '').toLowerCase().includes(search.toLowerCase());
  });

  if (!me) return (
    <View style={[s.center, { paddingTop: insets.top }]}>
      <MaterialCommunityIcons name="message-lock-outline" size={48} color={COLORS.border} />
      <Text style={s.emptyTitle}>Giriş Gerekli</Text>
      <Text style={s.emptySub}>Mesajlarını görmek için giriş yap</Text>
    </View>
  );

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + SPACING.md }]}>
        <Text style={s.title}>Mesajlar</Text>
        <TouchableOpacity style={s.newBtn}
          onPress={() => navigation.navigate('Profile', {})}>
          <MaterialCommunityIcons name="pencil-plus-outline" size={22} color={COLORS.brand} />
        </TouchableOpacity>
      </View>

      {/* Arama */}
      <View style={s.searchWrap}>
        <MaterialCommunityIcons name="magnify" size={18} color={COLORS.textMuted} />
        <TextInput
          style={s.searchInp}
          value={search}
          onChangeText={setSearch}
          placeholder="Ara..."
          placeholderTextColor={COLORS.textMuted}
        />
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.brand} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i.id?.toString()}
          contentContainerStyle={{ paddingBottom: 80 }}
          renderItem={({ item: conv }) => {
            const other = getOtherInfo(conv);
            const hasUnread = other.unread > 0;
            return (
              <TouchableOpacity
                style={[s.convRow, hasUnread && s.convRowUnread]}
                onPress={() => navigation.navigate('Chat', {
                  convId:     conv.id,
                  otherUid:   other.uid,
                  otherName:  other.name  || 'Kullanıcı',
                  otherPhoto: other.photo || '',
                })}>
                {/* Avatar */}
                {other.photo
                  ? <Image source={{ uri: other.photo }} style={s.avatar} />
                  : <View style={[s.avatar, s.avatarFallback]}>
                      <Text style={s.avatarLetter}>
                        {(other.name || 'K')[0].toUpperCase()}
                      </Text>
                    </View>
                }
                {/* İçerik */}
                <View style={s.convInfo}>
                  <View style={s.convTop}>
                    <Text style={[s.convName, hasUnread && s.convNameBold]}>
                      {other.name || 'Kullanıcı'}
                    </Text>
                    <Text style={s.convTime}>{formatTime(conv.updated_at)}</Text>
                  </View>
                  <View style={s.convBottom}>
                    <Text style={[s.convLast, hasUnread && s.convLastBold]}
                      numberOfLines={1}>
                      {conv.last_message || ''}
                    </Text>
                    {hasUnread && (
                      <View style={s.badge}>
                        <Text style={s.badgeTxt}>{other.unread}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={s.center}>
              <MaterialCommunityIcons name="message-outline" size={48} color={COLORS.border} />
              <Text style={s.emptyTitle}>Henüz mesaj yok</Text>
              <Text style={s.emptySub}>Birine profil sayfasından mesaj at</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.background },
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center',
                  padding: SPACING.xl },
  header:       { flexDirection: 'row', alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md,
                  backgroundColor: COLORS.surface,
                  borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title:        { color: COLORS.text, fontSize: 20, fontWeight: FONT.bold },
  newBtn:       { padding: SPACING.xs },
  searchWrap:   { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
                  margin: SPACING.md, backgroundColor: COLORS.surface2,
                  borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border,
                  paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  searchInp:    { flex: 1, color: COLORS.text, fontSize: 14 },
  convRow:      { flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
                  padding: SPACING.lg, borderBottomWidth: 1,
                  borderBottomColor: COLORS.border },
  convRowUnread:{ backgroundColor: COLORS.surface2 },
  avatar:       { width: 50, height: 50, borderRadius: 25 },
  avatarFallback:{ backgroundColor: COLORS.brand,
                  alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: '#fff', fontWeight: FONT.bold, fontSize: 18 },
  convInfo:     { flex: 1 },
  convTop:      { flexDirection: 'row', justifyContent: 'space-between',
                  marginBottom: 4 },
  convName:     { color: COLORS.text, fontSize: 15, fontWeight: FONT.medium },
  convNameBold: { fontWeight: FONT.bold },
  convTime:     { color: COLORS.textMuted, fontSize: 11 },
  convBottom:   { flexDirection: 'row', alignItems: 'center',
                  justifyContent: 'space-between' },
  convLast:     { color: COLORS.textMuted, fontSize: 13, flex: 1 },
  convLastBold: { color: COLORS.text2, fontWeight: FONT.medium },
  badge:        { backgroundColor: COLORS.brand, borderRadius: RADIUS.full,
                  minWidth: 20, height: 20, alignItems: 'center',
                  justifyContent: 'center', paddingHorizontal: 5 },
  badgeTxt:     { color: '#fff', fontSize: 11, fontWeight: FONT.bold },
  emptyTitle:   { color: COLORS.text2, fontSize: 16, fontWeight: FONT.bold,
                  marginTop: SPACING.md },
  emptySub:     { color: COLORS.textMuted, fontSize: 13, marginTop: SPACING.xs,
                  textAlign: 'center' },
});
