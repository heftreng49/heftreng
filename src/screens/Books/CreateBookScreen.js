import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING, RADIUS, FONT } from '../../constants/theme';

const CATEGORIES = ['Roman', 'Şiir', 'Hikaye', 'Deneme', 'Anı', 'Diğer'];
const LANGUAGES  = [{ key: 'TR', label: 'Türkçe' }, { key: 'KU', label: 'Kurdî' }, { key: 'EN', label: 'English' }];

export default function CreateBookScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();

  const [step, setStep]     = useState(1); // 1=kitap bilgisi, 2=ilk bölüm
  const [loading, setLoading] = useState(false);

  // Kitap bilgileri
  const [title,    setTitle]    = useState('');
  const [desc,     setDesc]     = useState('');
  const [category, setCategory] = useState('');
  const [lang,     setLang]     = useState('TR');

  // İlk bölüm
  const [chTitle,   setChTitle]   = useState('Bölüm 1');
  const [chContent, setChContent] = useState('');

  const createBook = async () => {
    if (!title.trim()) return Alert.alert('Başlık gerekli');
    if (!user) return Alert.alert('Giriş gerekli');
    setLoading(true);
    try {
      const bookRef = await firestore().collection('serials').add({
        title:        title.trim(),
        desc:      desc.trim(),
        genre:  category || 'Diğer',
        language:     lang,
        uid:       user.uid,
        name:      profile?.displayName || user.displayName || '?',
        photoURL:  profile?.photoURL    || user.photoURL    || '',
        coverImg:  '',
        chapterCount: chContent.trim() ? 1 : 0,
        likes:        0,
        views:        0,
        ts:        firestore.FieldValue.serverTimestamp(),
        updatedAt:    firestore.FieldValue.serverTimestamp(),
      });

      // İlk bölüm varsa ekle
      if (chContent.trim()) {
        const wc = chContent.trim().split(/\s+/).filter(Boolean).length;
        await bookRef.collection('chapters').add({
          serialId:  bookRef.id,
          uid:       user.uid,
          title:     chTitle.trim() || 'Bölüm 1',
          body:      chContent.trim(),
          order:     1,
          wordCount: wc,
          ts:        firestore.FieldValue.serverTimestamp(),
        });
      }

      Alert.alert('Kitap Oluşturuldu ✓', 'Kitabın yayında!', [
        { text: 'Tamam', onPress: () => {
          navigation.navigate('BookDetail', { bookId: bookRef.id });
        }},
      ]);
    } catch (e) {
      Alert.alert('Hata', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.container, { paddingTop: insets.top }]}>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <MaterialCommunityIcons name="close" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>
            {step === 1 ? 'Kitap Bilgileri' : 'İlk Bölüm'}
          </Text>
          {step === 1 ? (
            <TouchableOpacity
              style={[s.nextBtn, !title.trim() && s.btnDisabled]}
              onPress={() => setStep(2)}
              disabled={!title.trim()}>
              <Text style={s.nextBtnTxt}>İleri →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[s.nextBtn, loading && s.btnDisabled]}
              onPress={createBook}
              disabled={loading}>
              {loading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={s.nextBtnTxt}>Yayınla</Text>
              }
            </TouchableOpacity>
          )}
        </View>

        {/* Adım göstergesi */}
        <View style={s.steps}>
          {[1, 2].map(n => (
            <View key={n} style={[s.stepDot, step >= n && s.stepDotActive]}>
              <Text style={[s.stepNum, step >= n && s.stepNumActive]}>{n}</Text>
            </View>
          ))}
          <View style={[s.stepLine, step >= 2 && s.stepLineActive]} />
        </View>

        <ScrollView style={s.body} keyboardShouldPersistTaps="handled">

          {step === 1 && (
            <View style={s.form}>
              {/* Başlık */}
              <Text style={s.label}>Kitap Adı *</Text>
              <TextInput style={s.input} value={title} onChangeText={setTitle}
                placeholder="Kitabının adı" placeholderTextColor={COLORS.textMuted}
                maxLength={100} autoFocus />

              {/* Açıklama */}
              <Text style={s.label}>Açıklama</Text>
              <TextInput style={[s.input, s.inputTall]} value={desc} onChangeText={setDesc}
                placeholder="Kitabın kısa özeti..." placeholderTextColor={COLORS.textMuted}
                multiline maxLength={400} />

              {/* Kategori */}
              <Text style={s.label}>Kategori</Text>
              <View style={s.chipRow}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity key={c}
                    style={[s.chip, category === c && s.chipActive]}
                    onPress={() => setCategory(c)}>
                    <Text style={[s.chipTxt, category === c && s.chipTxtActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Dil */}
              <Text style={s.label}>Dil</Text>
              <View style={s.langRow}>
                {LANGUAGES.map(l => (
                  <TouchableOpacity key={l.key}
                    style={[s.langBtn, lang === l.key && s.langBtnActive]}
                    onPress={() => setLang(l.key)}>
                    <Text style={[s.langTxt, lang === l.key && s.langTxtActive]}>
                      {l.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={s.form}>
              <View style={s.chHint}>
                <MaterialCommunityIcons name="information-outline" size={16} color={COLORS.brand} />
                <Text style={s.chHintTxt}>
                  İlk bölümü şimdi ekleyebilir ya da boş bırakıp sonra ekleyebilirsin
                </Text>
              </View>

              <Text style={s.label}>Bölüm Başlığı</Text>
              <TextInput style={s.input} value={chTitle} onChangeText={setChTitle}
                placeholder="ör. Bölüm 1 — Başlangıç" placeholderTextColor={COLORS.textMuted}
                maxLength={100} />

              <Text style={s.label}>İçerik</Text>
              <TextInput style={[s.input, s.inputXTall]} value={chContent}
                onChangeText={setChContent}
                placeholder="Hikayeni buraya yaz..."
                placeholderTextColor={COLORS.textMuted}
                multiline maxLength={10000} />

              <Text style={s.charCount}>{chContent.length}/10000</Text>
            </View>
          )}

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:     { flex:1, backgroundColor:COLORS.background },
  header:        { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:SPACING.md, paddingVertical:SPACING.sm, borderBottomWidth:1, borderBottomColor:COLORS.border, backgroundColor:COLORS.surface },
  backBtn:       { padding:SPACING.xs },
  headerTitle:   { color:COLORS.text, fontWeight:FONT.bold, fontSize:16 },
  nextBtn:       { backgroundColor:COLORS.brand, paddingHorizontal:SPACING.lg, paddingVertical:8, borderRadius:RADIUS.full, minWidth:80, alignItems:'center' },
  nextBtnTxt:    { color:'#fff', fontWeight:FONT.bold, fontSize:14 },
  btnDisabled:   { opacity:0.4 },
  steps:         { flexDirection:'row', alignItems:'center', justifyContent:'center', gap:0, paddingVertical:SPACING.md, backgroundColor:COLORS.surface, borderBottomWidth:1, borderBottomColor:COLORS.border, position:'relative' },
  stepDot:       { width:28, height:28, borderRadius:14, borderWidth:2, borderColor:COLORS.border, alignItems:'center', justifyContent:'center', backgroundColor:COLORS.background, zIndex:1 },
  stepDotActive: { borderColor:COLORS.brand, backgroundColor:COLORS.brand },
  stepNum:       { color:COLORS.textMuted, fontSize:12, fontWeight:FONT.bold },
  stepNumActive: { color:'#fff' },
  stepLine:      { position:'absolute', top:'50%', left:'35%', right:'35%', height:2, backgroundColor:COLORS.border },
  stepLineActive:{ backgroundColor:COLORS.brand },
  body:          { flex:1 },
  form:          { padding:SPACING.lg, gap:SPACING.xs },
  label:         { color:COLORS.textMuted, fontSize:12, fontWeight:FONT.semibold, marginTop:SPACING.md, marginBottom:4 },
  input:         { backgroundColor:COLORS.surface, borderRadius:RADIUS.md, borderWidth:1, borderColor:COLORS.border, color:COLORS.text, fontSize:15, paddingHorizontal:SPACING.md, paddingVertical:SPACING.sm },
  inputTall:     { minHeight:90, textAlignVertical:'top' },
  inputXTall:    { minHeight:240, textAlignVertical:'top' },
  chipRow:       { flexDirection:'row', flexWrap:'wrap', gap:SPACING.xs, marginTop:4 },
  chip:          { paddingHorizontal:SPACING.md, paddingVertical:7, borderRadius:RADIUS.full, borderWidth:1, borderColor:COLORS.border, backgroundColor:COLORS.surface },
  chipActive:    { backgroundColor:COLORS.brand, borderColor:COLORS.brand },
  chipTxt:       { color:COLORS.textMuted, fontSize:13 },
  chipTxtActive: { color:'#fff', fontWeight:FONT.bold },
  langRow:       { flexDirection:'row', gap:SPACING.sm, marginTop:4 },
  langBtn:       { flex:1, paddingVertical:9, borderRadius:RADIUS.md, borderWidth:1, borderColor:COLORS.border, alignItems:'center' },
  langBtnActive: { backgroundColor:COLORS.brand, borderColor:COLORS.brand },
  langTxt:       { color:COLORS.textMuted, fontSize:13 },
  langTxtActive: { color:'#fff', fontWeight:FONT.bold },
  chHint:        { flexDirection:'row', alignItems:'flex-start', gap:SPACING.xs, backgroundColor:COLORS.surface2, borderRadius:RADIUS.md, padding:SPACING.md, marginBottom:SPACING.sm },
  chHintTxt:     { color:COLORS.textMuted, fontSize:13, flex:1, lineHeight:20 },
  charCount:     { color:COLORS.textMuted, fontSize:12, textAlign:'right', marginTop:4 },
});
