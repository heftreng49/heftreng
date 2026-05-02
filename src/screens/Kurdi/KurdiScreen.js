import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

export default function KurdiScreen({ navigation }) {
  const [units,    setUnits]    = useState([]);
  const [progress, setProgress] = useState({ xp: 0, streak: 0, completedUnits: {} });
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    firestore().collection('kf_units').orderBy('order').get()
      .then(snap => setUnits(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    if (user) {
      // Web'deki gibi kf_xp/kf_streak/kf_done alanları users dokümanında
      firestore().collection('users').doc(user.uid).get()
        .then(doc => {
          if (doc.exists) {
            const d = doc.data();
            setProgress({
              xp:             d.kf_xp     || 0,
              streak:         d.kf_streak || 0,
              completedUnits: d.kf_done   ? Object.fromEntries((d.kf_done).map(id => [id, true])) : {},
            });
          }
        });
    }
  }, [user]);

  const level = progress.xp < 100 ? 'Destpêk'
              : progress.xp < 300 ? 'Navîn'
              : 'Pêşketî';

  return (
    <View style={s.container}>
      {/* Başlık */}
      <View style={[s.header, { paddingTop: insets.top }]}>
        <Text style={s.title}>Kurdî Fêrbibe</Text>
        <Text style={s.subtitle}>Kürtçe Öğren</Text>
      </View>

      {/* XP / Streak / Seviye */}
      <View style={s.statsRow}>
        <View style={s.statBox}>
          <Text style={s.statValue}>{progress.xp}</Text>
          <Text style={s.statLabel}>XP</Text>
        </View>
        <View style={s.statBox}>
          <View style={{flexDirection:'row',alignItems:'center',gap:4}}><MaterialCommunityIcons name="fire" size={18} color="#f59e0b"/><Text style={s.statValue}>{progress.streak}</Text></View>
          <Text style={s.statLabel}>gün</Text>
        </View>
        <View style={s.statBox}>
          <Text style={s.statValue}>{level}</Text>
          <Text style={s.statLabel}>seviye</Text>
        </View>
      </View>

      {/* Üniteler */}
      <FlatList
        data={units}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: SPACING.md, paddingBottom: 80 }}
        renderItem={({ item: unit }) => {
          const done = progress.completedUnits?.[unit.id];
          return (
            <TouchableOpacity
              style={[s.unitCard, done && s.unitDone]}
              onPress={() => navigation.navigate('KurdiLesson', {
                unitId: unit.id, unitTitle: unit.title, unitXP: unit.xp || 10,
              })}>
              <View style={{ flex: 1 }}>
                <Text style={s.unitTitle}>{unit.title}</Text>
                <Text style={s.unitLevel}>{unit.level || 'Destpêk'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.unitXP}>+{unit.xp || 10} XP</Text>
                {done && <MaterialCommunityIcons name="check-circle" size={22} color={COLORS.success}/>}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: COLORS.background },
  header:     { backgroundColor: COLORS.surface, padding: SPACING.lg,
                borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title:      { color: COLORS.text, fontSize: 24, fontWeight: 'bold' },
  subtitle:   { color: COLORS.textSecondary, fontSize: 14, marginTop: 2 },
  statsRow:   { flexDirection: 'row', backgroundColor: COLORS.surface,
                borderBottomWidth: 1, borderBottomColor: COLORS.border },
  statBox:    { flex: 1, alignItems: 'center', padding: SPACING.md },
  statValue:  { color: COLORS.brand, fontSize: 18, fontWeight: 'bold' },
  statLabel:  { color: COLORS.textMuted, fontSize: 12 },
  unitCard:   { backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
                padding: SPACING.lg, marginBottom: SPACING.sm,
                flexDirection: 'row', alignItems: 'center',
                borderWidth: 1, borderColor: COLORS.border },
  unitDone:   { borderColor: COLORS.success, opacity: 0.8 },
  unitTitle:  { color: COLORS.text, fontSize: 16, fontWeight: 'bold' },
  unitLevel:  { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  unitXP:     { color: COLORS.brand, fontWeight: 'bold', fontSize: 14 },
});
