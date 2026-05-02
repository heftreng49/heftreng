import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING, RADIUS, FONT } from '../../constants/theme';

const FILTERS = [
  { key: 'all',      label: 'Hemû'     },
  { key: 'unread',   label: 'Nexwendî' },
  { key: 'like',     label: 'Hez'      },
  { key: 'comment',  label: 'Şîrove'   },
  { key: 'follow',   label: 'Şopandin' },
];

const TYPE_ICON = {
  like:    { name: 'heart',            color: COLORS.like   },
  comment: { name: 'comment-outline',  color: COLORS.brand  },
  follow:  { name: 'account-plus',     color: '#10d9a0'     },
  save:    { name: 'bookmark-outline', color: '#fbbf24'     },
  system:  { name: 'bell-outline',     color: COLORS.textMuted },
};

export default function NotifScreen({ navigation }) {
  const [notifs,  setNotifs]  = useState([]);
  const [filter,  setFilter]  = useState('all');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    // Gerçek zamanlı listener
    const unsub = firestore()
      .collection('users').doc(user.uid)
      .collection('userNotifs')
      .orderBy('ts', 'desc').limit(60)
      .onSnapshot(snap => {
        setNotifs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
        // Görüntülenen bildirimleri okundu yap
        const batch = firestore().batch();
        snap.docs.forEach(d => {
          if (!d.data().read) batch.update(d.ref, { read: true });
        });
        batch.commit().catch(() => {});
      }, () => setLoading(false));

    return unsub;
  }, [user]);

  const filtered = notifs.filter(n => {
    if (filter === 'all')    return true;
    if (filter === 'unread') return !n.read;
    return n.type === filter;
  });

  const markAllRead = async () => {
    if (!user) return;
    const batch = firestore().batch();
    notifs.filter(n => !n.read).forEach(n => {
      batch.update(
        firestore().collection('users').doc(user.uid)
          .collection('userNotifs').doc(n.id),
        { read: true }
      );
    });
    await batch.commit();
  };

  const clearAll = () => {
    Alert.alert('Tümünü Sil', 'Tüm bildirimler silinsin mi?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive',
        onPress: async () => {
          const snap = await firestore()
            .collection('users').doc(user.uid)
            .collection('userNotifs').get();
          const batch = firestore().batch();
          snap.docs.forEach(d => batch.delete(d.ref));
          await batch.commit();
        },
      },
    ]);
  };

  const handleNotifPress = (n) => {
    if (n.type === 'follow') {
      navigation.navigate('Profile', { uid: n.fromUid });
    } else if (n.postId) {
      navigation.navigate('Main'); // ileride direkt post'a gidebilir
    }
  };

  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.brand} />
        </TouchableOpacity>
        <View>
          <Text style={s.title}>Agahdarî</Text>
          {unreadCount > 0 && (
            <Text style={s.subtitle}>{unreadCount} okunmamış</Text>
          )}
        </View>
        <View style={s.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllRead} style={s.headerBtn}>
              <MaterialCommunityIcons name="check-all" size={20} color={COLORS.brand} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={clearAll} style={s.headerBtn}>
            <MaterialCommunityIcons name="delete-outline" size={20} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filtre tab'ları */}
      <View style={s.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f.key}
            style={[s.filterTab, filter === f.key && s.filterTabActive]}
            onPress={() => setFilter(f.key)}>
            <Text style={[s.filterTxt, filter === f.key && s.filterTxtActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item: n }) => {
          const icon = TYPE_ICON[n.type] || TYPE_ICON.system;
          return (
            <TouchableOpacity
              style={[s.row, !n.read && s.rowUnread]}
              onPress={() => handleNotifPress(n)}
              activeOpacity={0.7}>
              <View style={[s.iconCircle, { backgroundColor: icon.color + '22' }]}>
                <MaterialCommunityIcons name={icon.name} size={20} color={icon.color} />
              </View>
              <View style={s.rowBody}>
                <Text style={s.rowText}>{n.message || n.text}</Text>
                <Text style={s.rowTime}>
                  {n.createdAt?.seconds ? formatTime(new Date(n.createdAt.seconds * 1000)) : n.ts?.seconds ? formatTime(new Date(n.ts.seconds * 1000)) : ''}
                </Text>
              </View>
              {!n.read && <View style={s.dot} />}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <View style={s.empty}>
              <MaterialCommunityIcons name="bell-off-outline" size={48} color={COLORS.border} />
              <Text style={s.emptyText}>Bildirim yok</Text>
            </View>
          ) : null
        }
      />
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
  container:      { flex:1, backgroundColor:COLORS.background },
  header:         { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:SPACING.md, paddingVertical:SPACING.md, backgroundColor:COLORS.surface, borderBottomWidth:1, borderBottomColor:COLORS.border },
  backBtn:        { padding:SPACING.xs },
  title:          { color:COLORS.text, fontWeight:FONT.bold, fontSize:18 },
  subtitle:       { color:COLORS.brand, fontSize:12 },
  headerActions:  { flexDirection:'row', gap:SPACING.xs },
  headerBtn:      { padding:SPACING.xs },
  filterRow:      { flexDirection:'row', backgroundColor:COLORS.surface, borderBottomWidth:1, borderBottomColor:COLORS.border, paddingHorizontal:SPACING.md, gap:SPACING.xs, paddingVertical:SPACING.xs },
  filterTab:      { paddingHorizontal:SPACING.md, paddingVertical:6, borderRadius:RADIUS.full, borderWidth:1, borderColor:COLORS.border },
  filterTabActive:{ backgroundColor:COLORS.brand, borderColor:COLORS.brand },
  filterTxt:      { color:COLORS.textMuted, fontSize:12 },
  filterTxtActive:{ color:'#fff', fontWeight:FONT.bold },
  row:            { flexDirection:'row', alignItems:'center', gap:SPACING.md, padding:SPACING.lg, borderBottomWidth:1, borderBottomColor:COLORS.border },
  rowUnread:      { backgroundColor:COLORS.surface },
  iconCircle:     { width:42, height:42, borderRadius:21, alignItems:'center', justifyContent:'center' },
  rowBody:        { flex:1 },
  rowText:        { color:COLORS.text, fontSize:14, lineHeight:20 },
  rowTime:        { color:COLORS.textMuted, fontSize:12, marginTop:2 },
  dot:            { width:8, height:8, borderRadius:4, backgroundColor:COLORS.brand },
  empty:          { alignItems:'center', marginTop:80, gap:SPACING.md },
  emptyText:      { color:COLORS.textMuted, fontSize:16 },
});
