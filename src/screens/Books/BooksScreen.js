import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  ScrollView, FlatList, Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';

import { COLORS, SPACING, RADIUS, FONT } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = ['Tümü','Roman','Şiir','Hikaye','Deneme','Anı','Diğer'];

export default function BooksScreen({ navigation }) {
  const [books,    setBooks]    = useState([]);
  const [cat,      setCat]      = useState('Tümü');
  const [loading,  setLoading]  = useState(true);
  const { user: me } = useAuth();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    setLoading(true);
    firestore().collection('serials')
      .orderBy('updatedAt', 'desc').limit(60).get()
      .then(snap => {
        setBooks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      })
      .catch(e => console.log('BOOKS_ERROR:', e))
      .finally(() => setLoading(false));
  }, []);

  const filtered = cat === 'Tümü'
    ? books
    : books.filter(b => b.genre === cat);

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top }}>

      {/* ── Hero banner — web'deki gibi mor gradient ── */}
      <View style={s.hero}>
        <View style={s.heroDeco1} />
        <View style={s.heroDeco2} />
        <MaterialCommunityIcons name="book-open-variant" size={32} color="#fff" style={{ marginBottom: SPACING.sm }} />
        <Text style={s.heroTitle}>Kitap Yaz</Text>
        <Text style={s.heroSub}>Yazarların kaleminden doğan eserler — bölüm bölüm oku</Text>
        <View style={s.heroBtns}>
          <TouchableOpacity style={s.heroBtnPrimary}
            onPress={() => {
              if (!me) return Alert.alert('Giriş gerekli');
              navigation.navigate('CreateBook');
            }}>
            <MaterialCommunityIcons name="pencil" size={15} color="#fff" />
            <Text style={s.heroBtnPrimaryText}>Kitap Yaz</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.heroBtnGhost}>
            <MaterialCommunityIcons name="compass-outline" size={15} color="#fff" />
            <Text style={s.heroBtnGhostText}>Keşfet</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Kategori chipları ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={s.catsWrap} contentContainerStyle={s.catsContent}>
        {CATEGORIES.map(c => (
          <TouchableOpacity key={c}
            style={[s.chip, cat === c && s.chipActive]}
            onPress={() => setCat(c)}>
            <Text style={[s.chipText, cat === c && s.chipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Kitap listesi ── */}
      <View style={s.section}>
        <View style={s.secHeader}>
          <MaterialCommunityIcons name="bookshelf" size={18} color={COLORS.brand} />
          <Text style={s.secTitle}>Tüm Kitaplar</Text>
        </View>

        {loading ? (
          <Text style={s.loadingText}>Yükleniyor...</Text>
        ) : filtered.length === 0 ? (
          <Text style={s.emptyText}>Henüz kitap yok</Text>
        ) : (
          <View style={s.grid}>
            {filtered.map(book => (
              <TouchableOpacity key={book.id} style={s.bookCard}
                onPress={() => navigation.navigate('BookDetail', { bookId: book.id })}>

                {/* Kapak */}
                <View style={s.coverWrap}>
                  {book.coverImg
                    ? <Image source={{ uri: book.coverImg }} style={s.cover} />
                    : <View style={[s.cover, s.coverFallback]}>
                        <MaterialCommunityIcons name="book-open-variant" size={28} color="rgba(255,255,255,0.5)" />
                      </View>
                  }
                  {/* Bölüm sayısı badge */}
                  <View style={s.chBadge}>
                    <Text style={s.chBadgeText}>{book.chapterCount || 0} bölüm</Text>
                  </View>
                </View>

                {/* Bilgiler */}
                <Text style={s.bookTitle} numberOfLines={2}>{book.title || 'Başlıksız'}</Text>

                {/* Yazar */}
                <View style={s.bookAuthor}>
                  {book.photoURL
                    ? <Image source={{ uri: book.photoURL }} style={s.authorAvatar} />
                    : <View style={[s.authorAvatar, s.authorAvatarFallback]}>
                        <Text style={s.authorAvatarLetter}>
                          {(book.name || 'K')[0].toUpperCase()}
                        </Text>
                      </View>
                  }
                  <Text style={s.authorName} numberOfLines={1}>
                    {book.name || 'Yazar'}
                  </Text>
                </View>

                {/* Kategori */}
                {book.genre ? (
                  <View style={s.catChip}>
                    <Text style={s.catChipText}>{book.genre}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:          { flex: 1, backgroundColor: COLORS.background },

  // Hero
  hero:               { margin: SPACING.md, borderRadius: RADIUS.xl,
                        backgroundColor: COLORS.brand, padding: SPACING.xl,
                        alignItems: 'flex-start', overflow: 'hidden',
                        position: 'relative' },
  heroDeco1:          { position: 'absolute', top: -40, right: -40,
                        width: 140, height: 140, borderRadius: 70,
                        backgroundColor: 'rgba(255,255,255,0.1)' },
  heroDeco2:          { position: 'absolute', bottom: -30, right: 60,
                        width: 90, height: 90, borderRadius: 45,
                        backgroundColor: 'rgba(244,114,182,0.25)' },
  heroTitle:          { color: '#fff', fontSize: 24, fontWeight: FONT.bold,
                        marginBottom: SPACING.xs },
  heroSub:            { color: 'rgba(255,255,255,0.8)', fontSize: 13,
                        lineHeight: 20, marginBottom: SPACING.lg },
  heroBtns:           { flexDirection: 'row', gap: SPACING.sm },
  heroBtnPrimary:     { flexDirection: 'row', alignItems: 'center', gap: 5,
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
                        paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
                        borderRadius: RADIUS.full },
  heroBtnPrimaryText: { color: '#fff', fontWeight: FONT.bold, fontSize: 13 },
  heroBtnGhost:       { flexDirection: 'row', alignItems: 'center', gap: 5,
                        borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
                        paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm,
                        borderRadius: RADIUS.full },
  heroBtnGhostText:   { color: '#fff', fontSize: 13 },

  // Kategoriler
  catsWrap:           { marginTop: SPACING.sm },
  catsContent:        { paddingHorizontal: SPACING.md, gap: SPACING.sm,
                        flexDirection: 'row' },
  chip:               { paddingHorizontal: SPACING.md, paddingVertical: 7,
                        borderRadius: RADIUS.full, borderWidth: 1,
                        borderColor: COLORS.border, backgroundColor: COLORS.surface },
  chipActive:         { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  chipText:           { color: COLORS.textMuted, fontSize: 13, fontWeight: FONT.medium },
  chipTextActive:     { color: '#fff', fontWeight: FONT.bold },

  // Bölüm başlığı
  section:            { padding: SPACING.md },
  secHeader:          { flexDirection: 'row', alignItems: 'center',
                        gap: SPACING.xs, marginBottom: SPACING.md },
  secTitle:           { color: COLORS.text, fontSize: 16, fontWeight: FONT.bold },

  // Grid
  grid:               { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  bookCard:           { width: '47%', backgroundColor: COLORS.surface,
                        borderRadius: RADIUS.lg, overflow: 'hidden',
                        borderWidth: 1, borderColor: COLORS.border,
                        shadowColor: COLORS.brand, shadowOpacity: 0.06,
                        shadowOffset: { width: 0, height: 2 }, shadowRadius: 8,
                        elevation: 2, padding: SPACING.sm },

  // Kapak
  coverWrap:          { position: 'relative', marginBottom: SPACING.sm },
  cover:              { width: '100%', height: 160, borderRadius: RADIUS.md },
  coverFallback:      { backgroundColor: COLORS.brand,
                        alignItems: 'center', justifyContent: 'center' },
  chBadge:            { position: 'absolute', top: 8, right: 8,
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        borderRadius: RADIUS.full,
                        paddingHorizontal: 8, paddingVertical: 3 },
  chBadgeText:        { color: '#fff', fontSize: 10, fontWeight: FONT.bold },

  // Kitap bilgileri
  bookTitle:          { color: COLORS.text, fontSize: 13, fontWeight: FONT.bold,
                        marginBottom: SPACING.xs, lineHeight: 18 },
  bookAuthor:         { flexDirection: 'row', alignItems: 'center',
                        gap: 5, marginBottom: SPACING.xs },
  authorAvatar:       { width: 18, height: 18, borderRadius: 9 },
  authorAvatarFallback:{ backgroundColor: COLORS.brand,
                         alignItems: 'center', justifyContent: 'center' },
  authorAvatarLetter: { color: '#fff', fontSize: 9, fontWeight: FONT.bold },
  authorName:         { color: COLORS.textMuted, fontSize: 11, flex: 1 },
  catChip:            { alignSelf: 'flex-start', backgroundColor: COLORS.surface2,
                        borderRadius: RADIUS.full, paddingHorizontal: 8,
                        paddingVertical: 3 },
  catChipText:        { color: COLORS.brand, fontSize: 10, fontWeight: FONT.semibold },

  loadingText:        { color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.xl },
  emptyText:          { color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.xl },
});
