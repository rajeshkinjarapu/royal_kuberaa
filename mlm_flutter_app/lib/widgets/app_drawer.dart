import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/auth_provider.dart';
import '../utils/constants.dart';
import 'app_logo.dart';

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final isAdmin = user?['role'] == 'admin';

    return Drawer(
      backgroundColor: Colors.white,
      child: SafeArea(
        child: Column(
          children: [
            // --- Exact Webapp Sidebar Header ---
            Container(
              padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
              decoration: const BoxDecoration(
                border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9), width: 1.5)),
              ),
              child: Column(
                children: [
                  const AppLogo(size: 70, showBorder: true),
                  const SizedBox(height: 10),
                  Text(
                    'Royal Kuberaa',
                    style: GoogleFonts.inter(
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                      color: const Color(0xFF0F172A),
                      letterSpacing: 0.3,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${user?['memberId'] ?? 'N/A'} • ${user?['name'] ?? user?['fullName'] ?? 'Member'}',
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF64748B)),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),

            // --- Scrollable Menu Items Matching Webapp Exactly ---
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 8),
                children: [
                  // ===== MAIN MENU =====
                  _buildSectionHeader('MAIN MENU'),
                  _buildMenuItem(context, '📊', 'Dashboard', '/dashboard'),
                  _buildMenuItem(context, '⚡', 'ID Activation', '/activation'),
                  _buildMenuItem(context, '🌊', 'Autopool Income', '/cashback'),
                  _buildMenuItem(context, '👑', 'Royalty Pools', '/royalty'),
                  _buildMenuItem(context, '♾️', 'Rebirth ID', '/rebirth'),
                  _buildMenuItem(context, '🛍️', 'Products', '/products'),

                  const SizedBox(height: 8),

                  // ===== FINANCE =====
                  _buildSectionHeader('FINANCE'),
                  _buildMenuItem(context, '💳', 'Deposit Funds', '/deposit'),
                  _buildMenuItem(context, '📒', 'Passbook', '/passbook'),
                  _buildMenuItem(context, '🏦', 'Bank Withdrawal', '/withdraw'),
                  _buildMenuItem(context, '💸', 'P2P Transfer', '/p2p'),

                  const SizedBox(height: 8),

                  // ===== ACCOUNT =====
                  _buildSectionHeader('ACCOUNT'),
                  _buildMenuItem(context, '👥', 'My Network', '/network'),
                  _buildMenuItem(context, '➕', 'Add Member', '/add-member'),
                  _buildMenuItem(context, '🕸️', 'Team Network', '/team-network'),
                  _buildMenuItem(context, '👤', 'Profile', '/profile'),
                  _buildMenuItem(context, '🏦', 'Payment Settings', '/payment-settings'),
                  _buildMenuItem(context, '🔒', 'Transaction PIN', '/tpin'),
                  _buildMenuItem(context, '🔑', 'Change Password', '/change-password'),
                  _buildMenuItem(context, '🎧', 'Support', '/support'),

                  const SizedBox(height: 8),

                  // ===== INFORMATION =====
                  _buildSectionHeader('INFORMATION'),
                  _buildMenuItem(context, 'ℹ️', 'About Us', '/legal'),
                  _buildMenuItem(context, '📄', 'Terms & Conditions', '/terms'),
                  _buildMenuItem(context, '🛡️', 'Privacy Policy', '/privacy'),
                  _buildMenuItem(context, '↩️', 'Return & Refund', '/refund'),
                  _buildMenuItem(context, '⚠️', 'Disclaimer', '/disclaimer'),

                  // ===== ADMIN PANEL (if admin) =====
                  if (isAdmin) ...[
                    const SizedBox(height: 12),
                    const Divider(color: Color(0xFFE2E8F0)),
                    _buildSectionHeader('ADMIN PANEL', color: const Color(0xFF7C3AED)),
                    _buildMenuItem(context, '👑', 'Admin Dashboard', '/admin'),
                    _buildMenuItem(context, '👥', 'Member Management', '/admin/members'),
                    _buildMenuItem(context, '💰', 'Fund Management', '/admin/funds'),
                    _buildMenuItem(context, '💳', 'Fund Requests', '/admin/fund-management'),
                    _buildMenuItem(context, '💸', 'Payouts & TDS', '/admin/payouts'),
                    _buildMenuItem(context, '🔄', 'Pool Distributions', '/admin/pools'),
                    _buildMenuItem(context, '🛍️', 'Manage Products', '/admin/products'),
                    _buildMenuItem(context, '🎧', 'Support Tickets', '/admin/support'),
                    _buildMenuItem(context, '⚙️', 'System Settings', '/admin/settings'),
                    _buildMenuItem(context, '📱', 'App Upload', '/admin/app-upload'),
                    _buildMenuItem(context, '📊', 'System Reports', '/admin/reports'),
                  ],

                  const SizedBox(height: 16),
                ],
              ),
            ),

            // --- Logout Button matching Webapp Style ---
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                border: Border(top: BorderSide(color: Color(0xFFF1F5F9), width: 1.5)),
              ),
              child: SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () async {
                    Navigator.pop(context);
                    await context.read<AuthProvider>().logout();
                    if (context.mounted) {
                      context.go('/login');
                    }
                  },
                  style: OutlinedButton.styleFrom(
                    backgroundColor: const Color(0xFFE11D48).withOpacity(0.08),
                    foregroundColor: const Color(0xFFE11D48),
                    side: BorderSide(color: const Color(0xFFE11D48).withOpacity(0.25), width: 1.5),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('🚪', style: TextStyle(fontSize: 16)),
                      SizedBox(width: 8),
                      Text('Logout', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, {Color color = const Color(0xFF94A3B8)}) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(18, 12, 18, 6),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w800,
          color: color,
          letterSpacing: 0.8,
        ),
      ),
    );
  }

  Widget _buildMenuItem(BuildContext context, String emoji, String title, String route) {
    return InkWell(
      onTap: () {
        Navigator.pop(context);
        if (route == '/dashboard' || route == '/network' || route == '/finance' || route == '/profile') {
          context.go(route);
        } else {
          context.push(route);
        }
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
        child: Row(
          children: [
            Text(emoji, style: const TextStyle(fontSize: 18)),
            const SizedBox(width: 14),
            Expanded(
              child: Text(
                title,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF334155),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
