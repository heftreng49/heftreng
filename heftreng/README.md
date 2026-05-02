# Heftreng Flutter Projesi

Civaka Nivîskar — Kürtçe ve Türkçe yazı platformu

## Klasör Yapısı

```
lib/
├── core/
│   ├── theme/         # Renkler, tipografi, tema
│   └── constants/     # API anahtarları, sabitler
├── data/
│   ├── models/        # PostModel, UserModel, CommentModel...
│   └── services/      # BloggerService, FirebaseService
├── presentation/
│   ├── screens/       # Home, PostDetail, Profile, Messages...
│   └── widgets/       # PostCard, NavBar, ortak bileşenler
├── providers.dart     # AppProvider, PostProvider, AuthProvider
├── app_shell.dart     # Sekme yönetimi
└── main.dart          # Giriş noktası
```

## Kurulum Adımları

### 1. Fontları İndir
```
assets/fonts/ klasörüne ekle:
- DMSerifDisplay-Regular.ttf
- DMSerifDisplay-Italic.ttf
- DMSans-Regular.ttf
- DMSans-Medium.ttf
- DMSans-SemiBold.ttf
- DMSans-Bold.ttf
- JetBrainsMono-Regular.ttf

Google Fonts'tan indirebilirsin:
https://fonts.google.com/specimen/DM+Serif+Display
https://fonts.google.com/specimen/DM+Sans
https://fonts.google.com/specimen/JetBrains+Mono
```

### 2. Firebase Kurulumu
```bash
# FlutterFire CLI kur
dart pub global activate flutterfire_cli

# Firebase'e bağla (Firebase projeni seç)
flutterfire configure

# Bu komut lib/firebase_options.dart dosyasını oluşturur
```

### 3. main.dart güncelle
```dart
// Firebase başlatmayı güncelle:
await Firebase.initializeApp(
  options: DefaultFirebaseOptions.currentPlatform,
);
```

### 4. Blogger API Anahtarı
```
lib/core/constants/app_constants.dart dosyasında:
- blogId: Blogger blog ID'si
- bloggerApiKey: Google Cloud Console'dan API anahtarı
```

### 5. Bağımlılıkları Yükle
```bash
flutter pub get
```

### 6. Uygulamayı Çalıştır
```bash
# Debug mod
flutter run

# APK oluştur
flutter build apk --release
```

## Firebase Firestore Koleksiyonları

```
users/           → Kullanıcı profilleri
presence/        → Çevrimiçi durumu
typing/          → Yazıyor göstergesi
comments/        → Yazı yorumları
likes/           → Beğeniler
bookmarks/       → Kaydedilenler
  └── {uid}/saved/  → Kullanıcının kaydettiği yazılar
follows/         → Takip ilişkileri
notifications/   → Bildirimler
  └── {uid}/items/
conversations/   → Konuşma listesi
convMessages/    → Mesaj içerikleri
  └── {convId}/messages/
```

## Firestore Güvenlik Kuralları (firebase.rules)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /users/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == uid;
    }

    match /presence/{uid} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == uid;
    }

    match /comments/{docId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow delete: if request.auth.uid == resource.data.authorUid;
    }

    match /bookmarks/{uid}/saved/{postId} {
      allow read, write: if request.auth.uid == uid;
    }

    match /notifications/{uid}/items/{notifId} {
      allow read, write: if request.auth.uid == uid;
    }

    match /convMessages/{convId}/messages/{msgId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Özellikler

- Blogger API ile dinamik içerik
- Firebase Auth (email/şifre)
- Gerçek zamanlı yorumlar (Firestore)
- Beğeni sistemi
- Kaydetme (Bookmarks)
- Mesajlaşma (DM) + yazıyor göstergesi
- Çevrimiçi presence
- Bildirimler
- Karanlık/Aydınlık mod
- 6 renk teması (Violet, Indigo, Rose, Emerald, Amber, Sky)
- Yazı boyutu ayarı
- Türkçe tarih formatı
