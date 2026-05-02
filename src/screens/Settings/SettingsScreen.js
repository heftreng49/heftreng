import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING, RADIUS, FONT } from '../../constants/theme';

export default function SettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, profile, signOut, isLoggedIn } = useAuth();

  const handleSignOut = () => {
    Alert.alert('Çıkış Yap', 'Emin misin?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: signOut },
    ]);
  };

  const Row = ({ icon, label, onPress, right, danger }) => (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.7}>
      <MaterialCommunityIcons
        name={icon} size={22}
        color={danger ? COLORS.error : COLORS.brand}
        style={s.rowIcon}
      />
      <Text style={[s.rowLabel, danger && { color: COLORS.error }]}>{label}</Text>
      {right !== undefined
        ? right
        : <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textMuted} />
      }
    </TouchableOpacity>
  );

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.brand} />
        </TouchableOpacity>
        <Text style={s.title}>Ayarlar</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Profil kartı */}
      {isLoggedIn && (
        <TouchableOpacity
          style={s.profileCard}
          onPress={() => navigation.navigate('Profile', { uid: user.uid })}>
          <View style={s.profileAvatar}>
            <Text style={s.profileAvatarLetter}>
              {(profile?.displayName || user?.displayName || 'K')[0].toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.profileName}>
              {profile?.displayName || user?.displayName || 'Kullanıcı'}
            </Text>
            <Text style={s.profileEmail}>{user?.email || ''}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
      )}

      <View style={s.section}>
        <Text style={s.sectionLabel}>İÇERİK</Text>
        <Row icon="bell-outline"     label="Bildirimler"
          onPress={() => navigation.navigate('Notifs')} />
        <Row icon="bookmark-outline" label="Kaydedilenler"
          onPress={() => navigation.navigate('Saved')} />
      </View>

      <View style={s.section}>
        <Text style={s.sectionLabel}>UYGULAMA</Text>
        <Row icon="information-outline" label="Hakkında" right={<View />}
          onPress={() => Alert.alert('Heftreng', 'Sürüm 1.0.0')} />
      </View>

      {isLoggedIn && (
        <View style={s.section}>
          <Row icon="logout" label="Çıkış Yap"
            danger onPress={handleSignOut} right={<View />} />
        </View>
      )}

      {!isLoggedIn && (
        <View style={s.section}>
          <Row icon="login" label="Giriş Yap"
            onPress={() => navigation.navigate('Profil')} right={<View />} />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:         { flex: 1, backgroundColor: COLORS.background },
  header:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn:           { padding: SPACING.xs },
  title:             { color: COLORS.text, fontSize: 18, fontWeight: FONT.bold },
  profileCard:       { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, margin: SPACING.md, backgroundColor: COLORS.surface, borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.borderHover },
  profileAvatar:     { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.brand, alignItems: 'center', justifyContent: 'center' },
  profileAvatarLetter:{ color: '#fff', fontSize: 22, fontWeight: FONT.bold },
  profileName:       { color: COLORS.text, fontSize: 16, fontWeight: FONT.bold },
  profileEmail:      { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  section:           { marginTop: SPACING.md },
  sectionLabel:      { color: COLORS.textMuted, fontSize: 10, fontWeight: FONT.bold, letterSpacing: 1, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.xs },
  row:               { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rowIcon:           { marginRight: SPACING.md },
  rowLabel:          { flex: 1, color: COLORS.text, fontSize: 16 },
});
