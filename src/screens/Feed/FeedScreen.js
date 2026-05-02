import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, Image, Share, Alert, StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { sendInAppNotification } from '../../utils/notifications';
import { COLORS, SPACING, RADIUS, FONT } from '../../constants/theme';
import CommentSheet from './CommentSheet';

const PAGE = 20;

export default function FeedScreen({ navigation }) {
  const [posts,       setPosts]       = useState([]);
  const [refreshing,  setRefreshing]  = useState(false);
  const [filter,      setFilter]      = useState('all');
  const [lastDoc,     setLastDoc]     = useState(null);
  const [loadingMore,    setLoadingMore]    = useState(false);
  const [activeComment,  setActiveComment]  = useState(null); // yorum sheet'i
  const [hasMore,     setHasMore]     = useState(true);
  const unsubRef = useRef(null);
  const { user, profile } = useAuth();
  const insets = useSafeAreaInsets();

  const startListener = useCallback(() => {
    if (unsubRef.current) unsubRef.current();
    let q = firestore().collection('feed').orderBy('ts', 'desc').limit(PAGE);
    if (filter === 'trending')
      q = firestore().collection('feed').orderBy('likes', 'desc').limit(PAGE);

    unsubRef.current = q.onSnapshot(snap => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === PAGE);
    }, e => console.log('FEED_ERR:', e));
  }, [filter]);

  useEffect(() => {
    startListener();
    return () => { if (unsubRef.current) unsubRef.current(); };
  }, [startListener]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    startListener();
    setTimeout(() => setRefreshing(false), 600);
  }, [startListener]);

  const loadMore = async () => {
    if (loadingMore || !hasMore || !lastDoc) return;
    setLoadingMore(true);
    try {
      let q = firestore().collection('feed')
        .orderBy('ts', 'desc').startAfter(lastDoc).limit(PAGE);
      if (filter === 'trending')
        q = firestore().collection('feed').orderBy('likes', 'desc').startAfter(lastDoc).limit(PAGE);
      const snap = await q.get();
      setPosts(prev => [...prev, ...snap.docs.map(d => ({ id: d.id, ...d.data() }))]);
      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === PAGE);
    } finally { setLoadingMore(false); }
  };

  const toggleLike = async (post) => {
    if (!user) return Alert.alert('Giriş gerekli');
    // feedLikes koleksiyonu — web ile aynı yapı
    const likeDocId = `${post.id}_${user.uid}`;
    const likeRef   = firestore().collection('feedLikes').doc(likeDocId);
    const likeSnap  = await likeRef.get();
    const liked     = likeSnap.exists;

    // Optimistik UI
    setPosts(prev => prev.map(p => p.id !== post.id ? p : {
      ...p,
      likes: (p.likes || 0) + (liked ? -1 : 1),
      _likedByMe: !liked,
    }));

    try {
      if (liked) {
        await likeRef.delete();
        await firestore().collection('feed').doc(post.id)
          .update({ likes: firestore.FieldValue.increment(-1) });
      } else {
        await likeRef.set({
          feedId:   post.id,
          uid:      user.uid,
          name:     profile?.displayName || user.displayName || 'Kullanıcı',
          photoURL: profile?.photoURL    || user.photoURL    || '',
          ts:       firestore.FieldValue.serverTimestamp(),
        });
        await firestore().collection('feed').doc(post.id)
          .update({ likes: firestore.FieldValue.increment(1) });
        if (post.uid !== user.uid) {
          await sendInAppNotification({
            toUid: post.uid, type: 'like',
            fromUser: {
              uid:   user.uid,
              name:  profile?.displayName || user.displayName || 'Kullanıcı',
              photo: profile?.photoURL    || user.photoURL    || '',
            },
            extra: { postId: post.id },
          });
        }
      }
    } catch {
      // Geri al
      setPosts(prev => prev.map(p => p.id !== post.id ? p : {
        ...p,
        likes: (p.likes || 0) + (liked ? 1 : -1),
        _likedByMe: liked,
      }));
    }
  };

  const savePost = async (post) => {
    if (!user) return Alert.alert('Giriş gerekli');
    // feedSaves koleksiyonu — web ile aynı yapı
    const saveDocId = `${post.id}_${user.uid}`;
    const saveRef   = firestore().collection('feedSaves').doc(saveDocId);
    const saveSnap  = await saveRef.get();
    const alreadySaved = saveSnap.exists;

    if (alreadySaved) {
      await saveRef.delete();
      await firestore().collection('feed').doc(post.id)
        .update({ saves: firestore.FieldValue.increment(-1) });
      setPosts(prev => prev.map(p => p.id !== post.id ? p : {
        ...p, saves: (p.saves || 0) - 1, _savedByMe: false,
      }));
    } else {
      await saveRef.set({
        feedId: post.id,
        uid:    user.uid,
        ts:     firestore.FieldValue.serverTimestamp(),
      });
      await firestore().collection('feed').doc(post.id)
        .update({ saves: firestore.FieldValue.increment(1) });
      setPosts(prev => prev.map(p => p.id !== post.id ? p : {
        ...p, saves: (p.saves || 0) + 1, _savedByMe: true,
      }));
      Alert.alert('Kaydedildi ✓');
    }
  };

  const renderPost = ({ item: post }) => {
    const liked   = post._likedByMe ?? false;
    const saved   = post._savedByMe ?? false;
    const isQuote = post.type === 'quote';
    const time    = post.ts?.seconds ? formatTime(new Date(post.ts.seconds * 1000)) : '';

    return (
      <View style={s.card}>
        {/* Başlık */}
        <TouchableOpacity
          style={s.cardHeader}
          onPress={() => navigation.navigate('Profile', { uid: post.uid })}>
          {post.photoURL
            ? <Image source={{ uri: post.photoURL }} style={s.avatar} />
            : <View style={[s.avatar, s.avatarFb]}>
                <Text style={s.avatarL}>{(post.name||'K')[0].toUpperCase()}</Text>
              </View>
          }
          <View style={{ flex: 1, marginLeft: SPACING.sm }}>
            <Text style={s.authorName}>{post.name || 'Kullanıcı'}</Text>
            <Text style={s.time}>{time}</Text>
          </View>
          {isQuote && (
            <View style={s.badge}>
              <MaterialCommunityIcons name="format-quote-open" size={11} color={COLORS.brand} />
              <Text style={s.badgeTxt}>Alıntı</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* İçerik */}
        {isQuote ? (
          <View style={s.quoteBlock}>
            <MaterialCommunityIcons name="format-quote-open" size={20} color={COLORS.brand} />
            <Text style={s.quoteText}>{post.quoteText || post.text}</Text>
            {(post.bookName || post.authorName) && (
              <Text style={s.quoteMeta}>
                — {[post.bookName, post.authorName].filter(Boolean).join(', ')}
              </Text>
            )}
          </View>
        ) : (
          <>
            {post.replyTo && (
              <View style={s.replyContext}>
                <MaterialCommunityIcons name="reply" size={12} color={COLORS.textMuted} />
                <Text style={s.replyContextText} numberOfLines={1}>{post.replyTo.text}</Text>
              </View>
            )}
            {post.text ? <Text style={s.content}>{post.text}</Text> : null}
            {post.imgUrl
              ? <Image source={{ uri: post.imgUrl }} style={s.postImg} resizeMode="cover" />
              : null
            }
          </>
        )}

        {/* Aksiyonlar */}
        <View style={s.actions}>
          <TouchableOpacity style={s.actionBtn} onPress={() => toggleLike(post)}>
            <MaterialCommunityIcons
              name={liked ? 'heart' : 'heart-outline'} size={20}
              color={liked ? COLORS.like : COLORS.textMuted} />
            <Text style={[s.actionTxt, liked && { color: COLORS.like }]}>{post.likes || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.actionBtn}
            onPress={() => setActiveComment(post)}>
            <MaterialCommunityIcons name="comment-outline" size={20} color={COLORS.textMuted} />
            <Text style={s.actionTxt}>{post.cmtCount || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.actionBtn} onPress={() => savePost(post)}>
            <MaterialCommunityIcons
              name={saved ? 'bookmark' : 'bookmark-outline'} size={20}
              color={saved ? COLORS.brand : COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={s.actionBtn}
            onPress={() => Share.share({ message: `${post.quoteText || post.text}\n\n— Heftreng` })}>
            <MaterialCommunityIcons name="share-outline" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={s.container}>
      <StatusBar backgroundColor={COLORS.brand} barStyle="light-content" />
      <View style={[s.header, { paddingTop: insets.top + SPACING.sm }]}>
        <Text style={s.logo}>Heftreng</Text>
        <View style={s.headerRight}>
          <TouchableOpacity onPress={() => navigation.navigate('Notifs')} style={s.headerBtn}>
            <MaterialCommunityIcons name="bell-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => user ? navigation.navigate('Compose', {}) : Alert.alert('Giriş gerekli')}
            style={s.headerBtn}>
            <MaterialCommunityIcons name="pencil-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.filters}>
        {[['all','Yazılar'],['following','Takip'],['trending','Trend']].map(([key,label]) => (
          <TouchableOpacity key={key}
            style={[s.filterTab, filter === key && s.filterTabActive]}
            onPress={() => setFilter(key)}>
            <Text style={[s.filterTxt, filter === key && s.filterTxtActive]}>{label}</Text>
            {filter === key && <View style={s.filterLine} />}
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={posts}
        keyExtractor={i => i.id}
        renderItem={renderPost}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
            tintColor={COLORS.brand} colors={[COLORS.brand]} />
        }
        ListFooterComponent={loadingMore
          ? <Text style={s.loadMore}>Yükleniyor...</Text> : null}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: SPACING.xs }}
        ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
        ListEmptyComponent={!refreshing
          ? <View style={s.empty}>
              <MaterialCommunityIcons name="pencil-box-outline" size={48} color={COLORS.border} />
              <Text style={s.emptyTxt}>Henüz gönderi yok</Text>
            </View>
          : null
        }
      />
      {/* Yorum Sheet */}
      {activeComment && (
        <CommentSheet
          post={activeComment}
          onClose={() => setActiveComment(null)}
        />
      )}
    </View>
  );
}

function formatTime(d) {
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 60)    return 'şimdi';
  if (s < 3600)  return `${Math.floor(s/60)}d`;
  if (s < 86400) return `${Math.floor(s/3600)}s`;
  return `${Math.floor(s/86400)}g`;
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.background },
  header:         { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:SPACING.lg, paddingBottom:SPACING.sm, backgroundColor:COLORS.brand },
  logo:           { color:'#fff', fontSize:20, fontWeight:FONT.bold },
  headerRight:    { flexDirection:'row', gap:SPACING.xs },
  headerBtn:      { padding:SPACING.xs },
  filters:        { flexDirection:'row', backgroundColor:COLORS.surface, borderBottomWidth:1, borderBottomColor:COLORS.border },
  filterTab:      { flex:1, alignItems:'center', paddingVertical:SPACING.md, position:'relative' },
  filterTabActive:{},
  filterTxt:      { color:COLORS.textMuted, fontSize:14, fontWeight:FONT.medium },
  filterTxtActive:{ color:COLORS.brand, fontWeight:FONT.bold },
  filterLine:     { position:'absolute', bottom:0, left:'10%', right:'10%', height:2, backgroundColor:COLORS.brand, borderRadius:2 },
  card:           { backgroundColor:COLORS.surface, marginHorizontal:SPACING.md, borderRadius:RADIUS.lg, padding:SPACING.md, shadowColor:'#6B4EFF', shadowOpacity:0.06, shadowOffset:{width:0,height:2}, shadowRadius:8, elevation:2 },
  cardHeader:     { flexDirection:'row', alignItems:'center', marginBottom:SPACING.sm },
  avatar:         { width:42, height:42, borderRadius:21 },
  avatarFb:       { backgroundColor:COLORS.brand, alignItems:'center', justifyContent:'center' },
  avatarL:        { color:'#fff', fontWeight:FONT.bold, fontSize:18 },
  authorName:     { color:COLORS.text, fontWeight:FONT.bold, fontSize:15 },
  time:           { color:COLORS.textMuted, fontSize:12, marginTop:1 },
  badge:          { flexDirection:'row', alignItems:'center', gap:3, backgroundColor:'rgba(124,58,237,0.12)', paddingHorizontal:8, paddingVertical:3, borderRadius:RADIUS.full },
  badgeTxt:       { color:COLORS.brand, fontSize:10, fontWeight:FONT.bold },
  content:        { color:COLORS.text, fontSize:15, lineHeight:24, marginBottom:SPACING.sm },
  postImg:        { width:'100%', height:200, borderRadius:RADIUS.md, marginBottom:SPACING.sm },
  replyContext:   { flexDirection:'row', alignItems:'center', gap:4, backgroundColor:COLORS.surface2, borderRadius:RADIUS.sm, padding:SPACING.xs, marginBottom:SPACING.xs },
  replyContextText:{ color:COLORS.textMuted, fontSize:12, flex:1 },
  quoteBlock:     { backgroundColor:COLORS.surface2, borderLeftWidth:3, borderLeftColor:COLORS.brand, borderRadius:RADIUS.md, padding:SPACING.md, marginBottom:SPACING.sm },
  quoteText:      { color:COLORS.text, fontSize:15, lineHeight:24, fontStyle:'italic', marginTop:4 },
  quoteMeta:      { color:COLORS.textMuted, fontSize:12, marginTop:8, fontWeight:FONT.medium },
  actions:        { flexDirection:'row', alignItems:'center', gap:SPACING.lg, paddingTop:SPACING.sm, borderTopWidth:1, borderTopColor:COLORS.border, marginTop:SPACING.xs },
  actionBtn:      { flexDirection:'row', alignItems:'center', gap:4 },
  actionTxt:      { color:COLORS.textMuted, fontSize:13 },
  empty:          { alignItems:'center', marginTop:80, gap:SPACING.md },
  emptyTxt:       { color:COLORS.textMuted, fontSize:16 },
  loadMore:       { color:COLORS.textMuted, textAlign:'center', padding:SPACING.lg },
});
