import 'package:flutter/material.dart';
import '../utils/constants.dart';

class AppLogo extends StatelessWidget {
  final double size;
  final bool isCircle;
  final double borderRadius;
  final bool showBorder;

  const AppLogo({
    super.key,
    this.size = 64,
    this.isCircle = true,
    this.borderRadius = 16,
    this.showBorder = true,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: isCircle ? BoxShape.circle : BoxShape.rectangle,
        borderRadius: isCircle ? null : BorderRadius.circular(borderRadius),
        border: showBorder
            ? Border.all(
                color: const Color(0xFFD4AF37).withOpacity(0.6), // Gold Accent
                width: 2,
              )
            : null,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.12),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(isCircle ? size / 2 : borderRadius),
        child: Image.asset(
          'assets/images/logo.jpg',
          width: size,
          height: size,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            // Elegant fallback if asset file is being copied
            return Container(
              color: AppColors.headerNavy,
              alignment: Alignment.center,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.workspace_premium, color: const Color(0xFFD4AF37), size: size * 0.45),
                  if (size >= 50)
                    Text(
                      'RK',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w900,
                        fontSize: size * 0.22,
                        letterSpacing: 1,
                      ),
                    ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}
