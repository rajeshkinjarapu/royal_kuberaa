import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/dashboard_provider.dart';
import '../utils/constants.dart';

class RoyaltyScreen extends StatelessWidget {
  const RoyaltyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final dashData = context.watch<DashboardProvider>().dashboardData;
    final royaltyIncome = dashData?['royaltyIncome'] ?? 0.0;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Royalty Income'),
        backgroundColor: AppColors.darkNavy,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16.0, 16.0, 16.0, 40.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Colors.orangeAccent, Colors.deepOrange],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(color: Colors.orange.withOpacity(0.3), blurRadius: 15, offset: const Offset(0, 8)),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.account_balance_wallet, color: Colors.white70, size: 20),
                      SizedBox(width: 8),
                      Text('Total Royalty Earnings', style: const TextStyle(color: Colors.white70, fontSize: 14, fontWeight: FontWeight.w500)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    '₹${royaltyIncome.toStringAsFixed(2)}',
                    style: GoogleFonts.inter(color: Colors.white, fontSize: 36, fontWeight: FontWeight.w900),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Text('How Royalty Works', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
            const SizedBox(height: 16),
            _buildInfoCard(
              title: 'Gold Pool (₹120 / joining)',
              desc: 'Requirement: Refer ANY 2 Directs. Max Limit: ₹20,000',
              icon: Icons.star,
              color: Colors.amber,
            ),
            _buildInfoCard(
              title: 'Platinum Pool (₹60 / joining)',
              desc: 'Requirement: 2 of your Directs must become Gold. Max Limit: ₹1,00,000',
              icon: Icons.shield,
              color: Colors.blueGrey,
            ),
            _buildInfoCard(
              title: 'Ruby Pool (₹70 / joining)',
              desc: 'Requirement: 5 of your Directs must become Platinum. Max Limit: ₹5,00,000',
              icon: Icons.diamond,
              color: Colors.redAccent,
            ),
            _buildInfoCard(
              title: 'Diamond Pool (₹150 / joining)',
              desc: 'Requirement: 5 of your Directs must become Ruby. Max Limit: ₹25,00,000',
              icon: Icons.diamond_outlined,
              color: Colors.blueAccent,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoCard({required String title, required String desc, required IconData icon, required Color color}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: color.withOpacity(0.1),
            child: Icon(icon, color: color),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 4),
                Text(desc, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
              ],
            ),
          )
        ],
      ),
    );
  }
}
