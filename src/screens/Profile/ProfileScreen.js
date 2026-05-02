import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  ScrollView, Alert, StatusBar, ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../utils/firebase';
import { sendInAppNotification } from '../../utils/notifications';
import { COLORS, SPACING, RADIUS, FONT } from '../../constants/theme';

export default function ProfileScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { user, profile: myProfile, signInWithGoogle, signOut, isLoggedIn } = useAuth();

  const viewingUid = route.params?.uid;
  const isOwn      = !viewingUid || viewingUid === user?.uid;
  const viewProfile = profile; // görüntülenen kullanıcının profili

  const [profile,     setProfile]     = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [posts,       setPosts]       = useState([]);
  const [activeTab,   setActiveTab]   = useState('gonderiler');
  const [loading,     setLoading]     = useState(true);

  const loadProfile = useCallback(async () => {
    const uid = viewingUid || user?.uid;
    if (!uid) { setLoading(false); return; }
    setLoading(true);
    try {
      if (isOwn && myProfile) {
        // Kendi profilimiz zaten AuthContext'te var
        setProfile(myProfile);
      } else {
        const doc = await firestore().collection('users').doc(uid).get();
        if (doc.exists) setProfile(doc.data());
      }
      const snap = await firestore().collection('feed')
        .where('uid', '==', uid)
        .orderBy('ts', 'desc').limit(20).get();
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));

      if (!isOwn && user) {
        const fDoc = await firestore()
          .collection('follows').doc(`${user.uid}_${uid}`).get();
        setIsFollowing(fDoc.exists);
      }
    } catch (e) { console.log('PROFILE_ERROR:', e); }
    finally { setLoading(false); }
  }, [viewingUid, user?.uid, isOwn, myProfile]);

  // myProfile (AuthContext) değişince kendi profilimizi güncelle
  useEffect(() => {
    if (isOwn && myProfile) setProfile(myProfile);
  }, [myProfile, isOwn]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const handleSignIn = async () => {
    try { await signInWithGoogle(); }
    catch (e) { Alert.alert('Giriş başarısız', e.message); }
  };

  const toggleFollow = async () => {
    if (!user) return;
    const uid   = viewingUid;
    const docId = `${user.uid}_${uid}`;
    if (isFollowing) {
      await firestore().collection('follows').doc(docId).delete();
      await firestore().collection('users').doc(uid)
        .update({ followerCount: firestore.FieldValue.increment(-1) });
      await firestore().collection('users').doc(user.uid)
        .update({ followingCount: firestore.FieldValue.increment(-1) }).catch(() => {});
      setIsFollowing(false);
    } else {
      await firestore().collection('follows').doc(docId).set({
        fromUid:     user.uid,
        targetUid:   uid,
        fromName:    profile?.displayName || user.displayName || '',
        fromPhoto:   profile?.photoURL    || user.photoURL    || '',
        targetName:  (viewProfile?.displayName || viewProfile?.name || ''),
        targetPhoto: (viewProfile?.photoURL || ''),
        ts: firestore.FieldValue.serverTimestamp(),
      });
      await firestore().collection('users').doc(uid)
        .update({ followerCount: firestore.FieldValue.increment(1) });
      await firestore().collection('users').doc(user.uid)
        .update({ followingCount: firestore.FieldValue.increment(1) }).catch(() => {});
      await sendInAppNotification({
        toUid: uid, type: 'follow',
        fromUser: {
          uid:   user.uid,
          name:  profile?.displayName || user.displayName || 'Kullanıcı',
          photo: profile?.photoURL    || user.photoURL    || '',
        },
      });
      setIsFollowing(true);
    }
  };

  const openChat = async () => {
    if (!user) return;
    const uid1 = user.uid, uid2 = viewingUid;
    const convId = uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
    await supabase.from('conversations').upsert({
      id: convId,
      uid1: uid1 < uid2 ? uid1 : uid2,
      uid2: uid1 < uid2 ? uid2 : uid1,
      name1: uid1 < uid2 ? (user.displayName || 'Kullanıcı') : (profile?.name || 'Kullanıcı'),
      name2: uid1 < uid2 ? (profile?.name || 'Kullanıcı') : (user.displayName || 'Kullanıcı'),
      photo1: uid1 < uid2 ? (user.photoURL || '') : (profile?.photoURL || ''),
      photo2: uid1 < uid2 ? (profile?.photoURL || '') : (user.photoURL || ''),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id', ignoreDuplicates: true });
    navigation.navigate('Chat', {
      convId, otherUid: viewingUid,
      otherName: profile?.name || 'Kullanıcı',
      otherPhoto: profile?.photoURL || '',
    });
  };

  // ── Giriş ekranı ──
  if (!isLoggedIn && isOwn) {
    return (
      <View style={s.loginBg}>
        <StatusBar backgroundColor={COLORS.brand} barStyle="light-content" />
        <View style={s.loginCard}>
          <View style={s.loginDeco1} /><View style={s.loginDeco2} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.lg }}>
            <MaterialCommunityIcons name="feather" size={22} color={COLORS.brand} />
            <Text style={s.loginLogo}>Heftreng</Text>
          </View>
          <Text style={s.loginTitle}>Merhaba!</Text>
          <Text style={s.loginSub}>
            Paylaşmak, takip etmek ve daha fazlası için giriş yap
          </Text>
          <TouchableOpacity style={s.googleBtn} onPress={handleSignIn}>
            <View style={s.googleIconBox}><Text style={s.googleIconText}>G</Text></View>
            <Text style={s.googleText}>Google ile Giriş Yap</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) return (
    <View style={[s.center, { paddingTop: insets.top }]}>
      <ActivityIndicator color={COLORS.brand} size="large" />
    </View>
  );

  const initials = (profile?.displayName || profile?.name || 'K')[0].toUpperCase();

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <StatusBar backgroundColor={COLORS.brand} barStyle="light-content" />

      {!isOwn && (
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.brand} />
          <Text style={s.backText}>Geri</Text>
        </TouchableOpacity>
      )}

      <View style={s.hero}>
        <View style={s.heroDeco1} /><View style={s.heroDeco2} />
        <View style={s.avatarWrap}>
          {profile?.photoURL
            ? <Image source={{ uri: profile.photoURL }} style={s.avatar} />
            : <View style={[s.avatar, s.avatarFallback]}>
                <Text style={s.avatarLetter}>{initials}</Text>
              </View>
          }
        </View>
        <Text style={s.name}>{profile?.displayName || profile?.name || 'Kullanıcı'}</Text>
        {profile?.email  ? <Text style={s.email}>{profile.email}</Text>  : null}
        {profile?.bio    ? <Text style={s.bio}>{profile.bio}</Text>      : null}

        <View style={s.statsRow}>
          <View style={s.stat}>
            <Text style={s.statVal}>{posts.length}</Text>
            <Text style={s.statLbl}>PAYLAŞIM</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.stat}>
            <Text style={s.statVal}>{profile?.followerCount || 0}</Text>
            <Text style={s.statLbl}>TAKİPÇİ</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.stat}>
            <Text style={s.statVal}>{profile?.followingCount || 0}</Text>
            <Text style={s.statLbl}>TAKİP</Text>
          </View>
        </View>

        <View style={s.actRow}>
          {isOwn ? (
            <>
              <TouchableOpacity style={s.profBtn}
                onPress={() => navigation.navigate('Settings')}>
                <MaterialCommunityIcons name="cog-outline" size={14} color={COLORS.brand} />
                <Text style={s.profBtnText}>Ayarlar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.profBtn} onPress={signOut}>
                <MaterialCommunityIcons name="logout" size={14} color={COLORS.error} />
                <Text style={[s.profBtnText, { color: COLORS.error }]}>Çıkış</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[s.followBtn, isFollowing && s.followBtnActive]}
                onPress={toggleFollow}>
                <Text style={[s.followBtnText, isFollowing && { color: '#fff' }]}>
                  {isFollowing ? '✓ Takiptesiniz' : 'Takip Et'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.msgBtn} onPress={openChat}>
                <MaterialCommunityIcons name="message-text" size={15} color={COLORS.text} />
                <Text style={s.msgBtnText}>Mesaj</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <View style={s.tabRow}>
        {[['gonderiler','Gönderiler','grid'],['begendikleri','Beğendikleri','heart-outline']].map(([key,label,icon]) => (
          <TouchableOpacity key={key}
            style={[s.tabBtn, activeTab === key && s.tabBtnActive]}
            onPress={() => setActiveTab(key)}>
            <MaterialCommunityIcons name={icon} size={16}
              color={activeTab === key ? COLORS.brand : COLORS.textMuted} />
            <Text style={[s.tabBtnText, activeTab === key && s.tabBtnTextActive]}>{label}</Text>
            {activeTab === key && <View style={s.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.postsSection}>
        {posts.length === 0
          ? <Text style={s.emptyText}>Henüz gönderi yok</Text>
          : posts.map(post => (
            <TouchableOpacity key={post.id} style={s.postItem}
              onPress={() => navigation.navigate('Compose', { replyTo: post })}>
              <View style={s.postBody}>
                <Text style={s.postText} numberOfLines={2}>{post.text}</Text>
                <View style={s.postMeta}>
                  <MaterialCommunityIcons name="heart" size={11} color={COLORS.textMuted} />
                  <Text style={s.postMetaText}>{post.likes || 0}</Text>
                  <MaterialCommunityIcons name="message-outline" size={11} color={COLORS.textMuted} />
                  <Text style={s.postMetaText}>{post.cmtCount || 0}</Text>
                </View>
              </View>
              {post.imgUrl ? <Image source={{ uri: post.imgUrl }} style={s.postThumb} /> : null}
            </TouchableOpacity>
          ))
        }
      </View>
      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: COLORS.background },
  center:          { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loginBg:         { flex: 1, backgroundColor: COLORS.brand, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  loginCard:       { backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.xl, width: '100%', alignItems: 'center', overflow: 'hidden', position: 'relative' },
  loginDeco1:      { position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.glow },
  loginDeco2:      { position: 'absolute', bottom: -30, left: -30, width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.glow2 },
  loginLogo:       { color: COLORS.brand, fontSize: 20, fontWeight: FONT.bold },
  loginTitle:      { color: COLORS.text, fontSize: 24, fontWeight: FONT.bold, marginBottom: SPACING.sm },
  loginSub:        { color: COLORS.textMuted, textAlign: 'center', marginBottom: SPACING.xl, lineHeight: 22, fontSize: 13 },
  googleBtn:       { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.border, padding: SPACING.md, borderRadius: RADIUS.full, gap: SPACING.sm, width: '100%', justifyContent: 'center' },
  googleIconBox:   { backgroundColor: COLORS.brand, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  googleIconText:  { color: '#fff', fontWeight: FONT.bold, fontSize: 16 },
  googleText:      { color: COLORS.text, fontSize: 15, fontWeight: FONT.bold },
  backBtn:         { flexDirection: 'row', alignItems: 'center', gap: 6, padding: SPACING.lg },
  backText:        { color: COLORS.brand, fontSize: 15 },
  hero:            { margin: SPACING.md, borderRadius: RADIUS.xl, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.borderHover, padding: SPACING.lg, alignItems: 'center', overflow: 'hidden', position: 'relative', shadowColor: COLORS.brand, shadowOpacity: 0.12, shadowOffset: { width: 0, height: 4 }, shadowRadius: 16, elevation: 4 },
  heroDeco1:       { position: 'absolute', top: -50, right: -50, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(124,58,237,0.12)' },
  heroDeco2:       { position: 'absolute', bottom: -30, left: -30, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(245,158,11,0.08)' },
  avatarWrap:      { marginBottom: SPACING.sm },
  avatar:          { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: COLORS.borderHover },
  avatarFallback:  { backgroundColor: COLORS.brand, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.brand, shadowOpacity: 0.4, shadowOffset: { width: 0, height: 8 }, shadowRadius: 20 },
  avatarLetter:    { color: '#fff', fontSize: 30, fontWeight: FONT.bold },
  name:            { color: COLORS.text, fontSize: 20, fontWeight: FONT.bold, fontStyle: 'italic', marginBottom: 2 },
  email:           { color: COLORS.textMuted, fontSize: 11, marginBottom: SPACING.xs, fontFamily: 'monospace' },
  bio:             { color: COLORS.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: SPACING.sm },
  statsRow:        { flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.md, marginTop: SPACING.md, width: '100%' },
  stat:            { flex: 1, alignItems: 'center', paddingVertical: 4 },
  statVal:         { color: COLORS.brand, fontSize: 20, fontWeight: FONT.bold, fontStyle: 'italic' },
  statLbl:         { color: COLORS.textMuted, fontSize: 9, fontWeight: FONT.bold, letterSpacing: 0.5, marginTop: 2, textTransform: 'uppercase' },
  statDivider:     { width: 1, backgroundColor: COLORS.border },
  actRow:          { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md, flexWrap: 'wrap', justifyContent: 'center' },
  profBtn:         { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: SPACING.lg, paddingVertical: 7, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.borderHover, backgroundColor: COLORS.surface },
  profBtnText:     { color: COLORS.brand, fontSize: 12, fontWeight: FONT.semibold },
  followBtn:       { paddingHorizontal: SPACING.xl, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.brand, backgroundColor: 'transparent' },
  followBtnActive: { backgroundColor: COLORS.brand, shadowColor: COLORS.brand, shadowOpacity: 0.4, shadowOffset: { width: 0, height: 4 }, shadowRadius: 14 },
  followBtnText:   { color: COLORS.brand, fontWeight: FONT.bold, fontSize: 13 },
  msgBtn:          { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: SPACING.lg, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.borderHover, backgroundColor: COLORS.surface2 },
  msgBtnText:      { color: COLORS.text, fontSize: 12, fontWeight: FONT.bold },
  tabRow:          { flexDirection: 'row', backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border, marginTop: SPACING.sm },
  tabBtn:          { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: SPACING.md, position: 'relative' },
  tabBtnActive:    {},
  tabBtnText:      { color: COLORS.textMuted, fontSize: 13 },
  tabBtnTextActive:{ color: COLORS.brand, fontWeight: FONT.bold },
  tabUnderline:    { position: 'absolute', bottom: 0, left: '15%', right: '15%', height: 2, backgroundColor: COLORS.brand, borderRadius: 2 },
  postsSection:    { padding: SPACING.md },
  postItem:        { flexDirection: 'row', gap: SPACING.sm, backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  postBody:        { flex: 1 },
  postText:        { color: COLORS.text, fontSize: 13, lineHeight: 20 },
  postMeta:        { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: SPACING.xs },
  postMetaText:    { color: COLORS.textMuted, fontSize: 10, marginRight: 6 },
  postThumb:       { width: 46, height: 46, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border },
  emptyText:       { color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.xl, fontSize: 13 },
});
