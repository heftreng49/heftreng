import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import { COLORS, SPACING, RADIUS, FONT } from '../../constants/theme';

export default function ChapterReadScreen({ route, navigation }) {
  const { bookId, chapterId, chapterTitle, chapterOrder, totalChapters } = route.params;
  const [content,  setContent]  = useState('');
  const [loading,  setLoading]  = useState(true);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    firestore()
      .collection('serials').doc(bookId)
      .collection('chapters').doc(chapterId)
      .get()
      .then(doc => {
        if (doc.exists) setContent(doc.data().body || '');
      })
      .finally(() => setLoading(false));

    // Görüntülenme sayısını artır
    firestore().collection('serials').doc(bookId)
      .update({ views: firestore.FieldValue.increment(1) }).catch(() => {});
  }, [bookId, chapterId]);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.brand} />
        </TouchableOpacity>
        <View style={s.headerInfo}>
          <Text style={s.headerTitle} numberOfLines={1}>{chapterTitle}</Text>
          <Text style={s.headerSub}>
            {chapterOrder}/{totalChapters} bölüm
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator color={COLORS.brand} size="large" />
        </View>
      ) : (
        <ScrollView style={s.body}
          contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 100 }}>
          <Text style={s.content}>{content}</Text>
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:  { flex:1, backgroundColor:COLORS.background },
  center:     { flex:1, alignItems:'center', justifyContent:'center' },
  header:     { flexDirection:'row', alignItems:'center', gap:SPACING.sm, paddingHorizontal:SPACING.md, paddingVertical:SPACING.md, backgroundColor:COLORS.surface, borderBottomWidth:1, borderBottomColor:COLORS.border },
  backBtn:    { padding:SPACING.xs },
  headerInfo: { flex:1 },
  headerTitle:{ color:COLORS.text, fontWeight:FONT.bold, fontSize:16 },
  headerSub:  { color:COLORS.textMuted, fontSize:12, marginTop:1 },
  body:       { flex:1 },
  content:    { color:COLORS.text, fontSize:17, lineHeight:30, letterSpacing:0.2 },
});
