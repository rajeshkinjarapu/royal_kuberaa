import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../providers/dashboard_provider.dart';
import '../utils/constants.dart';

class CashbackScreen extends StatefulWidget {
  const CashbackScreen({super.key});

  @override
  State<CashbackScreen> createState() => _CashbackScreenState();
}

class _CashbackScreenState extends State<CashbackScreen> {
  Map<String, dynamic>? _poolStatus;
  bool _isLoadingStatus = true;

  @override
  void initState() {
    super.initState();
    _fetchAutopoolStatus();
  }

  Future<void> _fetchAutopoolStatus() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      if (token == null) return;

      final res = await http.get(
        Uri.parse('${AppConstants.apiBaseUrl}/user/autopool-status'),
        headers: {'Authorization': 'Bearer $token'},
      );

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true && mounted) {
          setState(() {
            _poolStatus = data['data'];
            _isLoadingStatus = false;
          });
          return;
        }
      }
    } catch (_) {}

    if (mounted) {
      setState(() => _isLoadingStatus = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final dashData = context.watch<DashboardProvider>().dashboardData;

    final double earnings = ((_poolStatus?['autopoolEarnings'] ??
            dashData?['autopoolIncome'] ??
            dashData?['cashbackIncome'] ??
            0.0) as num)
        .toDouble();

    final int? queuePosition = _poolStatus?['queuePosition'] as int?;
    final bool isInTop10 = _poolStatus?['isInTop10'] == true;
    final String status = _poolStatus?['status'] ?? (earnings >= 1500 ? 'COMPLETED' : 'ACTIVE_EARNING');
    final double progress = (earnings / 1500.0).clamp(0.0, 1.0);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          'Autopool Income',
          style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 18),
        ),
        backgroundColor: AppColors.darkNavy,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Refresh Status',
            onPressed: () {
              setState(() => _isLoadingStatus = true);
              _fetchAutopoolStatus();
              context.read<DashboardProvider>().fetchDashboardData();
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16.0, 16.0, 16.0, 40.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── HERO CARD: Total Autopool Received & Progress ──
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF0F766E), Color(0xFF059669), Color(0xFF10B981)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(22),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF059669).withOpacity(0.35),
                    blurRadius: 18,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.all_inclusive_rounded, color: Colors.white, size: 20),
                          SizedBox(width: 8),
                          Text(
                            'FIFO Autopool Wallet',
                            style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.white.withOpacity(0.3)),
                        ),
                        child: Text(
                          status == 'COMPLETED'
                              ? '₹1500 Completed'
                              : isInTop10
                                  ? 'Active Top 10'
                                  : queuePosition != null
                                      ? 'Rank #$queuePosition'
                                      : 'In Queue',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Text(
                    '₹${earnings.toStringAsFixed(2)}',
                    style: GoogleFonts.inter(
                      color: Colors.white,
                      fontSize: 34,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '100% Joining Fee Cashback Target: ₹1,500.00',
                    style: TextStyle(color: Colors.white.withOpacity(0.85), fontSize: 12),
                  ),
                  const SizedBox(height: 16),

                  // Progress Bar
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: LinearProgressIndicator(
                      value: progress,
                      backgroundColor: Colors.white.withOpacity(0.25),
                      valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                      minHeight: 7,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '₹${earnings.toStringAsFixed(0)} / ₹1500 Received',
                        style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                      Text(
                        '${(progress * 100).toStringAsFixed(0)}% Completed',
                        style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // ── LIVE QUEUE STATUS CARD ──
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFFE2E8F0)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.03),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Live FIFO Queue Status',
                        style: GoogleFonts.inter(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF0F172A),
                        ),
                      ),
                      if (_isLoadingStatus)
                        const SizedBox(
                          width: 14,
                          height: 14,
                          child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                        ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // 3 Metric Pills
                  Row(
                    children: [
                      _buildMetricTile(
                        label: 'Queue Rank',
                        value: queuePosition != null ? '#$queuePosition' : '#1',
                        color: isInTop10 ? const Color(0xFF059669) : const Color(0xFFD97706),
                        subLabel: isInTop10 ? 'Active Top 10' : 'Waiting Line',
                      ),
                      const SizedBox(width: 10),
                      _buildMetricTile(
                        label: 'Share / ID',
                        value: '₹15.00',
                        color: const Color(0xFF2563EB),
                        subLabel: 'Every Joining',
                      ),
                      const SizedBox(width: 10),
                      _buildMetricTile(
                        label: 'Max Cap',
                        value: '₹1,500',
                        color: const Color(0xFF7C3AED),
                        subLabel: '100% Recovery',
                      ),
                    ],
                  ),

                  const SizedBox(height: 14),

                  // Live Status Explanation Message
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: isInTop10
                          ? const Color(0xFFECFDF5)
                          : status == 'COMPLETED'
                              ? const Color(0xFFEFF6FF)
                              : const Color(0xFFFFFBEB),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isInTop10
                            ? const Color(0xFFA7F3D0)
                            : status == 'COMPLETED'
                                ? const Color(0xFFBFDBFE)
                                : const Color(0xFFFDE68A),
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          isInTop10
                              ? Icons.flash_on_rounded
                              : status == 'COMPLETED'
                                  ? Icons.verified_rounded
                                  : Icons.hourglass_top_rounded,
                          size: 20,
                          color: isInTop10
                              ? const Color(0xFF059669)
                              : status == 'COMPLETED'
                                  ? const Color(0xFF2563EB)
                                  : const Color(0xFFD97706),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            status == 'COMPLETED'
                                ? '🎉 100% Joining Fee Cashback Completed! You have received the maximum ₹1,500 from the Autopool.'
                                : isInTop10
                                    ? '⚡ You are in the active Top 10! Every new ID activated anywhere in the company credits ₹15 instantly to your wallet.'
                                    : '⏳ You are Rank #${queuePosition ?? 1} in the waiting queue. As members ahead reach ₹1,500, you will advance into the active Top 10.',
                            style: TextStyle(
                              fontSize: 12,
                              color: isInTop10
                                  ? const Color(0xFF065F46)
                                  : status == 'COMPLETED'
                                      ? const Color(0xFF1E40AF)
                                      : const Color(0xFF92400E),
                              fontWeight: FontWeight.w500,
                              height: 1.4,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 22),

            // ── FIFO AUTOPOOL RULES (100% Accurate & Updated) ──
            Text(
              'FIFO Autopool Rules & Benefits',
              style: GoogleFonts.inter(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: const Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 12),

            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildRuleRow(
                    icon: Icons.monetization_on_rounded,
                    color: const Color(0xFF059669),
                    title: '₹150 Autopool Fund Allocation',
                    desc: '₹150 is contributed from every ₹1,500 joining in the company to the Global FIFO Autopool Fund.',
                  ),
                  const Divider(height: 24, color: Color(0xFFF1F5F9)),
                  _buildRuleRow(
                    icon: Icons.groups_rounded,
                    color: const Color(0xFF2563EB),
                    title: 'Top 10 Equal Share (FIFO)',
                    desc: 'The ₹150 is distributed equally among the first 10 members in the active queue (₹15.00 per member on every joining).',
                  ),
                  const Divider(height: 24, color: Color(0xFFF1F5F9)),
                  _buildRuleRow(
                    icon: Icons.lock_clock_rounded,
                    color: const Color(0xFF7C3AED),
                    title: '₹1,500 Capping (100% Cashback)',
                    desc: 'You continue receiving ₹15 per joining until you recover your full ₹1,500 joining fee.',
                  ),
                  const Divider(height: 24, color: Color(0xFFF1F5F9)),
                  _buildRuleRow(
                    icon: Icons.published_with_changes_rounded,
                    color: const Color(0xFFD97706),
                    title: 'Automatic Queue Advancement',
                    desc: 'When a member completes ₹1,500, they graduate from the queue, and the 11th member steps into the active Top 10.',
                  ),
                  const Divider(height: 24, color: Color(0xFFF1F5F9)),
                  _buildRuleRow(
                    icon: Icons.check_circle_outline_rounded,
                    color: const Color(0xFF0D9488),
                    title: 'No Income Restrictions',
                    desc: 'Earning Direct Referral or Team Level income does NOT stop your Autopool earnings. Every active ID recovers ₹1,500!',
                  ),
                  const Divider(height: 24, color: Color(0xFFF1F5F9)),
                  _buildRuleRow(
                    icon: Icons.pie_chart_rounded,
                    color: const Color(0xFFE11D48),
                    title: '90% / 10% Rebirth Wallet Split',
                    desc: 'All Autopool credits split 90% to your Main Wallet (withdrawable) and 10% to your Rebirth Wallet.',
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricTile({
    required String label,
    required String value,
    required Color color,
    required String subLabel,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
        decoration: BoxDecoration(
          color: color.withOpacity(0.06),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Column(
          children: [
            Text(
              label,
              style: TextStyle(fontSize: 11, color: Colors.grey.shade600, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: GoogleFonts.inter(fontSize: 17, fontWeight: FontWeight.w900, color: color),
            ),
            const SizedBox(height: 2),
            Text(
              subLabel,
              style: TextStyle(fontSize: 9.5, color: color, fontWeight: FontWeight.bold),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRuleRow({
    required IconData icon,
    required Color color,
    required String title,
    required String desc,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, size: 18, color: color),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: GoogleFonts.inter(fontSize: 13.5, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
              ),
              const SizedBox(height: 3),
              Text(
                desc,
                style: const TextStyle(fontSize: 12, color: Color(0xFF64748B), height: 1.4),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
