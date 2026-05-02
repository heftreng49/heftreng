import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, FlatList, ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING, RADIUS, FONT } from '../../constants/theme';

const TABS = [
  { key: 'dersler', label: 'Dersler',  icon: 'map-marker-path'     },
  { key: 'ferheng', label: 'Ferheng',  icon: 'book-alphabet'       },
  { key: 'reziman', label: 'Rêziman',  icon: 'format-list-bulleted' },
  { key: 'ezber',   label: 'Ezber',    icon: 'cards-outline'       },
];

// Statik gramer içeriği (web'deki gibi)
const GRAM = {
  alpha: { title: 'Kurmancî Alfabesi', rows: [
    ['Ê ê','uzun e','sêv (elma)'], ['Î î','uzun i','silav'],
    ['Û û','uzun u','û (ve)'],     ['Ş ş','ş','şîn (mavi)'],
    ['Ç ç','ç','çawa (nasıl)'],    ['X x','hırıltılı h','xweş'],
    ['W w','v/w arası','wî (ona)'],
  ]},
  pron: { title: 'Kişi Zamirleri', rows: [
    ['Ben','Ez'], ['Sen','Tu'], ['O','Ew'],
    ['Biz','Em'], ['Siz','Hûn'], ['Onlar','Ew'],
  ]},
  nums: { title: 'Sayılar — Jimare', rows: [
    ['1','Yek'],['2','Du'],['3','Sê'],['4','Çar'],['5','Pênc'],
    ['6','Şeş'],['7','Heft'],['8','Heşt'],['9','Neh'],['10','Deh'],
    ['20','Bîst'],['100','Sed'],['1000','Hezar'],
  ]},
  fiil: { title: '"Bûn" — Olmak', rows: [
    ['Ez','im'],['Tu','yî'],['Ew','e/ye'],['Em','in'],['Hûn','in'],
  ]},
};
const GRAM_TABS = [
  { key:'alpha', label:'Alfabe' }, { key:'pron', label:'Zamirler' },
  { key:'nums',  label:'Sayılar'}, { key:'fiil', label:'Fiiller'  },
];

