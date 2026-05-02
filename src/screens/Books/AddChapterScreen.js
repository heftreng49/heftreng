import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import { COLORS, SPACING, RADIUS, FONT } from '../../constants/theme';

export default function AddChapterScreen({ route, navigation }) {
  const { bookId, currentCount } = route.params;
  const insets = useSafeAreaInsets();
  const [title,   setTitle]   = useState(`Bölüm ${currentCount + 1}`);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!content.trim()) return Alert.alert('İçerik boş olamaz');
    setLoading(true);
    try {
      const wc = content.trim().split(/\s+/).filter(Boolean).length;
      await firestore().collection('serials').doc(bookId)
        .collection('chapters').add({
          serialId:  bookId,
          uid:       '', // yazar uid eklenebilir
          title:     title.trim() || `Bölüm ${currentCount + 1}`,
          body:      content.trim(),
          order:     currentCount + 1,
          wordCount: wc,
          ts:        firestore.FieldValue.serverTimestamp(),
        });
      await firestore().collection('serials').doc(bookId)
        .update({
          chapterCount: firestore.FieldValue.increment(1),
          updatedAt:    firestore.FieldValue.serverTimestamp(),
        });
      navigation.goBack();
    } catch (e) { Alert.alert('Hata', e.message); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.container, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <MaterialCommunityIcons name="close" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Yeni Bölüm</Text>
          <TouchableOpacity
            style={[s.saveBtn, (!content.trim() || loading) && s.saveBtnDisabled]}
            onPress={save} disabled={!content.trim() || loading}>
            {loading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={s.saveBtnTxt}>Kaydet</Text>
            }
          </TouchableOpacity>
        </View>
        <ScrollView style={s.body} keyboardShouldPersistTaps="handled">
          <TextInput style={s.titleInput} value={title} onChangeText={setTitle}
            placeholder="Bölüm başlığı" placeholderTextColor={COLORS.textMuted}
            maxLength={100} />
          <View style={s.divider} />
          <TextInput style={s.contentInput} value={content} onChangeText={setContent}
            placeholder="Bölüm içeriğini buraya yaz..."
            placeholderTextColor={COLORS.textMuted}
            multiline maxLength={10000} autoFocus />
          <Text style={s.charCount}>{content.length}/10000</Text>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:       { flex:1, backgroundColor:COLORS.background },
  header:          { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:SPACING.md, paddingVertical:SPACING.sm, borderBottomWidth:1, borderBottomColor:COLORS.border, backgroundColor:COLORS.surface },
  backBtn:         { padding:SPACING.xs },
  headerTitle:     { color:COLORS.text, fontWeight:FONT.bold, fontSize:16 },
  saveBtn:         { backgroundColor:COLORS.brand, paddingHorizontal:SPACING.lg, paddingVertical:8, borderRadius:RADIUS.full },
  saveBtnDisabled: { opacity:0.4 },
  saveBtnTxt:      { color:'#fff', fontWeight:FONT.bold, fontSize:14 },
  body:            { flex:1, padding:SPACING.lg },
  titleInput:      { color:COLORS.text, fontSize:20, fontWeight:FONT.bold, paddingVertical:SPACING.sm },
  divider:         { height:1, backgroundColor:COLORS.border, marginVertical:SPACING.sm },
  contentInput:    { color:COLORS.text, fontSize:16, lineHeight:28, minHeight:400, textAlignVertical:'top' },
  charCount:       { color:COLORS.textMuted, fontSize:12, textAlign:'right', marginTop:SPACING.sm },
});
