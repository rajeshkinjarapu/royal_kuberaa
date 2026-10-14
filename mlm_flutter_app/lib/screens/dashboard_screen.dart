import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../providers/dashboard_provider.dart';
import '../utils/constants.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DashboardProvider>().fetchDashboardData();
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final dashProvider = context.watch<DashboardProvider>();
    final dashData = dashProvider.dashboardData;

    return RefreshIndicator(
      onRefresh: () => context.read<DashboardProvider>().fetchDashboardData(),
      color: AppColors.primary,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.darkNavy, Color(0xFF1E293B)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(color: AppColors.darkNavy.withOpacity(0.15), blurRadius: 8, offset: const Offset(0, 3)),
                ],
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Welcome, ${user?['fullName'] ?? user?['name'] ?? 'Member'}! 👋',
                          style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Member ID: ${user?['memberId'] ?? 'N/A'}',
                          style: const TextStyle(fontSize: 13, color: Color(0xFFD4AF37), fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: const Color(0xFFD4AF37).withOpacity(0.2),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFFD4AF37)),
                    ),
                    child: Text(
                      dashData?['royaltyStats']?['rank'] ?? user?['rank'] ?? 'STARTER',
                      style: const TextStyle(color: Color(0xFFD4AF37), fontWeight: FontWeight.bold, fontSize: 11),
                    ),
                  ),
                ],
              ),
            ),

            if (user?['role'] == 'admin') ...[
              Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [Colors.purple, Colors.deepPurple]),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.admin_panel_settings, color: Colors.white, size: 28),
                    const SizedBox(width: 12),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Super Admin Mode', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                          Text('Manage members, payouts, and system', style: TextStyle(color: Colors.white70, fontSize: 11)),
                        ],
                      ),
                    ),
                    ElevatedButton(
                      onPressed: () => context.push('/admin'),
                      style: ElevatedButton.styleFrom(backgroundColor: Colors.white, foregroundColor: Colors.deepPurple, padding: const EdgeInsets.symmetric(horizontal: 12)),
                      child: const Text('Admin Panel', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    )
                  ],
                ),
              ),
            ],
            
            if (dashProvider.isLoading && dashData == null)
              const Center(child: Padding(padding: EdgeInsets.all(40.0), child: CircularProgressIndicator(color: AppColors.primary)))
            else if (dashProvider.errorMessage.isNotEmpty && dashData == null)
              Center(child: Text(dashProvider.errorMessage, style: const TextStyle(color: AppColors.error)))
            else ...[
              // Main Wallet Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppColors.primary, AppColors.primaryDark],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(color: AppColors.primary.withOpacity(0.3), blurRadius: 15, offset: const Offset(0, 8)),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.account_balance_wallet, color: Colors.white70, size: 20),
                        SizedBox(width: 8),
                        Text('Main Wallet Balance', style: const TextStyle(color: Colors.white70, fontSize: 14, fontWeight: FontWeight.w500)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      '₹${(dashData?['mainWallet'] ?? 0).toStringAsFixed(2)}',
                      style: GoogleFonts.inter(color: Colors.white, fontSize: 36, fontWeight: FontWeight.w900),
                    ),
                    const SizedBox(height: 20),
                    Row(
                      children: [
                        _buildWalletAction(Icons.add, 'Deposit', () => context.push('/deposit')),
                        const SizedBox(width: 12),
                        _buildWalletAction(Icons.arrow_upward, 'Withdraw', () => context.push('/withdraw')),
                        const SizedBox(width: 12),
                        _buildWalletAction(Icons.swap_horiz, 'Transfer', () => context.push('/transfer')),
                      ],
                    )
                  ],
                ),
              ),
              const SizedBox(height: 24),
              
              Text('Income Overview', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
              const SizedBox(height: 16),
              
              // Stats Grid
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                childAspectRatio: 1.5,
                children: [
                  _buildStatCard('Non-Working Wallet', '₹${dashData?['rebirthWallet'] ?? 0}', Icons.monetization_on, Colors.green),
                  _buildStatCard('Direct Earnings', '₹${dashData?['directIncome'] ?? 0}', Icons.people, Colors.blue),
                  InkWell(
                    onTap: () => context.push('/royalty'),
                    child: _buildStatCard('Royalty Income', '₹${dashData?['royaltyIncome'] ?? 0}', Icons.workspace_premium, Colors.orange),
                  ),
                  InkWell(
                    onTap: () => context.push('/cashback'),
                    child: _buildStatCard('Cashback', '₹${dashData?['cashbackIncome'] ?? 0}', Icons.monetization_on, Colors.teal),
                  ),
                ],
              ),
              
              const SizedBox(height: 24),
              
              // Quick Actions
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Activate ID Instantly', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        SizedBox(height: 4),
                        Text('Use wallet funds to activate.', style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                      ],
                    ),
                    ElevatedButton(
                      onPressed: () => context.push('/activate'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.secondary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      child: const Text('Activate', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ),
            ]
          ],
        ),
      ),
    );
  }

  Widget _buildWalletAction(IconData icon, String label, VoidCallback onTap) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.15),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Column(
            children: [
              Icon(icon, color: Colors.white, size: 20),
              const SizedBox(height: 4),
              Text(label, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            children: [
              Icon(icon, size: 20, color: color),
              const SizedBox(width: 8),
              Expanded(
                child: Text(title, style: const TextStyle(color: AppColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold), overflow: TextOverflow.ellipsis),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(value, style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w900, color: AppColors.textPrimary)),
        ],
      ),
    );
  }
}
