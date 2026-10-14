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
      padding: const EdgeInsets.fromLTRB(16.0, 16.0, 16.0, 90.0),
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
              _buildSettingsTile(context, Icons.person_outline, 'Personal Details', () => _showPersonalDetails(context, user)),
              _buildSettingsTile(context, Icons.badge_outlined, 'KYC Verification', () => context.push('/kyc')),
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

  void _showPersonalDetails(BuildContext context, Map<String, dynamic>? user) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Personal Profile Details',
                style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
              ),
              const SizedBox(height: 16),
              _buildDetailRow('Member ID', user?['memberId'] ?? 'N/A'),
              _buildDetailRow('Full Name', user?['fullName'] ?? user?['name'] ?? 'N/A'),
              _buildDetailRow('Mobile Number', user?['mobile'] ?? user?['phone'] ?? 'N/A'),
              _buildDetailRow('Email Address', user?['email'] ?? 'Not Provided'),
              _buildDetailRow('Sponsor ID', user?['sponsorId'] ?? 'Top Sponsor'),
              _buildDetailRow('Account Status', user?['isActive'] == true ? 'Active (₹1500 Paid)' : 'Pending Activation'),
              _buildDetailRow('Current Rank', user?['rank'] ?? 'STARTER'),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(ctx),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: const Text('Close', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, fontWeight: FontWeight.w500)),
          Text(value, style: const TextStyle(fontSize: 13, color: AppColors.textPrimary, fontWeight: FontWeight.bold)),
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
