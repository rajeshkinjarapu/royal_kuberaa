import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../utils/constants.dart';
import '../widgets/app_drawer.dart';
import '../widgets/app_logo.dart';

class AdminDashboardScreen extends StatelessWidget {
  const AdminDashboardScreen({super.key});

  void _confirmLogout(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Confirm Logout'),
        content: const Text('Are you sure you want to log out of the Admin Console?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await context.read<AuthProvider>().logout();
              if (context.mounted) {
                context.go('/login');
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('Logout', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Row(
          children: [
            const AppLogo(size: 32, showBorder: false),
            const SizedBox(width: 10),
            Text(
              'Admin Console',
              style: GoogleFonts.inter(
                fontWeight: FontWeight.bold,
                fontSize: 18,
                color: Colors.white,
              ),
            ),
          ],
        ),
        backgroundColor: AppColors.darkNavy,
        foregroundColor: Colors.white,
        elevation: 2,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.white),
            tooltip: 'Logout',
            onPressed: () => _confirmLogout(context),
          ),
        ],
      ),
      drawer: const AppDrawer(),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16.0, 16.0, 16.0, 40.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF6D28D9), Color(0xFF4C1D95)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(18),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF6D28D9).withOpacity(0.35),
                    blurRadius: 14,
                    offset: const Offset(0, 5),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.admin_panel_settings, color: Colors.white, size: 36),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Text(
                              'Super Admin Portal',
                              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF59E0B),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Text(
                                'KALLU',
                                style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 10),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Full Control • System Configuration & Financials',
                          style: TextStyle(color: Colors.white70, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            Text('Management Modules', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
            const SizedBox(height: 16),

            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              children: [
                _buildAdminCard(context, 'Member Management', Icons.people_outline, Colors.blue, '/admin/members'),
                _buildAdminCard(context, 'Pool Distributions', Icons.pie_chart_outline, Colors.amber.shade800, '/admin/pools'),
                _buildAdminCard(context, 'Fund Management', Icons.account_balance_outlined, Colors.deepPurple, '/admin/fund-management'),
                _buildAdminCard(context, 'Fund Requests', Icons.monetization_on_outlined, Colors.green, '/admin/funds'),
                _buildAdminCard(context, 'Payout Approvals', Icons.account_balance_wallet_outlined, Colors.orange, '/admin/payouts'),
                _buildAdminCard(context, 'System Reports', Icons.insert_chart_outlined, Colors.indigo, '/admin/reports'),
                _buildAdminCard(context, 'KYC Approvals', Icons.verified_user_outlined, Colors.teal, '/admin/kyc'),
                _buildAdminCard(context, 'Products Kit', Icons.shopping_bag_outlined, Colors.pink, '/admin/products'),
                _buildAdminCard(context, 'Support Tickets', Icons.headset_mic_outlined, Colors.purple, '/admin/support'),
                _buildAdminCard(context, 'System Settings', Icons.settings_outlined, Colors.blueGrey, '/admin/settings'),
                _buildAdminCard(context, 'App Release & OTA', Icons.system_update_outlined, Colors.cyan.shade800, '/admin/app-upload'),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAdminCard(BuildContext context, String title, IconData icon, Color color, String? route) {
    return InkWell(
      onTap: () {
        if (route != null) {
          context.push(route);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$title Management Coming Soon!')));
        }
      },
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 8, offset: const Offset(0, 4))],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 40, color: color),
            const SizedBox(height: 12),
            Text(title, textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary)),
          ],
        ),
      ),
    );
  }
}
