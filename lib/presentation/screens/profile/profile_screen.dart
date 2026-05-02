import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../widgets/common/common_widgets.dart';
import '../auth/auth_screen.dart';

// ══ PROFİL EKRANI ══

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _editMode = false;
  final _nameCtrl = TextEditingController();
  final _bioCtrl = TextEditingController();

  @override
  void dispose() {
    _nameCtrl.dispose();
    _bioCtrl.dispose();
    super.dispose();
  }

  void _openEdit(AuthProvider auth) {
    _nameCtrl.text = auth.user?.displayName ?? '';
    _bioCtrl.text = auth.user?.bio ?? '';
    setState(() => _editMode = true);
  }

  void _saveEdit(AuthProvider auth) async {
    await auth.updateProfile(
      displayName: _nameCtrl.text.trim(),
      bio: _bioCtrl.text.trim(),
    );
    setState(() => _editMode = false);
  }

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    final auth = context.watch<AuthProvider>();

    if (!auth.isLoggedIn) {
      return _buildLoginPrompt(context, primary);
    }

    final user = auth.user!;

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 14),
      child: Column(
        children: [
          const SizedBox(height: 22),

          // ── Profil hero — .prof-hero ──
          GlassCard(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 20),
            borderColor: HeftrengColors.borderHover,
            child: Stack(
              children: [
                // Arka plan efekti
                Positioned(
                  top: -60,
                  right: -60,
                  child: Container(
                    width: 180,
                    height: 180,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: RadialGradient(
                        colors: [
                          primary.withOpacity(0.25),
                          Colors.transparent,
                        ],
                      ),
                    ),
                  ),
                ),

                Column(
                  children: [
                    // Avatar
                    GestureDetector(
                      onTap: () {}, // fotoğraf değiştirme
                      child: HeftrengAvatar(
                        photoUrl: user.photoUrl,
                        initials: user.initials,
                        size: 76,
                      ),
                    ),

                    const SizedBox(height: 12),

                    // İsim
                    Text(
                      user.displayName,
                      style: HeftrengTextStyles.serif(
                        size: 21,
                        color: HeftrengColors.txt,
                      ),
                    ),

                    // Email
                    Text(
                      user.email,
                      style: HeftrengTextStyles.mono(
                        size: 11,
                        color: HeftrengColors.muted,
                      ),
                    ),

                    // Bio
                    if (user.bio != null && user.bio!.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Text(
                        user.bio!,
                        style: HeftrengTextStyles.sans(
                          size: 13,
                          color: HeftrengColors.muted,
                          lineHeight: 1.6,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ],

                    const SizedBox(height: 14),

                    // İstatistikler — .prof-stats
                    Container(
                      padding: const EdgeInsets.only(top: 14),
                      decoration: const BoxDecoration(
                        border: Border(
                          top: BorderSide(color: HeftrengColors.border, width: 1),
                        ),
                      ),
                      child: Row(
                        children: [
                          _StatCol(value: user.postCount.toString(), label: 'YAZI'),
                          _StatCol(value: user.followerCount.toString(), label: 'TAKİPÇİ'),
                          _StatCol(value: user.followingCount.toString(), label: 'TAKİP'),
                        ],
                      ),
                    ),

                    const SizedBox(height: 14),

                    // Aksiyon butonları
                    Wrap(
                      spacing: 7,
                      children: [
                        _ProfBtn(
                          icon: Icons.edit_rounded,
                          label: 'Düzenle',
                          onTap: () => _openEdit(auth),
                        ),
                        _ProfBtn(
                          icon: Icons.share_rounded,
                          label: 'Paylaş',
                          onTap: () {},
                        ),
                        _ProfBtn(
                          icon: Icons.logout_rounded,
                          label: 'Çıkış',
                          onTap: () => auth.signOut(),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),

          // ── Düzenleme formu — .prof-edit-inline ──
          if (_editMode) ...[
            const SizedBox(height: 12),
            GlassCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'PROFİLİ DÜZENLE',
                    style: HeftrengTextStyles.mono(
                      size: 10,
                      color: HeftrengColors.muted,
                      letterSpacing: 1,
                    ).copyWith(fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 10),

                  _EditField(
                    label: 'İSİM',
                    controller: _nameCtrl,
                  ),
                  const SizedBox(height: 10),
                  _EditField(
                    label: 'BİYOGRAFİ',
                    controller: _bioCtrl,
                    maxLines: 3,
                  ),
                  const SizedBox(height: 12),

                  Row(
                    children: [
                      Expanded(
                        child: HeftrengButton(
                          label: 'Kaydet',
                          onTap: () => _saveEdit(auth),
                          isLoading: auth.isLoading,
                        ),
                      ),
                      const SizedBox(width: 8),
                      HeftrengButton(
                        label: 'İptal',
                        isPrimary: false,
                        onTap: () => setState(() => _editMode = false),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],

          // ── Tema ayarları ──
          const SizedBox(height: 12),
          _buildSettings(context, primary),

          const SizedBox(height: 80),
        ],
      ),
    );
  }

  Widget _buildSettings(BuildContext context, Color primary) {
    final app = context.watch<AppProvider>();

    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _SettingLabel('AYARLAR', Icons.settings_rounded),
          const SizedBox(height: 12),

          // Karanlık mod toggle
          GestureDetector(
            onTap: () => app.toggleTheme(),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
              decoration: BoxDecoration(
                color: HeftrengColors.s1,
                borderRadius: BorderRadius.circular(11),
                border: Border.all(color: HeftrengColors.border),
              ),
              child: Row(
                children: [
                  Icon(
                    app.isDark
                        ? Icons.dark_mode_rounded
                        : Icons.light_mode_rounded,
                    size: 16,
                    color: primary,
                  ),
                  const SizedBox(width: 7),
                  Text(
                    app.isDark ? 'Karanlık Mod' : 'Aydınlık Mod',
                    style: HeftrengTextStyles.sans(
                      size: 13,
                      weight: FontWeight.w600,
                      color: HeftrengColors.txt,
                    ),
                  ),
                  const Spacer(),
                  _ToggleSwitch(isOn: app.isDark),
                ],
              ),
            ),
          ),

          const SizedBox(height: 12),
          _SettingLabel('RENK TEMASI', Icons.palette_rounded),
          const SizedBox(height: 8),

          // Renk seçici
          Wrap(
            spacing: 6,
            children: HeftrengColors.themeColors.entries.map((e) {
              final isActive = app.accentKey == e.key;
              return GestureDetector(
                onTap: () => app.setAccent(e.key),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: e.value,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isActive ? HeftrengColors.txt : Colors.transparent,
                      width: 2,
                    ),
                    boxShadow: isActive
                        ? [BoxShadow(color: e.value.withOpacity(0.5), blurRadius: 8)]
                        : null,
                  ),
                ),
              );
            }).toList(),
          ),

          const SizedBox(height: 12),
          _SettingLabel('YAZI BOYUTU', Icons.format_size_rounded),
          const SizedBox(height: 8),

          Row(
            children: [
              _ScaleBtn(
                icon: Icons.remove_rounded,
                onTap: () => app.decreaseFontScale(),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Center(
                  child: Text(
                    '${(app.fontScale * 100).round()}%',
                    style: HeftrengTextStyles.mono(
                      size: 12,
                      color: primary,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              _ScaleBtn(
                icon: Icons.add_rounded,
                onTap: () => app.increaseFontScale(),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLoginPrompt(BuildContext context, Color primary) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'Hesabına giriş yap',
              style: HeftrengTextStyles.serif(
                size: 22,
                color: HeftrengColors.txt,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Yorum yap, beğen, kaydet ve daha fazlası',
              style: HeftrengTextStyles.sans(
                size: 13,
                color: HeftrengColors.muted,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            HeftrengButton(
              label: 'Giriş Yap',
              icon: Icons.login_rounded,
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const AuthScreen()),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatCol extends StatelessWidget {
  final String value;
  final String label;
  const _StatCol({required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    return Expanded(
      child: Column(
        children: [
          Text(
            value,
            style: HeftrengTextStyles.serif(
              size: 19,
              color: primary,
            ),
          ),
          Text(
            label,
            style: HeftrengTextStyles.mono(
              size: 9,
              color: HeftrengColors.muted,
              letterSpacing: 0.5,
            ).copyWith(fontWeight: FontWeight.w700),
          ),
        ],
      ),
    );
  }
}

class _ProfBtn extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _ProfBtn({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: HeftrengColors.s1,
          borderRadius: BorderRadius.circular(99),
          border: Border.all(color: HeftrengColors.borderHover),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 13, color: HeftrengColors.muted),
            const SizedBox(width: 5),
            Text(
              label,
              style: HeftrengTextStyles.sans(
                size: 12,
                weight: FontWeight.w600,
                color: HeftrengColors.txt,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SettingLabel extends StatelessWidget {
  final String text;
  final IconData icon;
  const _SettingLabel(this.text, this.icon);

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    return Row(
      children: [
        Icon(icon, size: 12, color: primary),
        const SizedBox(width: 5),
        Text(
          text,
          style: HeftrengTextStyles.mono(
            size: 10,
            color: HeftrengColors.muted,
            letterSpacing: 1,
          ).copyWith(fontWeight: FontWeight.w700),
        ),
      ],
    );
  }
}

class _ToggleSwitch extends StatelessWidget {
  final bool isOn;
  const _ToggleSwitch({required this.isOn});

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      width: 38,
      height: 21,
      decoration: BoxDecoration(
        color: isOn
            ? Theme.of(context).colorScheme.primary
            : HeftrengColors.dim,
        borderRadius: BorderRadius.circular(99),
      ),
      child: AnimatedAlign(
        duration: const Duration(milliseconds: 200),
        alignment: isOn ? Alignment.centerRight : Alignment.centerLeft,
        child: Container(
          margin: const EdgeInsets.all(2),
          width: 17,
          height: 17,
          decoration: const BoxDecoration(
            color: Colors.white,
            shape: BoxShape.circle,
          ),
        ),
      ),
    );
  }
}

class _ScaleBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  const _ScaleBtn({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          color: HeftrengColors.s1,
          borderRadius: BorderRadius.circular(9),
          border: Border.all(color: HeftrengColors.border),
        ),
        child: Icon(icon, size: 16, color: HeftrengColors.txt),
      ),
    );
  }
}

class _EditField extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final int maxLines;
  const _EditField({
    required this.label,
    required this.controller,
    this.maxLines = 1,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: HeftrengTextStyles.mono(
            size: 10,
            color: HeftrengColors.muted,
            letterSpacing: 0.5,
          ).copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 4),
        TextField(
          controller: controller,
          maxLines: maxLines,
          style: HeftrengTextStyles.sans(
            size: 13,
            color: HeftrengColors.txt,
          ),
          decoration: InputDecoration(
            filled: true,
            fillColor: HeftrengColors.s1,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: HeftrengColors.border),
            ),
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          ),
        ),
      ],
    );
  }
}
