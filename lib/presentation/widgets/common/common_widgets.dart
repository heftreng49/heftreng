import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/theme/app_theme.dart';

// ══ ORTAK BİLEŞENLER ══

// ── Heftreng Logo ──
class HeftrengLogo extends StatelessWidget {
  final double fontSize;
  final bool showDot;

  const HeftrengLogo({super.key, this.fontSize = 20, this.showDot = true});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          'Heftreng',
          style: HeftrengTextStyles.serif(
            size: fontSize,
            color: HeftrengColors.txt,
          ),
        ),
        if (showDot) ...[
          const SizedBox(width: 5),
          Container(
            width: 7,
            height: 7,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: const LinearGradient(
                colors: [HeftrengColors.primary, HeftrengColors.accent],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              boxShadow: [
                BoxShadow(
                  color: HeftrengColors.primary.withOpacity(0.5),
                  blurRadius: 8,
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

// ── Avatar ──
class HeftrengAvatar extends StatelessWidget {
  final String? photoUrl;
  final String? initials;
  final double size;
  final bool showOnlineDot;
  final bool isOnline;

  const HeftrengAvatar({
    super.key,
    this.photoUrl,
    this.initials,
    this.size = 36,
    this.showOnlineDot = false,
    this.isOnline = false,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: const LinearGradient(
              colors: [HeftrengColors.primary, HeftrengColors.accent],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: ClipOval(
            child: photoUrl != null && photoUrl!.isNotEmpty
                ? CachedNetworkImage(
                    imageUrl: photoUrl!,
                    fit: BoxFit.cover,
                    placeholder: (_, __) => _placeholder(),
                    errorWidget: (_, __, ___) => _placeholder(),
                  )
                : _placeholder(),
          ),
        ),
        if (showOnlineDot)
          Positioned(
            right: -1,
            bottom: -1,
            child: Container(
              width: size * 0.28,
              height: size * 0.28,
              decoration: BoxDecoration(
                color: isOnline ? HeftrengColors.ok : HeftrengColors.muted,
                shape: BoxShape.circle,
                border: Border.all(color: HeftrengColors.bg, width: 1.5),
              ),
            ),
          ),
      ],
    );
  }

  Widget _placeholder() {
    return Center(
      child: Text(
        initials ?? '?',
        style: HeftrengTextStyles.serif(
          size: size * 0.4,
          color: Colors.white,
          italic: false,
        ),
      ),
    );
  }
}

// ── Cam Kart (Glass Card) ──
class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsets? padding;
  final BorderRadius? borderRadius;
  final Color? borderColor;
  final Color? backgroundColor;

  const GlassCard({
    super.key,
    required this.child,
    this.padding,
    this.borderRadius,
    this.borderColor,
    this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding ?? const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: backgroundColor ?? HeftrengColors.s1,
        borderRadius: borderRadius ?? BorderRadius.circular(16),
        border: Border.all(
          color: borderColor ?? HeftrengColors.border,
          width: 1,
        ),
      ),
      child: child,
    );
  }
}

// ── Primary Buton ──
class HeftrengButton extends StatelessWidget {
  final String label;
  final IconData? icon;
  final VoidCallback? onTap;
  final bool isPrimary;
  final bool isSmall;
  final bool isLoading;

  const HeftrengButton({
    super.key,
    required this.label,
    this.icon,
    this.onTap,
    this.isPrimary = true,
    this.isSmall = false,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    final primary = Theme.of(context).colorScheme.primary;

    return GestureDetector(
      onTap: isLoading ? null : onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: EdgeInsets.symmetric(
          horizontal: isSmall ? 16 : 24,
          vertical: isSmall ? 6 : 10,
        ),
        decoration: BoxDecoration(
          gradient: isPrimary
              ? LinearGradient(
                  colors: [primary, HeftrengColors.primary2],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                )
              : null,
          color: isPrimary ? null : Colors.transparent,
          borderRadius: BorderRadius.circular(99),
          border: Border.all(
            color: isPrimary ? Colors.transparent : primary,
            width: 1.5,
          ),
          boxShadow: isPrimary
              ? [
                  BoxShadow(
                    color: primary.withOpacity(0.4),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  )
                ]
              : null,
        ),
        child: isLoading
            ? SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(
                  color: isPrimary ? Colors.white : primary,
                  strokeWidth: 2,
                ),
              )
            : Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (icon != null) ...[
                    Icon(
                      icon,
                      size: isSmall ? 14 : 16,
                      color: isPrimary ? Colors.white : primary,
                    ),
                    const SizedBox(width: 5),
                  ],
                  Text(
                    label,
                    style: HeftrengTextStyles.sans(
                      size: isSmall ? 11 : 13,
                      weight: FontWeight.w700,
                      color: isPrimary ? Colors.white : primary,
                      letterSpacing: 0.3,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

// ── Shimmer yükleme ──
class ShimmerPost extends StatelessWidget {
  const ShimmerPost({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 22),
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(color: HeftrengColors.border, width: 1),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _shimmerBox(60, 11),
          const SizedBox(height: 10),
          _shimmerBox(double.infinity, 22),
          const SizedBox(height: 6),
          _shimmerBox(double.infinity * 0.8, 22),
          const SizedBox(height: 10),
          _shimmerBox(double.infinity, 14),
          const SizedBox(height: 4),
          _shimmerBox(200, 14),
          const SizedBox(height: 14),
          _shimmerBox(double.infinity, 150, radius: 8),
        ],
      ),
    );
  }

  Widget _shimmerBox(double width, double height, {double radius = 6}) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: HeftrengColors.s3,
        borderRadius: BorderRadius.circular(radius),
      ),
    );
  }
}

// ── İnce ayırıcı çizgi ──
class HeftrengDivider extends StatelessWidget {
  const HeftrengDivider({super.key});

  @override
  Widget build(BuildContext context) {
    return const Divider(
      color: HeftrengColors.border,
      thickness: 1,
      height: 0,
    );
  }
}

// ── Boş durum göstergesi ──
class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? action;

  const EmptyState({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 32, color: HeftrengColors.muted.withOpacity(0.3)),
            const SizedBox(height: 12),
            Text(
              title,
              style: HeftrengTextStyles.sans(
                size: 14,
                weight: FontWeight.w600,
                color: HeftrengColors.muted,
              ),
              textAlign: TextAlign.center,
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 4),
              Text(
                subtitle!,
                style: HeftrengTextStyles.sans(
                  size: 12,
                  color: HeftrengColors.muted,
                ),
                textAlign: TextAlign.center,
              ),
            ],
            if (action != null) ...[
              const SizedBox(height: 16),
              action!,
            ],
          ],
        ),
      ),
    );
  }
}
