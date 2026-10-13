import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import '../utils/constants.dart';

class RegistrationSuccessScreen extends StatelessWidget {
  final Map<String, dynamic> credentials;
  
  const RegistrationSuccessScreen({super.key, required this.credentials});

  @override
  Widget build(BuildContext context) {
    final memberId = credentials['memberId'] ?? 'ERROR';
    final password = credentials['password'] ?? 'ERROR';
    final fullName = credentials['fullName'] ?? 'NEW MEMBER';

    return Scaffold(
      backgroundColor: AppColors.primary,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.check_circle, color: AppColors.secondary, size: 80),
                const SizedBox(height: 24),
                Text(
                  'Registration Successful!',
                  style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Please save or screenshot the details below.',
                  style: TextStyle(color: Colors.white70),
                ),
                const SizedBox(height: 32),

                // ID Card
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(32),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 30, offset: const Offset(0, 15)),
                    ],
                  ),
                  child: Column(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Text('ROYAL KUBERAA', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, letterSpacing: 2)),
                      ),
                      const SizedBox(height: 32),
                      const Text('WELCOME', style: TextStyle(color: AppColors.textSecondary, fontSize: 12, letterSpacing: 2)),
                      const SizedBox(height: 8),
                      Text(
                        fullName,
                        style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.w900, color: AppColors.textPrimary),
                        textAlign: TextAlign.center,
                      ),
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 24),
                        child: Divider(color: AppColors.border),
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('MEMBER ID', style: TextStyle(color: AppColors.textSecondary, fontSize: 10, letterSpacing: 1)),
                              const SizedBox(height: 4),
                              Text(memberId, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primary)),
                            ],
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              const Text('PASSWORD', style: TextStyle(color: AppColors.textSecondary, fontSize: 10, letterSpacing: 1)),
                              const SizedBox(height: 4),
                              Text(password, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.error)),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 40),

                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: () => context.go('/login'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: AppColors.primary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Go to Login', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