export default function KurdiLessonScreen({ navigation }) {
  const [tab,        setTab]        = useState('dersler');
  const [gramTab,    setGramTab]    = useState('alpha');
  const [units,      setUnits]      = useState([]);     // kf_units
  const [lessons,    setLessons]    = useState([]);     // kf_lessons
  const [vocab,      setVocab]      = useState([]);     // kf_words / kf_vocab
  const [progress,   setProgress]   = useState({ xp:0, streak:0, done:[] });
  const [loading,    setLoading]    = useState(true);
  const [dictSearch, setDictSearch] = useState('');
  const [selUnit,    setSelUnit]    = useState(null);   // seçili ünite
  const [ezberIdx,   setEzberIdx]   = useState(0);     // ezber kart indexi
  const [ezberFlip,  setEzberFlip]  = useState(false);
  const { user: me, profile } = useAuth();
  const insets = useSafeAreaInsets();

  // ── Veri yükle ───────────────────────────────────────────────
  useEffect(() => {
    const loads = [
      // kf_units — Kürtçe üniteleri
      firestore().collection('kf_units').orderBy('order').get()
        .then(s => setUnits(s.docs.map(d => ({ id: d.id, ...d.data() })))),

      // kf_vocab — kelime hazinesi
      firestore().collection('kf_vocab').limit(200).get()
        .then(s => setVocab(s.docs.map(d => ({ id: d.id, ...d.data() })))),
    ];

    // Kullanıcı ilerleme — users dokümanından kf_ alanları
    if (me) {
      loads.push(
        firestore().collection('users').doc(me.uid).get()
          .then(doc => {
            if (doc.exists) {
              const d = doc.data();
              setProgress({
                xp:     d.kf_xp     || 0,
                streak: d.kf_streak || 0,
                done:   d.kf_done   || [],
              });
            }
          })
      );
    }

    Promise.all(loads).finally(() => setLoading(false));
  }, [me]);

  // ── Ünite seçilince derslerini yükle ─────────────────────────
  const loadLessons = useCallback(async (unitId) => {
    setSelUnit(unitId);
    const snap = await firestore().collection('kf_lessons')
      .where('unitId', '==', unitId)
      .orderBy('order').get();
    setLessons(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, []);

  // ── Ders tamamla — users dokümanını güncelle ─────────────────
  const completeLesson = async (lessonId, xpAmt = 10) => {
    if (!me || progress.done.includes(lessonId)) return;
    const newDone = [...progress.done, lessonId];
    const newXp   = progress.xp + xpAmt;
    setProgress(p => ({ ...p, xp: newXp, done: newDone }));
    await firestore().collection('users').doc(me.uid).update({
      kf_xp:    firestore.FieldValue.increment(xpAmt),
      kf_done:  firestore.FieldValue.arrayUnion(lessonId),
    });
  };

  const level = progress.xp < 100 ? 'Destpêk'
              : progress.xp < 300 ? 'Navîn' : 'Pêşketî';

  const filteredVocab = vocab.filter(v =>
    !dictSearch ||
    (v.kur||'').toLowerCase().includes(dictSearch.toLowerCase()) ||
    (v.tr||'').toLowerCase().includes(dictSearch.toLowerCase())
  );

  // ── Ezber kartı ──────────────────────────────────────────────
  const ezberWords = vocab.length > 0 ? vocab : [];
  const curEzber   = ezberWords[ezberIdx % Math.max(ezberWords.length, 1)];

  if (loading) return (
    <View style={[s.container, { alignItems:'center', justifyContent:'center' }]}>
      <ActivityIndicator color={COLORS.brand} size="large" />
    </View>
  );

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + SPACING.sm }]}>
        <View style={s.headerLeft}>
          <MaterialCommunityIcons name="book-open-variant" size={22} color={COLORS.brand} />
          <Text style={s.headerTitle}>Kurdî Fêr</Text>
        </View>
        <Text style={s.headerSub}>Kurmancî öğren</Text>
      </View>

      {/* Tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabsScroll}
        contentContainerStyle={s.tabsCont}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key}
            style={[s.tab, tab === t.key && s.tabActive]}
            onPress={() => setTab(t.key)}>
            <MaterialCommunityIcons name={t.icon} size={15}
              color={tab === t.key ? '#fff' : COLORS.textMuted} />
            <Text style={[s.tabTxt, tab === t.key && s.tabTxtActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex:1 }}>

        {/* ══ DERSLER ══ */}
        {tab === 'dersler' && (
          <View>
            {/* XP / Streak / Seviye */}
            <View style={s.xpStrip}>
              <MaterialCommunityIcons name="lightning-bolt" size={26} color="#fbbf24" />
              <View style={{ flex:1 }}>
                <View style={s.xpRow}>
                  <Text style={s.xpLevel}>{level}</Text>
                  <Text style={s.xpNum}>{progress.xp} XP  •  🔥 {progress.streak} gün</Text>
                </View>
                <View style={s.xpBar}>
                  <View style={[s.xpFill, { width: `${Math.min((progress.xp % 100), 100)}%` }]} />
                </View>
              </View>
            </View>

            {/* Ünite listesi — kf_units */}
            <View style={s.section}>
              <Text style={s.secTitle}>Üniteler</Text>
              {units.length === 0
                ? <Text style={s.emptyTxt}>Henüz ünite eklenmemiş</Text>
                : units.map(unit => {
                    const doneCount = (progress.done || [])
                      .filter(id => id.startsWith(unit.id)).length;
                    const isDone = progress.done?.includes(unit.id);
                    return (
                      <TouchableOpacity key={unit.id}
                        style={[s.unitCard, isDone && s.unitDone]}
                        onPress={() => loadLessons(unit.id)}>
                        <View style={[s.unitIcon, { backgroundColor: (unit.color||COLORS.brand)+'22' }]}>
                          <Text style={{ fontSize:22 }}>{unit.icon||'📖'}</Text>
                        </View>
                        <View style={{ flex:1 }}>
                          <Text style={s.unitName}>{unit.nameTr || unit.ttl || unit.title || unit.id}</Text>
                          {unit.nameKu ? <Text style={s.unitNameKu}>{unit.nameKu}</Text> : null}
                          <Text style={s.unitMeta}>{unit.level||'destpêk'}  •  +{unit.xp||10} XP</Text>
                        </View>
                        {isDone
                          ? <MaterialCommunityIcons name="check-circle" size={22} color={COLORS.success} />
                          : <MaterialCommunityIcons name="chevron-right" size={22} color={COLORS.textMuted} />
                        }
                      </TouchableOpacity>
                    );
                  })
              }
            </View>

            {/* Seçili ünite dersleri — kf_lessons */}
            {selUnit && lessons.length > 0 && (
              <View style={s.section}>
                <Text style={s.secTitle}>Dersler</Text>
                {lessons.map(les => {
                  const done = progress.done?.includes(les.id);
                  return (
                    <TouchableOpacity key={les.id}
                      style={[s.lesCard, done && s.lesDone]}
                      onPress={() => !done && completeLesson(les.id, les.xp||10)}>
                      <View style={{ flex:1 }}>
                        <Text style={s.lesName}>{les.nameTr || les.ttl || les.id}</Text>
                        {les.nameKu ? <Text style={s.lesNameKu}>{les.nameKu}</Text> : null}
                        <Text style={s.lesMeta}>{les.tip||''}  •  +{les.xp||10} XP</Text>
                      </View>
                      {done
                        ? <MaterialCommunityIcons name="check-circle" size={20} color={COLORS.success} />
                        : <Text style={s.startBtn}>Başla →</Text>
                      }
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* ══ FERHENG (Sözlük) — kf_vocab ══ */}
        {tab === 'ferheng' && (
          <View style={s.section}>
            <View style={s.searchWrap}>
              <MaterialCommunityIcons name="magnify" size={18} color={COLORS.textMuted} />
              <TextInput style={s.searchInp}
                value={dictSearch} onChangeText={setDictSearch}
                placeholder="Kürtçe veya Türkçe ara..."
                placeholderTextColor={COLORS.textMuted} />
            </View>
            {filteredVocab.length === 0
              ? <Text style={s.emptyTxt}>
                  {vocab.length === 0 ? 'kf_vocab koleksiyonu boş' : 'Sonuç yok'}
                </Text>
              : filteredVocab.map((v, i) => (
                <View key={v.id||i} style={s.vocabCard}>
                  <View style={s.vocabKu}>
                    <Text style={s.vocabKuTxt}>{v.kur || v.ku || ''}</Text>
                    {v.kp ? <Text style={s.vocabPron}>[{v.kp}]</Text> : null}
                  </View>
                  <MaterialCommunityIcons name="arrow-right" size={16} color={COLORS.textMuted} />
                  <Text style={s.vocabTr}>{v.tr || ''}</Text>
                </View>
              ))
            }
          </View>
        )}

        {/* ══ RÊZIMAN (Gramer) — statik ══ */}
        {tab === 'reziman' && (
          <View style={s.section}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              style={{ marginBottom: SPACING.md }}
              contentContainerStyle={{ gap: SPACING.xs, flexDirection:'row' }}>
              {GRAM_TABS.map(gt => (
                <TouchableOpacity key={gt.key}
                  style={[s.gramTab, gramTab===gt.key && s.gramTabActive]}
                  onPress={() => setGramTab(gt.key)}>
                  <Text style={[s.gramTabTxt, gramTab===gt.key && s.gramTabTxtActive]}>
                    {gt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {GRAM[gramTab] && (
              <View style={s.gramCard}>
                <Text style={s.gramTitle}>{GRAM[gramTab].title}</Text>
                {GRAM[gramTab].rows.map((row, i) => (
                  <View key={i} style={[s.gramRow, i%2===0 && { backgroundColor: COLORS.surface2 }]}>
                    {row.map((cell, j) => (
                      <Text key={j} style={[s.gramCell, j===0 && s.gramCellBold]}>{cell}</Text>
                    ))}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ══ EZBER (Kelime Kartları) ══ */}
        {tab === 'ezber' && (
          <View style={s.section}>
            {ezberWords.length === 0
              ? <Text style={s.emptyTxt}>kf_vocab koleksiyonunda kelime yok</Text>
              : (
                <>
                  <Text style={s.ezberCount}>{ezberIdx % ezberWords.length + 1} / {ezberWords.length}</Text>
                  <TouchableOpacity style={s.ezberCard} onPress={() => setEzberFlip(f => !f)}>
                    <MaterialCommunityIcons name="cards-outline" size={24} color={COLORS.brand} style={{ marginBottom:SPACING.sm }} />
                    <Text style={s.ezberWord}>
                      {ezberFlip
                        ? (curEzber?.tr || '')
                        : (curEzber?.kur || curEzber?.ku || '')}
                    </Text>
                    {!ezberFlip && curEzber?.kp
                      ? <Text style={s.ezberPron}>[{curEzber.kp}]</Text>
                      : null}
                    <Text style={s.ezberHint}>{ezberFlip ? 'Kürtçesi' : 'Türkçesi'} için dokun</Text>
                  </TouchableOpacity>
                  <View style={s.ezberNav}>
                    <TouchableOpacity style={s.ezberBtn}
                      onPress={() => { setEzberIdx(i => Math.max(0, i-1)); setEzberFlip(false); }}>
                      <MaterialCommunityIcons name="chevron-left" size={28} color={COLORS.brand} />
                    </TouchableOpacity>
                    <TouchableOpacity style={s.ezberBtn}
                      onPress={() => { setEzberIdx(i => i+1); setEzberFlip(false); }}>
                      <MaterialCommunityIcons name="chevron-right" size={28} color={COLORS.brand} />
                    </TouchableOpacity>
                  </View>
                </>
              )
            }
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:     { flex:1, backgroundColor:COLORS.background },
  header:        { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:SPACING.lg, paddingBottom:SPACING.sm, backgroundColor:COLORS.surface, borderBottomWidth:1, borderBottomColor:COLORS.border },
  headerLeft:    { flexDirection:'row', alignItems:'center', gap:8 },
  headerTitle:   { color:COLORS.text, fontSize:20, fontWeight:FONT.bold },
  headerSub:     { color:COLORS.textMuted, fontSize:13 },
  tabsScroll:    { backgroundColor:COLORS.surface, borderBottomWidth:1, borderBottomColor:COLORS.border },
  tabsCont:      { paddingHorizontal:SPACING.md, paddingVertical:SPACING.xs, gap:SPACING.xs, flexDirection:'row' },
  tab:           { flexDirection:'row', alignItems:'center', gap:5, paddingHorizontal:SPACING.md, paddingVertical:7, borderRadius:RADIUS.full, backgroundColor:COLORS.surface2 },
  tabActive:     { backgroundColor:COLORS.brand },
  tabTxt:        { color:COLORS.textMuted, fontSize:13, fontWeight:FONT.medium },
  tabTxtActive:  { color:'#fff', fontWeight:FONT.bold },
  xpStrip:       { flexDirection:'row', alignItems:'center', gap:SPACING.md, margin:SPACING.md, backgroundColor:COLORS.surface, borderRadius:RADIUS.lg, padding:SPACING.md, borderWidth:1, borderColor:COLORS.border },
  xpRow:         { flexDirection:'row', justifyContent:'space-between', marginBottom:6 },
  xpLevel:       { color:COLORS.brand, fontWeight:FONT.bold, fontSize:14 },
  xpNum:         { color:COLORS.textMuted, fontSize:13 },
  xpBar:         { height:6, backgroundColor:COLORS.surface2, borderRadius:3 },
  xpFill:        { height:6, backgroundColor:COLORS.brand, borderRadius:3 },
  section:       { padding:SPACING.md },
  secTitle:      { color:COLORS.text, fontWeight:FONT.bold, fontSize:16, marginBottom:SPACING.md },
  emptyTxt:      { color:COLORS.textMuted, textAlign:'center', marginTop:SPACING.xl },
  unitCard:      { flexDirection:'row', alignItems:'center', gap:SPACING.md, backgroundColor:COLORS.surface, borderRadius:RADIUS.lg, padding:SPACING.md, marginBottom:SPACING.sm, borderWidth:1, borderColor:COLORS.border },
  unitDone:      { borderColor:'#10d9a0', opacity:0.85 },
  unitIcon:      { width:46, height:46, borderRadius:RADIUS.md, alignItems:'center', justifyContent:'center' },
  unitName:      { color:COLORS.text, fontWeight:FONT.bold, fontSize:15 },
  unitNameKu:    { color:COLORS.brand, fontSize:12, marginTop:1 },
  unitMeta:      { color:COLORS.textMuted, fontSize:12, marginTop:2 },
  lesCard:       { flexDirection:'row', alignItems:'center', backgroundColor:COLORS.surface, borderRadius:RADIUS.md, padding:SPACING.md, marginBottom:SPACING.xs, borderWidth:1, borderColor:COLORS.border },
  lesDone:       { opacity:0.6 },
  lesName:       { color:COLORS.text, fontWeight:FONT.semibold, fontSize:14 },
  lesNameKu:     { color:COLORS.brand, fontSize:12 },
  lesMeta:       { color:COLORS.textMuted, fontSize:12, marginTop:2 },
  startBtn:      { color:COLORS.brand, fontWeight:FONT.bold, fontSize:13 },
  searchWrap:    { flexDirection:'row', alignItems:'center', gap:SPACING.sm, backgroundColor:COLORS.surface, borderRadius:RADIUS.lg, borderWidth:1, borderColor:COLORS.border, paddingHorizontal:SPACING.md, paddingVertical:SPACING.sm, marginBottom:SPACING.md },
  searchInp:     { flex:1, color:COLORS.text, fontSize:14 },
  vocabCard:     { flexDirection:'row', alignItems:'center', backgroundColor:COLORS.surface, borderRadius:RADIUS.md, padding:SPACING.md, marginBottom:6, gap:SPACING.sm },
  vocabKu:       { flex:1 },
  vocabKuTxt:    { color:COLORS.text, fontWeight:FONT.bold, fontSize:15 },
  vocabPron:     { color:COLORS.textMuted, fontSize:12 },
  vocabTr:       { flex:1, color:COLORS.textMuted, fontSize:14 },
  gramTab:       { paddingHorizontal:SPACING.md, paddingVertical:7, borderRadius:RADIUS.full, borderWidth:1, borderColor:COLORS.border },
  gramTabActive: { backgroundColor:COLORS.brand, borderColor:COLORS.brand },
  gramTabTxt:    { color:COLORS.textMuted, fontSize:13 },
  gramTabTxtActive:{ color:'#fff', fontWeight:FONT.bold },
  gramCard:      { backgroundColor:COLORS.surface, borderRadius:RADIUS.lg, borderWidth:1, borderColor:COLORS.border, overflow:'hidden' },
  gramTitle:     { color:COLORS.brand, fontWeight:FONT.bold, fontSize:14, padding:SPACING.md, borderBottomWidth:1, borderBottomColor:COLORS.border },
  gramRow:       { flexDirection:'row', paddingHorizontal:SPACING.md, paddingVertical:10 },
  gramCell:      { flex:1, color:COLORS.text, fontSize:14 },
  gramCellBold:  { fontWeight:FONT.bold, color:COLORS.brand },
  ezberCount:    { color:COLORS.textMuted, textAlign:'center', fontSize:13, marginBottom:SPACING.md },
  ezberCard:     { backgroundColor:COLORS.surface, borderRadius:RADIUS.xl, borderWidth:1, borderColor:COLORS.borderHover, padding:SPACING.xxl||32, alignItems:'center', minHeight:200, justifyContent:'center', shadowColor:COLORS.brand, shadowOpacity:0.1, shadowOffset:{width:0,height:4}, shadowRadius:16, elevation:4 },
  ezberWord:     { color:COLORS.text, fontSize:32, fontWeight:FONT.bold, textAlign:'center', marginBottom:8 },
  ezberPron:     { color:COLORS.textMuted, fontSize:16, marginBottom:8 },
  ezberHint:     { color:COLORS.textMuted, fontSize:13, marginTop:SPACING.md },
  ezberNav:      { flexDirection:'row', justifyContent:'center', gap:SPACING.xl, marginTop:SPACING.lg },
  ezberBtn:      { padding:SPACING.md, backgroundColor:COLORS.surface, borderRadius:RADIUS.full, borderWidth:1, borderColor:COLORS.border },
});
