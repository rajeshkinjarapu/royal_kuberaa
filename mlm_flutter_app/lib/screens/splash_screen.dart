import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../utils/constants.dart';
import '../widgets/app_logo.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  void _checkAuth() async {
    // Add a slight delay for the splash animation
    await Future.delayed(const Duration(seconds: 2));
    
    if (!mounted) return;
    
    final auth = context.read<AuthProvider>();
    final isLoggedIn = await auth.checkAuthStatus();
    
    if (mounted) {
      if (isLoggedIn) {
        context.go('/dashboard');
      } else {
        context.go('/login');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.darkNavy,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const AppLogo(size: 120),
            const SizedBox(height: 24),
            Text(
              AppConstants.appName,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.bold,
                letterSpacing: 1.2,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Digital Community Commerce',
              style: TextStyle(color: Colors.white60, fontSize: 13),
            ),
            const SizedBox(height: 36),
            const CircularProgressIndicator(color: Color(0xFFD4AF37)),
          ],
        ),
      ),
    );
  }
}
