import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../utils/constants.dart';
import 'app_logo.dart';

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    return Drawer(
      backgroundColor: Colors.white,
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          UserAccountsDrawerHeader(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [AppColors.darkNavy, Color(0xFF1E293B)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            accountName: Text(
              user?['fullName'] ?? user?['name'] ?? 'Royal Member',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 17, color: Colors.white),
            ),
            accountEmail: Text(
              'ID: ${user?['memberId'] ?? 'N/A'}',
              style: const TextStyle(color: Color(0xFFD4AF37), fontSize: 13, fontWeight: FontWeight.bold),
            ),
            currentAccountPicture: const AppLogo(size: 64, showBorder: true),
          ),

          // --- NETWORK & TEAM ---
          _buildSectionHeader('NETWORK & GROWTH'),
          _buildDrawerItem(
            icon: Icons.person_add_alt_1_outlined,
            title: 'Add New Member',
            iconColor: Colors.blue,
            onTap: () {
              Navigator.pop(context);
              context.push('/add-member');
            },
          ),
          _buildDrawerItem(
            icon: Icons.account_tree_outlined,
            title: 'Team Network',
            iconColor: Colors.teal,
            onTap: () {
              Navigator.pop(context);
              context.push('/team-network');
            },
          ),
          _buildDrawerItem(
            icon: Icons.all_inclusive,
            title: 'Rebirth IDs',
            iconColor: Colors.purple,
            onTap: () {
              Navigator.pop(context);
              context.push('/rebirth');
            },
          ),

          const Divider(),

          // --- EARNINGS & POOLS ---
          _buildSectionHeader('EARNINGS & POOLS'),
          _buildDrawerItem(
            icon: Icons.workspace_premium_outlined,
            title: 'Royalty Pools',
            iconColor: Colors.amber.shade800,
            onTap: () {
              Navigator.pop(context);
              context.push('/royalty');
            },
          ),
          _buildDrawerItem(
            icon: Icons.monetization_on_outlined,
            title: 'Non-Working Cashback',
            iconColor: Colors.green,
            onTap: () {
              Navigator.pop(context);
              context.push('/cashback');
            },
          ),
          _buildDrawerItem(
            icon: Icons.shopping_bag_outlined,
            title: 'Welcome Products',
            iconColor: Colors.deepOrange,
            onTap: () {
              Navigator.pop(context);
              context.push('/products');
            },
          ),

          const Divider(),

          // --- ACCOUNT & PAYMENTS ---
          _buildSectionHeader('ACCOUNT & SETTINGS'),
          _buildDrawerItem(
            icon: Icons.qr_code_2_rounded,
            title: 'Payment QR Settings',
            iconColor: AppColors.primary,
            onTap: () {
              Navigator.pop(context);
              context.push('/payment-settings');
            },
          ),
          _buildDrawerItem(
            icon: Icons.pin_outlined,
            title: 'Transaction PIN (TPIN)',
            iconColor: Colors.blueGrey,
            onTap: () {
              Navigator.pop(context);
              context.push('/tpin');
            },
          ),
          _buildDrawerItem(
            icon: Icons.lock_outline,
            title: 'Change Password',
            iconColor: Colors.blueGrey,
            onTap: () {
              Navigator.pop(context);
              context.push('/change-password');
            },
          ),

          const Divider(),

          // --- SUPPORT & INFO ---
          _buildSectionHeader('SUPPORT & INFO'),
          _buildDrawerItem(
            icon: Icons.headset_mic_outlined,
            title: 'Customer Support',
            iconColor: Colors.purple,
            onTap: () {
              Navigator.pop(context);
              context.push('/support');
            },
          ),
          _buildDrawerItem(
            icon: Icons.notifications_none,
            title: 'Notifications',
            iconColor: Colors.orange,
            onTap: () {
              Navigator.pop(context);
              context.push('/notifications');
            },
          ),
          _buildDrawerItem(
            icon: Icons.info_outline,
            title: 'About Royal Kuberaa',
            onTap: () {
              Navigator.pop(context);
              showDialog(
                context: context,
                builder: (c) => AlertDialog(
                  title: const Text('About Royal Kuberaa'),
                  content: const Text(
                    'Royal Kuberaa is an innovative hybrid unilevel & royalty profit-sharing business model designed to provide sustainable growth, daily profit sharing, and zero-risk cashback guaranteed for all members.\n\nPackage: ₹1500 (Includes Welcome Kit)\nVersion: 1.0.0 (Production Release)',
                    style: TextStyle(height: 1.4),
                  ),
                  actions: [
                    TextButton(onPressed: () => Navigator.pop(c), child: const Text('Close')),
                  ],
                ),
              );
            },
          ),

          const Divider(),

          // --- LEGAL & POLICIES ---
          _buildSectionHeader('LEGAL & POLICIES'),
          _buildDrawerItem(
            icon: Icons.description_outlined,
            title: 'Terms & Conditions',
            iconColor: Colors.blueGrey,
            onTap: () {
              Navigator.pop(context);
              context.push('/terms');
            },
          ),
          _buildDrawerItem(
            icon: Icons.privacy_tip_outlined,
            title: 'Privacy Policy',
            iconColor: Colors.blueGrey,
            onTap: () {
              Navigator.pop(context);
              context.push('/privacy');
            },
          ),
          _buildDrawerItem(
            icon: Icons.assignment_return_outlined,
            title: 'Return & Refund Policy',
            iconColor: Colors.blueGrey,
            onTap: () {
              Navigator.pop(context);
              context.push('/refund');
            },
          ),
          _buildDrawerItem(
            icon: Icons.gavel_outlined,
            title: 'Disclaimer & Compliance',
            iconColor: Colors.blueGrey,
            onTap: () {
              Navigator.pop(context);
              context.push('/disclaimer');
            },
          ),

          // Admin Menu
          if (user?['role'] == 'admin') ...[
            const Divider(),
            _buildSectionHeader('ADMINISTRATION'),
            _buildDrawerItem(
              icon: Icons.admin_panel_settings,
              title: 'Admin Panel',
              iconColor: Colors.purple,
              textColor: Colors.purple,
              onTap: () {
                Navigator.pop(context);
                context.push('/admin');
              },
            ),
          ],

          const Divider(),
          _buildDrawerItem(
            icon: Icons.logout,
            title: 'Logout',
            iconColor: AppColors.error,
            textColor: AppColors.error,
            onTap: () async {
              await context.read<AuthProvider>().logout();
              if (context.mounted) context.go('/login');
            },
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 16, top: 12, bottom: 4),
      child: Text(
        title,
        style: const TextStyle(
          color: AppColors.textSecondary,
          fontSize: 11,
          fontWeight: FontWeight.bold,
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  Widget _buildDrawerItem({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    Color? iconColor,
    Color? textColor,
  }) {
    return ListTile(
      dense: true,
      visualDensity: const VisualDensity(vertical: -1),
      leading: Icon(icon, color: iconColor ?? AppColors.textSecondary, size: 20),
      title: Text(
        title,
        style: TextStyle(color: textColor ?? AppColors.textPrimary, fontWeight: FontWeight.w600, fontSize: 13),
      ),
      onTap: onTap,
    );
  }
}
