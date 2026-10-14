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
    final List top10List = (_poolStatus?['top10Members'] as List?) ?? [];

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
                          Icon(Icons.all_inclusive, color: Colors.white, size: 20),
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
                        label: 'Pool Fund',
                        value: '₹150',
                        color: const Color(0xFF2563EB),
                        subLabel: 'Per Joining',
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
                              ? Icons.check_circle
                              : status == 'COMPLETED'
                                  ? Icons.verified
                                  : Icons.info_outline,
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
                                    ? '⚡ You are in the active Top 10! The ₹150 pool from every new company activation is distributed equally among active queue members until ₹1,500 is reached.'
                                    : '⏳ You are Rank #${queuePosition ?? 1} in the waiting queue. As active members complete ₹1,500, they graduate and you advance into the Top 10.',
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

            const SizedBox(height: 20),

            // ── ACTIVE TOP 10 MEMBERS QUEUE (10 MEMBERS MEMBER IDS) ──
            _buildTop10QueueSection(top10List),

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
                    icon: Icons.monetization_on,
                    color: const Color(0xFF059669),
                    title: '₹150 Autopool Fund Allocation',
                    desc: '₹150 is contributed from every ₹1,500 joining in the company to the Global FIFO Autopool Fund.',
                  ),
                  const Divider(height: 24, color: Color(0xFFF1F5F9)),
                  _buildRuleRow(
                    icon: Icons.people,
                    color: const Color(0xFF2563EB),
                    title: 'Equal Pool Sharing (FIFO)',
                    desc: 'The ₹150 pool from each activation is shared equally among active queue members until each reaches ₹1,500.',
                  ),
                  const Divider(height: 24, color: Color(0xFFF1F5F9)),
                  _buildRuleRow(
                    icon: Icons.lock_outline,
                    color: const Color(0xFF7C3AED),
                    title: '₹1,500 Capping (100% Cashback)',
                    desc: 'Members continue receiving pool credits on company joinings until they recover their full ₹1,500 joining fee.',
                  ),
                  const Divider(height: 24, color: Color(0xFFF1F5F9)),
                  _buildRuleRow(
                    icon: Icons.sync,
                    color: const Color(0xFFD97706),
                    title: 'Automatic Queue Advancement',
                    desc: 'When a member completes ₹1,500, they graduate from the queue, and the next member steps into the active pool.',
                  ),
                  const Divider(height: 24, color: Color(0xFFF1F5F9)),
                  _buildRuleRow(
                    icon: Icons.check_circle,
                    color: const Color(0xFF0D9488),
                    title: 'No Income Restrictions',
                    desc: 'Earning Direct Referral or Team Level income does NOT stop your Autopool earnings. Every active ID recovers ₹1,500!',
                  ),
                  const Divider(height: 24, color: Color(0xFFF1F5F9)),
                  _buildRuleRow(
                    icon: Icons.account_balance_wallet,
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

  Widget _buildTop10QueueSection(List top10List) {
    return Container(
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
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(7),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF059669), Color(0xFF10B981)],
                      ),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.people, color: Colors.white, size: 18),
                  ),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Active Top 10 Queue',
                        style: GoogleFonts.inter(
                          fontSize: 15.5,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 1),
                      Text(
                        'Live Active Member IDs',
                        style: TextStyle(
                          fontSize: 11.5,
                          color: Colors.grey.shade600,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFA7F3D0)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 7,
                      height: 7,
                      decoration: const BoxDecoration(
                        color: Color(0xFF10B981),
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 5),
                    const Text(
                      'Live FIFO Queue',
                      style: TextStyle(
                        color: Color(0xFF065F46),
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Explanatory Subtitle Box
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: const Row(
              children: [
                Icon(Icons.info_outline, size: 15, color: Color(0xFF64748B)),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    '₹150 from every new company activation is distributed equally among active queue members until ₹1,500 is reached.',
                    style: TextStyle(
                      fontSize: 11,
                      color: Color(0xFF475569),
                      height: 1.35,
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 14),

          if (_isLoadingStatus && top10List.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Center(
                child: SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                ),
              ),
            )
          else if (top10List.isEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Column(
                children: [
                  const Icon(Icons.people_outline, color: Color(0xFF94A3B8), size: 32),
                  const SizedBox(height: 8),
                  const Text(
                    'Loading Active Queue Details...',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF475569)),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Active member IDs will appear here in FIFO order as accounts are activated.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                  ),
                  const SizedBox(height: 10),
                  OutlinedButton.icon(
                    onPressed: _fetchAutopoolStatus,
                    icon: const Icon(Icons.refresh, size: 15),
                    label: const Text('Sync Queue', style: TextStyle(fontSize: 12)),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.primary,
                      side: const BorderSide(color: AppColors.primary),
                      visualDensity: VisualDensity.compact,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                  ),
                ],
              ),
            )
          else ...[
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: top10List.length,
              separatorBuilder: (_, _) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final member = top10List[index] as Map<String, dynamic>;
                final int rank = (member['rank'] as num?)?.toInt() ?? (index + 1);
                final String memberId = (member['memberId'] ?? '---').toString();
                final double memEarnings = ((member['earnings'] ?? 0) as num).toDouble();
                final int progressPct = ((member['progressPercent'] ?? 0) as num).toInt();
                final bool isMe = member['isCurrentUser'] == true;

                return _buildTop10MemberCard(
                  rank: rank,
                  memberId: memberId,
                  earnings: memEarnings,
                  progressPct: progressPct,
                  isMe: isMe,
                );
              },
            ),

            if (top10List.length < 10) ...[
              const SizedBox(height: 10),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline, size: 16, color: Color(0xFF64748B)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Slots #${top10List.length + 1} to #10: Ready for next activations',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF475569),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ],
      ),
    );
  }

  Widget _buildTop10MemberCard({
    required int rank,
    required String memberId,
    required double earnings,
    required int progressPct,
    required bool isMe,
  }) {
    Color rankBg;
    Color rankText;
    Widget rankIcon;

    if (rank == 1) {
      rankBg = const Color(0xFFFEF3C7);
      rankText = const Color(0xFFB45309);
      rankIcon = const Text('🥇', style: TextStyle(fontSize: 14));
    } else if (rank == 2) {
      rankBg = const Color(0xFFF1F5F9);
      rankText = const Color(0xFF475569);
      rankIcon = const Text('🥈', style: TextStyle(fontSize: 14));
    } else if (rank == 3) {
      rankBg = const Color(0xFFFFEDD5);
      rankText = const Color(0xFFC2410C);
      rankIcon = const Text('🥉', style: TextStyle(fontSize: 14));
    } else {
      rankBg = const Color(0xFFF1F5F9);
      rankText = const Color(0xFF64748B);
      rankIcon = Text(
        '#$rank',
        style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w800, color: rankText),
      );
    }

    final double cappedProgress = (earnings / 1500.0).clamp(0.0, 1.0);
    final double remaining = (1500.0 - earnings).clamp(0.0, 1500.0);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: isMe ? const Color(0xFFF0FDF4) : const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isMe ? const Color(0xFF10B981) : const Color(0xFFE2E8F0),
          width: isMe ? 1.5 : 1.0,
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              // Rank Badge
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: rankBg,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: rankText.withOpacity(0.2)),
                ),
                alignment: Alignment.center,
                child: rankIcon,
              ),
              const SizedBox(width: 12),

              // Member ID ONLY (No name rendered as requested)
              Expanded(
                child: Row(
                  children: [
                    Text(
                      memberId,
                      style: GoogleFonts.inter(
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                        color: isMe ? const Color(0xFF065F46) : const Color(0xFF0F172A),
                        letterSpacing: 0.5,
                      ),
                    ),
                    if (isMe) ...[
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFF059669),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          'YOU',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 9.5,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.4,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),

              // Earnings & Remaining
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '₹${earnings.toStringAsFixed(0)} / 1500',
                    style: GoogleFonts.inter(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFF059669),
                    ),
                  ),
                  const SizedBox(height: 1),
                  Text(
                    '₹${remaining.toStringAsFixed(0)} Left',
                    style: TextStyle(
                      fontSize: 10.5,
                      color: Colors.grey.shade600,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ],
          ),

          const SizedBox(height: 8),

          // Mini Progress Bar
          Row(
            children: [
              Expanded(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: cappedProgress,
                    backgroundColor: const Color(0xFFE2E8F0),
                    valueColor: AlwaysStoppedAnimation<Color>(
                      isMe ? const Color(0xFF059669) : const Color(0xFF10B981),
                    ),
                    minHeight: 5,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                '$progressPct%',
                style: GoogleFonts.inter(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF059669),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
