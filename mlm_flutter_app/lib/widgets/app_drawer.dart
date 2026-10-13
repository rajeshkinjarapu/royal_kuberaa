import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../utils/constants.dart';

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
              color: AppColors.primary,
              gradient: LinearGradient(
                colors: [AppColors.primary, AppColors.primaryDark],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            accountName: Text(
              user?['fullName'] ?? 'Royal Member',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),
            accountEmail: Text(
              user?['memberId'] ?? 'ID Not Found',
              style: const TextStyle(color: Colors.white70),
            ),
            currentAccountPicture: CircleAvatar(
              backgroundColor: Colors.white,
              child: Text(
                (user?['fullName'] ?? 'R')[0].toUpperCase(),
                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.primary),
              ),
            ),
          ),
          _buildDrawerItem(
            icon: Icons.shopping_bag_outlined, 
            title: 'Welcome Products', 
            onTap: () {
              Navigator.pop(context);
              context.push('/products');
            },
          ),
          _buildDrawerItem(
            icon: Icons.headset_mic_outlined, 
            title: 'Customer Support', 
            onTap: () {
              Navigator.pop(context);
              context.push('/support');
            },
          ),
          _buildDrawerItem(
            icon: Icons.notifications_none, 
            title: 'Notifications', 
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
          if (user?['role'] == 'admin') ...[
            const Divider(),
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
        ],
      ),
    );
  }

  Widget _buildDrawerItem({required IconData icon, required String title, required VoidCallback onTap, Color? iconColor, Color? textColor}) {
    return ListTile(
      leading: Icon(icon, color: iconColor ?? AppColors.textSecondary),
      title: Text(
        title,
        style: TextStyle(color: textColor ?? AppColors.textPrimary, fontWeight: FontWeight.w600),
      ),
      onTap: onTap,
    );
  }
}
