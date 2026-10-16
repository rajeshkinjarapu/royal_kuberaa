import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/auth_provider.dart';
import '../providers/profile_provider.dart';
import '../utils/constants.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ProfileProvider>().fetchProfile();
    });
  }

  void _copyToClipboard(String text, String label) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle, color: Colors.white, size: 18),
            const SizedBox(width: 8),
            Text('$label copied to clipboard!'),
          ],
        ),
        backgroundColor: AppColors.secondary,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _confirmLogout(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.error.withOpacity(0.12),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.logout, color: AppColors.error, size: 22),
            ),
            const SizedBox(width: 12),
            Text(
              'Confirm Logout',
              style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 17, color: const Color(0xFF0F172A)),
            ),
          ],
        ),
        content: const Text(
          'Are you sure you want to logout from your Royal Kuberaa account?',
          style: TextStyle(fontSize: 14, color: Color(0xFF475569), height: 1.4),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.bold)),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await context.read<AuthProvider>().logout();
              if (context.mounted) context.go('/login');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            ),
            child: const Text('Logout', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final profileData = context.watch<ProfileProvider>().profileData;
    final authUser = context.watch<AuthProvider>().user;
    final user = profileData ?? authUser;

    // Resolve accurate user details
    final name = (user?['name'] ?? user?['fullName'] ?? '').toString().trim();
    final displayName = name.isNotEmpty ? name : 'Royal Member';
    final memberId = (user?['memberId'] ?? '').toString().trim();
    final rank = (user?['rank'] ?? 'STARTER').toString().toUpperCase();
    final sponsorId = (user?['sponsorId'] ?? 'Top Sponsor').toString().trim();
    final bool isActive = user?['isActive'] == true;
    final initial = displayName.isNotEmpty ? displayName[0].toUpperCase() : 'R';

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16.0, 16.0, 16.0, 95.0),
      child: Column(
        children: [
          // ========== LUXURY ROYAL HEADER CARD ==========
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF0F172A), Color(0xFF1E1B4B), Color(0xFF2E1065)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(
                color: const Color(0xFFD4AF37).withOpacity(0.35),
                width: 1.2,
              ),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF1E1B4B).withOpacity(0.4),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Column(
              children: [
                // Avatar with Glowing Gold Crown Ring
                Stack(
                  alignment: Alignment.center,
                  children: [
                    Container(
                      width: 86,
                      height: 86,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: const LinearGradient(
                          colors: [Color(0xFFF0D878), Color(0xFFD4AF37), Color(0xFFB8942E)],
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFFD4AF37).withOpacity(0.45),
                            blurRadius: 18,
                            spreadRadius: 1,
                          ),
                        ],
                      ),
                    ),
                    Container(
                      width: 78,
                      height: 78,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: Color(0xFF0F172A),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        initial,
                        style: GoogleFonts.inter(
                          fontSize: 34,
                          fontWeight: FontWeight.w900,
                          color: const Color(0xFFF0D878),
                        ),
                      ),
                    ),
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: Container(
                        padding: const EdgeInsets.all(5),
                        decoration: const BoxDecoration(
                          color: Color(0xFFD4AF37),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.workspace_premium, color: Color(0xFF1A0B2E), size: 16),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                // Real Member Name
                Text(
                  displayName,
                  style: GoogleFonts.inter(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                    letterSpacing: 0.3,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 6),

                // Member ID with Copy Button
                if (memberId.isNotEmpty)
                  InkWell(
                    onTap: () => _copyToClipboard(memberId, 'Member ID'),
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.white.withOpacity(0.2)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.badge_outlined, color: Color(0xFFF0D878), size: 15),
                          const SizedBox(width: 6),
                          Text(
                            memberId,
                            style: GoogleFonts.inter(
                              color: const Color(0xFFF0D878),
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                              letterSpacing: 1,
                            ),
                          ),
                          const SizedBox(width: 8),
                          const Icon(Icons.copy_rounded, color: Colors.white70, size: 13),
                        ],
                      ),
                    ),
                  ),
                const SizedBox(height: 14),

                // Rank & Status Badge Row
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Rank Pill
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFFD4AF37), Color(0xFFB8942E)],
                        ),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFFD4AF37).withOpacity(0.35),
                            blurRadius: 8,
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.military_tech_rounded, color: Color(0xFF1A0B2E), size: 15),
                          const SizedBox(width: 4),
                          Text(
                            'Rank: $rank',
                            style: const TextStyle(
                              color: Color(0xFF1A0B2E),
                              fontWeight: FontWeight.w900,
                              fontSize: 12,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),

                    // Active / Inactive Status
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: isActive ? const Color(0xFF10B981).withOpacity(0.2) : Colors.amber.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isActive ? const Color(0xFF10B981) : Colors.amber,
                          width: 1,
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            isActive ? Icons.check_circle_rounded : Icons.pending_rounded,
                            color: isActive ? const Color(0xFF10B981) : Colors.amber,
                            size: 14,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            isActive ? 'Active' : 'Pending',
                            style: TextStyle(
                              color: isActive ? const Color(0xFF10B981) : Colors.amber,
                              fontWeight: FontWeight.bold,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                if (sponsorId.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Text(
                    'Sponsor: $sponsorId',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.white.withOpacity(0.65),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 22),

          // ========== ACCOUNT SETTINGS ==========
          _buildSettingsSection(
            title: 'Account Settings',
            children: [
              _buildSettingsTile(
                context: context,
                icon: Icons.person_rounded,
                iconColor: const Color(0xFF4F46E5),
                title: 'Personal Details',
                subtitle: 'Full name, mobile, sponsor & joining info',
                onTap: () => context.push('/personal-details'), // Opens separate screen!
              ),
              _buildDivider(),
              _buildSettingsTile(
                context: context,
                icon: Icons.badge_rounded,
                iconColor: const Color(0xFF0EA5E9),
                title: 'KYC Verification',
                subtitle: 'Upload Aadhaar & PAN documents',
                onTap: () => context.push('/kyc'),
              ),
              _buildDivider(),
              _buildSettingsTile(
                context: context,
                icon: Icons.qr_code_2_rounded,
                iconColor: const Color(0xFF10B981),
                title: 'Payment QR Settings',
                subtitle: 'Bank account, UPI ID & payout QR',
                onTap: () => context.push('/payment-settings'),
              ),
            ],
          ),
          
          const SizedBox(height: 18),

          // ========== SECURITY ==========
          _buildSettingsSection(
            title: 'Security',
            children: [
              _buildSettingsTile(
                context: context,
                icon: Icons.lock_rounded,
                iconColor: const Color(0xFFF59E0B),
                title: 'Change Password',
                subtitle: 'Update your 6-digit login password',
                onTap: () => context.push('/change-password'),
              ),
              _buildDivider(),
              _buildSettingsTile(
                context: context,
                icon: Icons.pin_rounded,
                iconColor: const Color(0xFF8B5CF6),
                title: 'Transaction PIN (T-PIN)',
                subtitle: 'Set or reset 4-digit security PIN',
                onTap: () => context.push('/tpin'),
              ),
            ],
          ),

          const SizedBox(height: 18),

          // ========== HELP & INFORMATION ==========
          _buildSettingsSection(
            title: 'Help & Information',
            children: [
              _buildSettingsTile(
                context: context,
                icon: Icons.headset_mic_rounded,
                iconColor: const Color(0xFF06B6D4),
                title: 'Customer Support Tickets',
                subtitle: 'Get help with payouts and account',
                onTap: () => context.push('/support'),
              ),
              _buildDivider(),
              _buildSettingsTile(
                context: context,
                icon: Icons.notifications_rounded,
                iconColor: const Color(0xFFEC4899),
                title: 'Account Notifications',
                subtitle: 'System alerts and income updates',
                onTap: () => context.push('/notifications'),
              ),
              _buildDivider(),
              _buildSettingsTile(
                context: context,
                icon: Icons.gavel_rounded,
                iconColor: const Color(0xFF64748B),
                title: 'Legal Policies & Compliance',
                subtitle: 'Terms, Privacy & Refund policy',
                onTap: () => context.push('/legal'),
              ),
            ],
          ),

          const SizedBox(height: 28),

          // ========== LOGOUT SAFELY BUTTON ==========
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () => _confirmLogout(context),
              icon: const Icon(Icons.logout_rounded, color: AppColors.error, size: 20),
              label: const Text(
                'Logout Safely',
                style: TextStyle(color: AppColors.error, fontWeight: FontWeight.bold, fontSize: 15),
              ),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 15),
                backgroundColor: AppColors.error.withOpacity(0.06),
                side: BorderSide(color: AppColors.error.withOpacity(0.25), width: 1.2),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
          ),
          const SizedBox(height: 16),
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
          child: Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: const Color(0xFF0F172A),
              letterSpacing: 0.3,
            ),
          ),
        ),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.02),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(children: children),
        ),
      ],
    );
  }

  Widget _buildSettingsTile({
    required BuildContext context,
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(9),
              decoration: BoxDecoration(
                color: iconColor.withOpacity(0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: iconColor, size: 20),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 14,
                      color: Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(
                      fontSize: 11,
                      color: Color(0xFF64748B),
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right_rounded, color: Color(0xFF94A3B8), size: 22),
          ],
        ),
      ),
    );
  }

  Widget _buildDivider() {
    return const Divider(height: 1, thickness: 1, color: Color(0xFFF1F5F9), indent: 56);
  }
}
