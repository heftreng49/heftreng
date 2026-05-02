import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

// feedSaves'ta status yok — tek liste
const TABS = [];

export default function SavedScreen({ navigation }) {
  const [tab,   setTab]   = useState('okuyacak');
  const [items, setItems] = useState([]);
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!user) return;
    // feedSaves koleksiyonu — web ile aynı
    firestore().collection('feedSaves')
      .where('uid', '==', user.uid)
      .orderBy('ts', 'desc').limit(50).get()
      .then(snap => setItems(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [tab, user]);

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.brand}/>
        </TouchableOpacity>
        <Text style={s.title}>Kaydedilenler</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tab'lar */}
      <View style={s.tabs}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key}
            style={[s.tab, tab === t.key && s.tabActive]}
            onPress={() => setTab(t.key)}>
            <Text style={[s.tabText, tab === t.key && s.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={items}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: SPACING.md, paddingBottom: 80 }}
        renderItem={({ item }) => (
          <View style={s.card}>
            <Text style={s.feedId} numberOfLines={1}>
              Gönderi: {item.feedId || item.id || ''}
            </Text>
            <Text style={s.author}>
              {item.ts?.seconds ? new Date(item.ts.seconds * 1000).toLocaleDateString('tr-TR') : ''}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <Text style={s.empty}>Bu listede içerik yok</Text>
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: COLORS.background },
  header:        { flexDirection: 'row', justifyContent: 'space-between',
                   alignItems: 'center', padding: SPACING.lg,
                   backgroundColor: COLORS.surface,
                   borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title:         { color: COLORS.text, fontWeight: 'bold', fontSize: 18 },
  tabs:          { flexDirection: 'row', backgroundColor: COLORS.surface,
                   borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab:           { flex: 1, padding: SPACING.sm, alignItems: 'center' },
  tabActive:     { borderBottomWidth: 2, borderBottomColor: COLORS.brand },
  tabText:       { color: COLORS.textSecondary, fontSize: 11 },
  tabTextActive: { color: COLORS.brand, fontWeight: 'bold' },
  card:          { backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
                   padding: SPACING.md, marginBottom: SPACING.sm },
  feedId:        { color: COLORS.text, fontSize: 14, fontWeight: 'bold' },
  author:        { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },
  empty:         { color: COLORS.textMuted, textAlign: 'center', marginTop: 40 },
});
