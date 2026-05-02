import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/theme';

import FeedScreen         from '../screens/Feed/FeedScreen';
import KurdiScreen        from '../screens/Kurdi/KurdiScreen';
import KurdiLessonScreen  from '../screens/Kurdi/KurdiLessonScreen';
import MessagesScreen     from '../screens/Messages/MessagesScreen';
import ChatScreen         from '../screens/Messages/ChatScreen';
import BooksScreen        from '../screens/Books/BooksScreen';
import ProfileScreen      from '../screens/Profile/ProfileScreen';
import NotifScreen        from '../screens/Notifications/NotifScreen';
import SavedScreen        from '../screens/Saved/SavedScreen';
import ComposeScreen      from '../screens/Compose/ComposeScreen';
import BookDetailScreen   from '../screens/Books/BookDetailScreen';
import ChapterReadScreen  from '../screens/Books/ChapterReadScreen';
import CreateBookScreen   from '../screens/Books/CreateBookScreen';
import AddChapterScreen   from '../screens/Books/AddChapterScreen';
import SettingsScreen     from '../screens/Settings/SettingsScreen';

const Tab   = createBottomTabNavigator();
const Stack = createStackNavigator();

function MyProfileScreen(props) {
  return <ProfileScreen {...props} route={{ ...props.route, params: undefined }} />;
}

const TABS = {
  'Yazılar':  { icon: 'view-dashboard-outline', iconActive: 'view-dashboard'  },
  'Kurdî':    { icon: 'book-open-outline',       iconActive: 'book-open'       },
  'Mesajlar': { icon: 'message-outline',         iconActive: 'message'         },
  'Kitap':    { icon: 'bookshelf',               iconActive: 'bookshelf'       },
  'Profil':   { icon: 'account-circle-outline',  iconActive: 'account-circle'  },
};

function TabNavigator() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor:  COLORS.surface,
          borderTopWidth:   1,
          borderTopColor:   COLORS.border,
          height:           62 + insets.bottom,
          paddingBottom:    insets.bottom || 8,
          paddingTop:       4,
          elevation:        12,
          shadowColor:      COLORS.brand,
          shadowOpacity:    0.15,
          shadowOffset:     { width: 0, height: -3 },
          shadowRadius:     12,
        },
        tabBarActiveTintColor:   COLORS.brand,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', letterSpacing: 0.2 },
        tabBarIcon: ({ focused, color }) => {
          const tab      = TABS[route.name];
          const iconName = focused ? tab?.iconActive : tab?.icon;
          return (
            <View style={[ts.iconWrap, focused && ts.iconWrapActive]}>
              <MaterialCommunityIcons name={iconName || 'circle'} size={24} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Yazılar"  component={FeedScreen}     />
      <Tab.Screen name="Kurdî"    component={KurdiScreen}    />
      <Tab.Screen name="Mesajlar" component={MessagesScreen} />
      <Tab.Screen name="Kitap"    component={BooksScreen}    />
      <Tab.Screen name="Profil"   component={MyProfileScreen}/>
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main"         component={TabNavigator}     />
      <Stack.Screen name="Profile"      component={ProfileScreen}    />
      <Stack.Screen name="Chat"         component={ChatScreen}       />
      <Stack.Screen name="Compose"      component={ComposeScreen}    />
      <Stack.Screen name="Notifs"       component={NotifScreen}      />
      <Stack.Screen name="Saved"        component={SavedScreen}      />
      <Stack.Screen name="KurdiLesson"  component={KurdiLessonScreen}/>
      <Stack.Screen name="BookDetail"   component={BookDetailScreen} />
      <Stack.Screen name="ChapterRead"  component={ChapterReadScreen}/>
      <Stack.Screen name="CreateBook"   component={CreateBookScreen} />
      <Stack.Screen name="AddChapter"   component={AddChapterScreen} />
      <Stack.Screen name="Settings"     component={SettingsScreen}   />
    </Stack.Navigator>
  );
}

const ts = StyleSheet.create({
  iconWrap:       { alignItems:'center', justifyContent:'center', width:44, height:30, borderRadius:15 },
  iconWrapActive: { backgroundColor:'rgba(139,92,246,0.18)' },
});
