import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../providers.dart';
import '../../../core/theme/app_theme.dart';
import '../../widgets/common/common_widgets.dart';

// ══ GİRİŞ / KAYIT EKRANI ══

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();
  bool _obscurePass = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    _emailCtrl.dispose();
    _passCtrl.dispose();
    _nameCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _error = null);
    final auth = context.read<AuthProvider>();
    bool ok;

    if (_tabCtrl.index == 0) {
      ok = await auth.signInWithEmail(
        _emailCtrl.text.trim(),
        _passCtrl.text,
      );
    } else {
      if (_nameCtrl.text.trim().isEmpty) {
        setState(() => _error = 'İsim boş olamaz');
        return;
      }
      ok = await auth.register(
        email: _emailCtrl.text.trim(),
        password: _passCtrl.text,
        displayName: _nameCtrl.text.trim(),
      );
    }

    if (ok && mounted) {
      Navigator.pop(context);
    } else if (!ok) {
      setState(() => _error = 'İşlem başarısız. Bilgileri kontrol et.');
    }
  }

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: HeftrengColors.bg,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const SizedBox(height: 40),

              // Logo
              const HeftrengLogo(fontSize: 28),
              const SizedBox(height: 6),
              Text(
                'Civaka Nivîskar',
                style: HeftrengTextStyles.mono(
                  size: 11,
                  color: HeftrengColors.muted,
                  letterSpacing: 1,
                ),
              ),

              const SizedBox(height: 40),

              // Tab bar
              GlassCard(
                padding: EdgeInsets.zero,
                child: Column(
                  children: [
                    // Sekmeler
                    Container(
                      height: 44,
                      margin: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: HeftrengColors.s2,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: TabBar(
                        controller: _tabCtrl,
                        indicator: BoxDecoration(
                          color: primary,
                          borderRadius: BorderRadius.circular(10),
                          boxShadow: [
                            BoxShadow(
                              color: primary.withOpacity(0.4),
                              blurRadius: 8,
                            ),
                          ],
                        ),
                        indicatorSize: TabBarIndicatorSize.tab,
                        dividerColor: Colors.transparent,
                        labelStyle: HeftrengTextStyles.sans(
                          size: 13,
                          weight: FontWeight.w700,
                          color: Colors.white,
                        ),
                        unselectedLabelStyle: HeftrengTextStyles.sans(
                          size: 13,
                          weight: FontWeight.w500,
                          color: HeftrengColors.muted,
                        ),
                        tabs: const [
                          Tab(text: 'Giriş Yap'),
                          Tab(text: 'Kayıt Ol'),
                        ],
                      ),
                    ),

                    // Form alanları
                    Padding(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 20),
                      child: Column(
                        children: [
                          // Kayıt modunda isim alanı
                          AnimatedSize(
                            duration: const Duration(milliseconds: 250),
                            child: ListenableBuilder(
                              listenable: _tabCtrl,
                              builder: (_, __) {
                                if (_tabCtrl.index == 0) {
                                  return const SizedBox.shrink();
                                }
                                return Column(
                                  children: [
                                    const SizedBox(height: 8),
                                    _AuthField(
                                      controller: _nameCtrl,
                                      hint: 'İsim Soyisim',
                                      icon: Icons.person_outline_rounded,
                                    ),
                                  ],
                                );
                              },
                            ),
                          ),

                          const SizedBox(height: 10),
                          _AuthField(
                            controller: _emailCtrl,
                            hint: 'E-posta',
                            icon: Icons.mail_outline_rounded,
                            keyboardType: TextInputType.emailAddress,
                          ),
                          const SizedBox(height: 10),
                          _AuthField(
                            controller: _passCtrl,
                            hint: 'Şifre',
                            icon: Icons.lock_outline_rounded,
                            obscure: _obscurePass,
                            suffix: GestureDetector(
                              onTap: () =>
                                  setState(() => _obscurePass = !_obscurePass),
                              child: Icon(
                                _obscurePass
                                    ? Icons.visibility_off_outlined
                                    : Icons.visibility_outlined,
                                size: 18,
                                color: HeftrengColors.muted,
                              ),
                            ),
                          ),

                          // Hata mesajı
                          if (_error != null) ...[
                            const SizedBox(height: 10),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 8,
                              ),
                              decoration: BoxDecoration(
                                color: HeftrengColors.error.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: HeftrengColors.error.withOpacity(0.3),
                                ),
                              ),
                              child: Row(
                                children: [
                                  const Icon(
                                    Icons.error_outline_rounded,
                                    size: 14,
                                    color: HeftrengColors.error,
                                  ),
                                  const SizedBox(width: 6),
                                  Expanded(
                                    child: Text(
                                      _error!,
                                      style: HeftrengTextStyles.sans(
                                        size: 12,
                                        color: HeftrengColors.error,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],

                          const SizedBox(height: 16),

                          // Giriş / Kayıt butonu
                          SizedBox(
                            width: double.infinity,
                            child: HeftrengButton(
                              label: _tabCtrl.index == 0
                                  ? 'Giriş Yap'
                                  : 'Kayıt Ol',
                              icon: _tabCtrl.index == 0
                                  ? Icons.login_rounded
                                  : Icons.person_add_rounded,
                              onTap: _submit,
                              isLoading: auth.isLoading,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Geri dön
              GestureDetector(
                onTap: () => Navigator.pop(context),
                child: Text(
                  'Vazgeç',
                  style: HeftrengTextStyles.sans(
                    size: 13,
                    color: HeftrengColors.muted,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AuthField extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final IconData icon;
  final bool obscure;
  final TextInputType? keyboardType;
  final Widget? suffix;

  const _AuthField({
    required this.controller,
    required this.hint,
    required this.icon,
    this.obscure = false,
    this.keyboardType,
    this.suffix,
  });

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;
    return TextField(
      controller: controller,
      obscureText: obscure,
      keyboardType: keyboardType,
      style: HeftrengTextStyles.sans(size: 14, color: HeftrengColors.txt),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: HeftrengTextStyles.sans(
          size: 14,
          color: HeftrengColors.muted,
        ),
        filled: true,
        fillColor: HeftrengColors.s1,
        prefixIcon: Icon(icon, size: 18, color: HeftrengColors.muted),
        suffixIcon: suffix,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: HeftrengColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: HeftrengColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: primary, width: 1.5),
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      ),
    );
  }
}
