import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/auth_provider.dart';
import '../utils/constants.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16.0, 16.0, 16.0, 40.0),
      child: Column(
        children: [
          // Profile Header Card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppColors.border),
              boxShadow: [
                BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 20, offset: const Offset(0, 10)),
              ],
            ),
            child: Column(
              children: [
                CircleAvatar(
                  radius: 40,
                  backgroundColor: AppColors.primary.withOpacity(0.1),
                  child: Text(
                    (user?['fullName'] ?? 'U')[0].toUpperCase(),
                    style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: AppColors.primary),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  user?['fullName'] ?? 'Royal Member',
                  style: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                ),
                const SizedBox(height: 4),
                Text(
                  user?['memberId'] ?? 'ID: N/A',
                  style: const TextStyle(fontSize: 14, color: AppColors.primary, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.secondary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    'Rank: ${user?['rank'] ?? 'USER'}',
                    style: const TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold),
                  ),
                )
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Settings Options
          _buildSettingsSection(
            title: 'Account Settings',
            children: [
              _buildSettingsTile(context, Icons.person_outline, 'Personal Details', () {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Personal Details are shown above.')));
              }),
              _buildSettingsTile(context, Icons.qr_code_2_rounded, 'Payment QR Settings', () => context.push('/payment-settings')),
            ],
          ),
          
          const SizedBox(height: 16),

          _buildSettingsSection(
            title: 'Security',
            children: [
              _buildSettingsTile(context, Icons.lock_outline, 'Change Password', () => context.push('/change-password')),
              _buildSettingsTile(context, Icons.pin_outlined, 'Transaction PIN (T-PIN)', () => context.push('/tpin')),
            ],
          ),

          const SizedBox(height: 16),

          _buildSettingsSection(
            title: 'Help & Information',
            children: [
              _buildSettingsTile(context, Icons.headset_mic_outlined, 'Customer Support Tickets', () => context.push('/support')),
              _buildSettingsTile(context, Icons.notifications_none, 'Account Notifications', () => context.push('/notifications')),
              _buildSettingsTile(context, Icons.description_outlined, 'Legal Policies & Compliance', () => context.push('/legal')),
            ],
          ),

          const SizedBox(height: 32),
          
          SizedBox(
            width: double.infinity,
            child: TextButton.icon(
              onPressed: () async {
                await context.read<AuthProvider>().logout();
                if (context.mounted) context.go('/login');
              },
              icon: const Icon(Icons.logout, color: AppColors.error),
              label: const Text('Logout Safely', style: TextStyle(color: AppColors.error, fontWeight: FontWeight.bold)),
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                backgroundColor: AppColors.error.withOpacity(0.1),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildSettingsSection({required String title, required List<Widget> children}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 8, bottom: 8),
          child: Text(title, style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
        ),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(children: children),
        ),
      ],
    );
  }

  Widget _buildSettingsTile(BuildContext context, IconData icon, String title, VoidCallback onTap) {
    return ListTile(
      leading: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(8)),
        child: Icon(icon, color: AppColors.primary, size: 20),
      ),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
      trailing: const Icon(Icons.chevron_right, color: Colors.grey, size: 20),
      onTap: onTap,
    );
  }
}
