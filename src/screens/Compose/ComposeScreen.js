import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Image, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import { launchImageLibrary } from 'react-native-image-picker';
import { uploadImage } from '../../utils/firebase';
import { sendInAppNotification } from '../../utils/notifications';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING, RADIUS, FONT } from '../../constants/theme';

// Web'deki gibi sadece 2 mod: normal paylaşım veya alıntı
// Blog pas geçildi
const MODES = [
  { key: 'feed',  label: 'Paylaşım', icon: 'pencil-outline'   },
  { key: 'quote', label: 'Alıntı',   icon: 'format-quote-open' },
];

export default function ComposeScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const replyTo = route.params?.replyTo;

  const [mode,        setMode]        = useState('feed');
  const [text,        setText]        = useState('');
  const [imageUri,    setImageUri]    = useState(null);
  const [loading,     setLoading]     = useState(false);

  // Alıntı — web'deki quotes koleksiyonuyla aynı yapı
  const [quoteText,   setQuoteText]   = useState('');
  const [quoteBook,   setQuoteBook]   = useState('');
  const [quoteAuthor, setQuoteAuthor] = useState('');

  const pickImage = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (res) => {
      if (res.assets?.[0]) setImageUri(res.assets[0].uri);
    });
  };

  // ── Normal paylaşım ──────────────────────────────────────────────
  const submitFeed = async () => {
    if (!text.trim() && !imageUri)
      return Alert.alert('Boş gönderi', 'Metin veya resim ekle');
    if (!user) return Alert.alert('Giriş gerekli');
    setLoading(true);
    try {
      let imgUrl = '';
      if (imageUri) imgUrl = await uploadImage(imageUri, 'posts');

      const postData = {
        uid:      user.uid,
        name:     profile?.displayName || user.displayName || 'Kullanıcı',
        photoURL: profile?.photoURL    || user.photoURL    || '',
        text:     text.trim(),
        imgUrl,
        type:     'feed',
        likes:    0,
        cmtCount: 0,
        saves:    0,
        ts:       firestore.FieldValue.serverTimestamp(),
      };

      // Yanıt ise
      if (replyTo) {
        postData.replyTo = {
          id:   replyTo.id,
          uid:  replyTo.uid,
          text: (replyTo.text || '').slice(0, 80),
        };
        await firestore().collection('feed').doc(replyTo.id)
          .update({ cmtCount: firestore.FieldValue.increment(1) });

        if (replyTo.uid !== user.uid) {
          await sendInAppNotification({
            toUid:    replyTo.uid,
            type:     'comment',
            fromUser: {
              uid:   user.uid,
              name:  profile?.displayName || user.displayName || 'Kullanıcı',
              photo: profile?.photoURL    || user.photoURL    || '',
            },
            extra: { postId: replyTo.id },
          });
        }
      }

      await firestore().collection('feed').add(postData);
      await firestore().collection('users').doc(user.uid)
        .update({ postCount: firestore.FieldValue.increment(1) }).catch(() => {});

      navigation.goBack();
    } catch (e) { Alert.alert('Hata', e.message); }
    finally { setLoading(false); }
  };

  // ── Alıntı — web'deki gibi ayrı 'quotes' koleksiyonu ────────────
  const submitQuote = async () => {
    if (!quoteText.trim()) return Alert.alert('Alıntı metni gerekli');
    if (!user) return Alert.alert('Giriş gerekli');
    setLoading(true);
    try {
      const quoteData = {
        uid:        user.uid,
        name:       profile?.displayName || user.displayName || 'Kullanıcı',
        photoURL:   profile?.photoURL    || user.photoURL    || '',
        quoteText:  quoteText.trim(),
        bookName:   quoteBook.trim(),
        authorName: quoteAuthor.trim(),
        likes:      0,
        saves:      0,
        ts:         firestore.FieldValue.serverTimestamp(),
      };

      // Web'deki gibi hem 'quotes' hem 'feed' koleksiyonuna yaz
      // 'feed'e yazınca akışta görünür, 'quotes'ta da ayrı saklanır
      const quoteRef = await firestore().collection('feed').add(quoteData);

      await firestore().collection('feed').add({
        ...quoteData,
        type:    'quote',
        quoteId: quoteRef.id,   // quotes koleksiyonuna referans
        text:    quoteText.trim(), // feed'de arama için
      });

      await firestore().collection('users').doc(user.uid)
        .update({ postCount: firestore.FieldValue.increment(1) }).catch(() => {});

      navigation.goBack();
    } catch (e) { Alert.alert('Hata', e.message); }
    finally { setLoading(false); }
  };

  const handleSubmit = () => {
    if (mode === 'feed')  return submitFeed();
    if (mode === 'quote') return submitQuote();
  };

  const canSubmit = mode === 'feed'
    ? (text.trim().length > 0 || !!imageUri)
    : quoteText.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.container, { paddingTop: insets.top }]}>

        {/* ── Header ── */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.cancelBtn}>
            <Text style={s.cancelText}>İptal</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>
            {replyTo ? 'Yanıtla' : mode === 'quote' ? 'Alıntı Ekle' : 'Yeni Gönderi'}
          </Text>
          <TouchableOpacity
            style={[s.postBtn, (!canSubmit || loading) && s.postBtnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit || loading}>
            {loading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={s.postBtnText}>
                  {mode === 'quote' ? 'Ekle' : 'Paylaş'}
                </Text>
            }
          </TouchableOpacity>
        </View>

        {/* Yanıt bağlamı */}
        {replyTo && (
          <View style={s.replyBanner}>
            <MaterialCommunityIcons name="reply" size={14} color={COLORS.brand} />
            <Text style={s.replyText} numberOfLines={1}>
              Yanıtlıyorsun: {replyTo.text?.slice(0, 60)}
            </Text>
          </View>
        )}

        {/* Mod seçimi — sadece yanıt değilse göster */}
        {!replyTo && (
          <View style={s.modeRow}>
            {MODES.map(m => (
              <TouchableOpacity key={m.key}
                style={[s.modeBtn, mode === m.key && s.modeBtnActive]}
                onPress={() => setMode(m.key)}>
                <MaterialCommunityIcons
                  name={m.icon} size={16}
                  color={mode === m.key ? COLORS.brand : COLORS.textMuted} />
                <Text style={[s.modeBtnText, mode === m.key && s.modeBtnTextActive]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <ScrollView style={s.body} keyboardShouldPersistTaps="handled">

          {/* ── FEED MODU ── */}
          {mode === 'feed' && (
            <View style={s.feedWrap}>
              {/* Kullanıcı avatarı */}
              <View style={s.avatarCol}>
                {(profile?.photoURL || user?.photoURL)
                  ? <Image source={{ uri: profile?.photoURL || user?.photoURL }} style={s.avatar} />
                  : <View style={[s.avatar, s.avatarFallback]}>
                      <Text style={s.avatarLetter}>
                        {(profile?.displayName || user?.displayName || 'K')[0].toUpperCase()}
                      </Text>
                    </View>
                }
                <View style={s.avatarLine} />
              </View>

              <View style={s.inputCol}>
                <Text style={s.userName}>
                  {profile?.displayName || user?.displayName || 'Kullanıcı'}
                </Text>
                <TextInput
                  style={s.mainInput}
                  value={text}
                  onChangeText={setText}
                  placeholder={replyTo ? 'Yanıtını yaz...' : 'Ne düşünüyorsun?'}
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                  maxLength={500}
                  autoFocus
                />
                {imageUri && (
                  <View style={s.imgPreviewWrap}>
                    <Image source={{ uri: imageUri }} style={s.imgPreview} resizeMode="cover" />
                    <TouchableOpacity style={s.imgRemove} onPress={() => setImageUri(null)}>
                      <MaterialCommunityIcons name="close-circle" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                )}
                <View style={s.toolRow}>
                  <TouchableOpacity style={s.toolBtn} onPress={pickImage}>
                    <MaterialCommunityIcons name="image-outline" size={22} color={COLORS.brand} />
                  </TouchableOpacity>
                  <Text style={s.charCount}>{text.length}/500</Text>
                </View>
              </View>
            </View>
          )}

          {/* ── ALINTI MODU — web'deki modal ile birebir aynı ── */}
          {mode === 'quote' && (
            <View style={s.quoteForm}>
              {/* Önizleme */}
              {quoteText.trim() ? (
                <View style={s.quotePreview}>
                  <MaterialCommunityIcons name="format-quote-open" size={24} color={COLORS.brand} />
                  <Text style={s.quotePreviewText}>{quoteText}</Text>
                  {(quoteBook || quoteAuthor) && (
                    <Text style={s.quotePreviewMeta}>
                      — {[quoteBook, quoteAuthor].filter(Boolean).join(', ')}
                    </Text>
                  )}
                </View>
              ) : null}

              {/* Alıntı metni */}
              <View style={s.fieldWrap}>
                <View style={s.fieldIcon}>
                  <MaterialCommunityIcons name="format-quote-open" size={18} color={COLORS.brand} />
                </View>
                <TextInput
                  style={[s.field, s.fieldTall]}
                  value={quoteText}
                  onChangeText={setQuoteText}
                  placeholder="Alıntı metni *"
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                  maxLength={600}
                  autoFocus
                />
              </View>

              {/* Kitap adı */}
              <View style={s.fieldWrap}>
                <View style={s.fieldIcon}>
                  <MaterialCommunityIcons name="book-open-outline" size={18} color={COLORS.textMuted} />
                </View>
                <TextInput
                  style={s.field}
                  value={quoteBook}
                  onChangeText={setQuoteBook}
                  placeholder="Kitap adı"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              {/* Yazar */}
              <View style={s.fieldWrap}>
                <View style={s.fieldIcon}>
                  <MaterialCommunityIcons name="account-outline" size={18} color={COLORS.textMuted} />
                </View>
                <TextInput
                  style={s.field}
                  value={quoteAuthor}
                  onChangeText={setQuoteAuthor}
                  placeholder="Yazar"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <Text style={s.quoteHint}>
                Alıntı hem akışta hem Kaydedilenler'de görünecek
              </Text>
            </View>
          )}

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: COLORS.background },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.surface },
  cancelBtn:        { padding: SPACING.sm },
  cancelText:       { color: COLORS.textMuted, fontSize: 15 },
  headerTitle:      { color: COLORS.text, fontWeight: FONT.bold, fontSize: 16 },
  postBtn:          { backgroundColor: COLORS.brand, paddingHorizontal: SPACING.lg, paddingVertical: 8, borderRadius: RADIUS.full, minWidth: 72, alignItems: 'center' },
  postBtnDisabled:  { opacity: 0.4 },
  postBtnText:      { color: '#fff', fontWeight: FONT.bold, fontSize: 14 },
  replyBanner:      { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.surface2, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  replyText:        { color: COLORS.textMuted, fontSize: 12, flex: 1 },
  modeRow:          { flexDirection: 'row', backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modeBtn:          { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: SPACING.md },
  modeBtnActive:    { borderBottomWidth: 2, borderBottomColor: COLORS.brand },
  modeBtnText:      { color: COLORS.textMuted, fontSize: 13 },
  modeBtnTextActive:{ color: COLORS.brand, fontWeight: FONT.bold },
  body:             { flex: 1 },

  // Feed
  feedWrap:         { flexDirection: 'row', padding: SPACING.md, gap: SPACING.sm },
  avatarCol:        { alignItems: 'center', gap: 4 },
  avatar:           { width: 44, height: 44, borderRadius: 22 },
  avatarFallback:   { backgroundColor: COLORS.brand, alignItems: 'center', justifyContent: 'center' },
  avatarLetter:     { color: '#fff', fontWeight: FONT.bold, fontSize: 18 },
  avatarLine:       { flex: 1, width: 2, backgroundColor: COLORS.border, borderRadius: 1, marginTop: 4 },
  inputCol:         { flex: 1 },
  userName:         { color: COLORS.text, fontWeight: FONT.bold, fontSize: 15, marginBottom: 4 },
  mainInput:        { color: COLORS.text, fontSize: 16, lineHeight: 24, minHeight: 100, textAlignVertical: 'top' },
  imgPreviewWrap:   { position: 'relative', marginTop: SPACING.sm },
  imgPreview:       { width: '100%', height: 200, borderRadius: RADIUS.md },
  imgRemove:        { position: 'absolute', top: 6, right: 6 },
  toolRow:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.sm, paddingTop: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border },
  toolBtn:          { padding: SPACING.xs },
  charCount:        { color: COLORS.textMuted, fontSize: 12 },

  // Alıntı
  quoteForm:        { padding: SPACING.lg, gap: SPACING.md },
  quotePreview:     { backgroundColor: COLORS.surface, borderLeftWidth: 3, borderLeftColor: COLORS.brand, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm },
  quotePreviewText: { color: COLORS.text, fontSize: 15, fontStyle: 'italic', lineHeight: 24, marginTop: 6 },
  quotePreviewMeta: { color: COLORS.textMuted, fontSize: 12, marginTop: 8, fontWeight: FONT.medium },
  fieldWrap:        { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  fieldIcon:        { paddingTop: 2 },
  field:            { flex: 1, color: COLORS.text, fontSize: 15, paddingVertical: 0 },
  fieldTall:        { minHeight: 80, textAlignVertical: 'top' },
  quoteHint:        { color: COLORS.textMuted, fontSize: 12, textAlign: 'center', marginTop: SPACING.sm },
});
