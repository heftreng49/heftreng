import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING, RADIUS, FONT } from '../../constants/theme';

export default function BookDetailScreen({ route, navigation }) {
  const { bookId } = route.params;
  const [book,     setBook]     = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const { user, profile } = useAuth();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    firestore().collection('serials').doc(bookId).get()
      .then(doc => { if (doc.exists) setBook({ id: doc.id, ...doc.data() }); });

    firestore().collection('serials').doc(bookId)
      .collection('chapters').orderBy('order', 'asc').get()
      .then(snap => setChapters(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .finally(() => setLoading(false));
  }, [bookId]);

  const addChapter = async () => {
    if (!user || book?.uid !== user.uid)
      return Alert.alert('Sadece yazar bölüm ekleyebilir');
    navigation.navigate('AddChapter', { bookId, currentCount: chapters.length });
  };

  if (loading) return (
    <View style={[s.center, { paddingTop: insets.top }]}>
      <ActivityIndicator color={COLORS.brand} size="large" />
    </View>
  );

  if (!book) return (
    <View style={[s.center, { paddingTop: insets.top }]}>
      <Text style={{ color: COLORS.textMuted }}>Kitap bulunamadı</Text>
    </View>
  );

  const isAuthor = user?.uid === book.uid;

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <View style={[s.topBar, { paddingTop: insets.top + SPACING.sm }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.brand} />
        </TouchableOpacity>
        {isAuthor && (
          <TouchableOpacity style={s.addChBtn} onPress={addChapter}>
            <MaterialCommunityIcons name="plus" size={18} color="#fff" />
            <Text style={s.addChTxt}>Bölüm Ekle</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={s.heroWrap}>
        {book.coverImg
          ? <Image source={{ uri: book.coverImg }} style={s.cover} resizeMode="cover" />
          : <View style={[s.cover, s.coverFallback]}>
              <MaterialCommunityIcons name="book-open-variant" size={48} color="rgba(255,255,255,0.4)" />
            </View>
        }
        <View style={s.heroInfo}>
          <Text style={s.bookTitle}>{book.title || 'Başlıksız'}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Profile', { uid: book.uid })}>
            <Text style={s.bookAuthor}>{book.name || 'Yazar'}</Text>
          </TouchableOpacity>
          {book.genre && (
            <View style={s.catChip}>
              <Text style={s.catChipText}>{book.genre}</Text>
            </View>
          )}
          <View style={s.metaRow}>
            <Text style={s.metaTxt}>{chapters.length} Bölüm</Text>
            {book.language && <Text style={s.metaTxt}>• {book.language}</Text>}
            {book.views  ? <Text style={s.metaTxt}>• {book.views} görüntülenme</Text> : null}
          </View>
        </View>
      </View>

      {book.desc ? (
        <View style={s.descWrap}>
          <Text style={s.descTitle}>Hakkında</Text>
          <Text style={s.desc}>{book.desc}</Text>
        </View>
      ) : null}

      <View style={s.chaptersWrap}>
        <Text style={s.sectionTitle}>Bölümler</Text>
        {chapters.length === 0
          ? (
            <View style={s.emptyChapters}>
              <MaterialCommunityIcons name="book-open-outline" size={36} color={COLORS.border} />
              <Text style={s.empty}>Henüz bölüm eklenmemiş</Text>
              {isAuthor && (
                <TouchableOpacity style={s.addFirstBtn} onPress={addChapter}>
                  <Text style={s.addFirstTxt}>İlk bölümü ekle</Text>
                </TouchableOpacity>
              )}
            </View>
          )
          : chapters.map((ch, i) => (
            <TouchableOpacity key={ch.id} style={s.chapterRow}
              onPress={() => navigation.navigate('ChapterRead', {
                bookId,
                chapterId:     ch.id,
                chapterTitle:  ch.title || `Bölüm ${i + 1}`,
                chapterOrder:  i + 1,
                totalChapters: chapters.length,
              })}>
              <View style={s.chNum}>
                <Text style={s.chNumTxt}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.chTitle}>{ch.title || `Bölüm ${i + 1}`}</Text>
                {ch.summary ? <Text style={s.chSub} numberOfLines={1}>{ch.summary}</Text> : null}
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))
        }
      </View>
      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:    { flex:1, backgroundColor:COLORS.background },
  center:       { flex:1, alignItems:'center', justifyContent:'center' },
  topBar:       { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:SPACING.md, paddingBottom:SPACING.sm, backgroundColor:COLORS.surface },
  backBtn:      { padding:SPACING.xs },
  addChBtn:     { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:COLORS.brand, paddingHorizontal:SPACING.md, paddingVertical:7, borderRadius:RADIUS.full },
  addChTxt:     { color:'#fff', fontSize:13, fontWeight:FONT.bold },
  heroWrap:     { flexDirection:'row', gap:SPACING.lg, padding:SPACING.lg, backgroundColor:COLORS.surface, borderBottomWidth:1, borderBottomColor:COLORS.border },
  cover:        { width:110, height:160, borderRadius:RADIUS.lg },
  coverFallback:{ backgroundColor:COLORS.brand, alignItems:'center', justifyContent:'center' },
  heroInfo:     { flex:1, justifyContent:'center', gap:SPACING.xs },
  bookTitle:    { color:COLORS.text, fontSize:18, fontWeight:FONT.bold, lineHeight:26 },
  bookAuthor:   { color:COLORS.brand, fontSize:13, fontWeight:FONT.medium },
  catChip:      { alignSelf:'flex-start', backgroundColor:COLORS.surface2, borderRadius:RADIUS.full, paddingHorizontal:SPACING.sm, paddingVertical:3 },
  catChipText:  { color:COLORS.brand, fontSize:11, fontWeight:FONT.bold },
  metaRow:      { flexDirection:'row', gap:6, flexWrap:'wrap', marginTop:4 },
  metaTxt:      { color:COLORS.textMuted, fontSize:12 },
  descWrap:     { margin:SPACING.lg, padding:SPACING.lg, backgroundColor:COLORS.surface, borderRadius:RADIUS.lg, borderWidth:1, borderColor:COLORS.border },
  descTitle:    { color:COLORS.textMuted, fontSize:11, fontWeight:FONT.bold, letterSpacing:1, textTransform:'uppercase', marginBottom:SPACING.sm },
  desc:         { color:COLORS.text, fontSize:14, lineHeight:22 },
  chaptersWrap: { paddingHorizontal:SPACING.lg },
  sectionTitle: { color:COLORS.text, fontSize:16, fontWeight:FONT.bold, marginBottom:SPACING.md },
  emptyChapters:{ alignItems:'center', gap:SPACING.sm, paddingVertical:SPACING.xl },
  empty:        { color:COLORS.textMuted, textAlign:'center' },
  addFirstBtn:  { backgroundColor:COLORS.brand, paddingHorizontal:SPACING.xl, paddingVertical:9, borderRadius:RADIUS.full, marginTop:SPACING.sm },
  addFirstTxt:  { color:'#fff', fontWeight:FONT.bold },
  chapterRow:   { flexDirection:'row', alignItems:'center', gap:SPACING.md, backgroundColor:COLORS.surface, borderRadius:RADIUS.lg, borderWidth:1, borderColor:COLORS.border, padding:SPACING.md, marginBottom:SPACING.sm },
  chNum:        { width:36, height:36, borderRadius:RADIUS.md, backgroundColor:COLORS.surface2, alignItems:'center', justifyContent:'center' },
  chNumTxt:     { color:COLORS.brand, fontWeight:FONT.bold, fontSize:14 },
  chTitle:      { color:COLORS.text, fontSize:14, fontWeight:FONT.semibold },
  chSub:        { color:COLORS.textMuted, fontSize:12, marginTop:2 },
});
