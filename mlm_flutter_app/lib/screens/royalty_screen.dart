import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../providers/dashboard_provider.dart';
import '../utils/constants.dart';

class RoyaltyScreen extends StatefulWidget {
  const RoyaltyScreen({super.key});

  @override
  State<RoyaltyScreen> createState() => _RoyaltyScreenState();
}

class _RoyaltyScreenState extends State<RoyaltyScreen> {
  bool _isLoading = false;
  Map<String, dynamic>? _breakdownData;
  List<dynamic> _allTransactions = [];
  String _selectedFilter = 'ALL';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchRoyaltyBreakdown();
    });
  }

  Future<void> _fetchRoyaltyBreakdown() async {
    setState(() => _isLoading = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

      // Fetch breakdown data
      if (token != null) {
        final response = await http.get(
          Uri.parse('${AppConstants.apiBaseUrl}/royalty/breakdown'),
          headers: {'Authorization': 'Bearer $token'},
        );

        if (response.statusCode == 200) {
          final resData = jsonDecode(response.body);
          if (resData['success'] == true) {
            setState(() {
              _breakdownData = resData['data'];
              _allTransactions = resData['data']?['allTransactions'] ?? [];
            });
          }
        }
      }

      // Also refresh dashboard provider for synced numbers
      if (mounted) {
        await context.read<DashboardProvider>().fetchDashboardData();
      }
    } catch (e) {
      debugPrint('Error fetching royalty breakdown: $e');
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final dashData = context.watch<DashboardProvider>().dashboardData;
    final royaltyStats = dashData?['royaltyStats'];

    // Overall royalty income
    final double totalRoyalty = ((_breakdownData?['totalRoyalty'] ??
            dashData?['royaltyIncome'] ??
            0.0) as num)
        .toDouble();

    // Pool specific values with fallback to dashboard royaltyStats
    final double goldEarned = ((_getPoolStat('GOLD', 'earned') ??
            royaltyStats?['goldEarnings'] ??
            0.0) as num)
        .toDouble();
    final double platinumEarned = ((_getPoolStat('PLATINUM', 'earned') ??
            royaltyStats?['platinumEarnings'] ??
            0.0) as num)
        .toDouble();
    final double rubyEarned = ((_getPoolStat('RUBY', 'earned') ??
            royaltyStats?['rubyEarnings'] ??
            0.0) as num)
        .toDouble();
    final double diamondEarned = ((_getPoolStat('DIAMOND', 'earned') ??
            royaltyStats?['diamondEarnings'] ??
            0.0) as num)
        .toDouble();

    final userRank = (_breakdownData?['rank'] ??
            royaltyStats?['rank'] ??
            dashData?['user']?['rank'] ??
            'STARTER')
        .toString()
        .toUpperCase();

    // Pool configurations
    final pools = [
      {
        'id': 'GOLD',
        'title': 'Gold Pool',
        'rate': '₹120 / joining',
        'desc': 'Requirement: Refer ANY 2 Directs',
        'cap': 20000.0,
        'earned': goldEarned,
        'icon': Icons.star_rounded,
        'color': const Color(0xFFF59E0B),
        'bgGradient': [const Color(0xFFFFFBEB), const Color(0xFFFEF3C7)],
        'isQualified': _isQualifiedFor('GOLD', userRank),
      },
      {
        'id': 'PLATINUM',
        'title': 'Platinum Pool',
        'rate': '₹60 / joining',
        'desc': 'Requirement: 2 of your Directs must become Gold',
        'cap': 100000.0,
        'earned': platinumEarned,
        'icon': Icons.shield_rounded,
        'color': const Color(0xFF3B82F6),
        'bgGradient': [const Color(0xFFEFF6FF), const Color(0xFFDBEAFE)],
        'isQualified': _isQualifiedFor('PLATINUM', userRank),
      },
      {
        'id': 'RUBY',
        'title': 'Ruby Pool',
        'rate': '₹70 / joining',
        'desc': 'Requirement: 5 of your Directs must become Platinum',
        'cap': 500000.0,
        'earned': rubyEarned,
        'icon': Icons.diamond_rounded,
        'color': const Color(0xFFEF4444),
        'bgGradient': [const Color(0xFFFEF2F2), const Color(0xFFFEE2E2)],
        'isQualified': _isQualifiedFor('RUBY', userRank),
      },
      {
        'id': 'DIAMOND',
        'title': 'Diamond Pool',
        'rate': '₹150 / joining',
        'desc': 'Requirement: 5 of your Directs must become Ruby',
        'cap': 2500000.0,
        'earned': diamondEarned,
        'icon': Icons.auto_awesome_rounded,
        'color': const Color(0xFF8B5CF6),
        'bgGradient': [const Color(0xFFF5F3FF), const Color(0xFFEDE9FE)],
        'isQualified': _isQualifiedFor('DIAMOND', userRank),
      },
    ];

    // Filter transactions
    final filteredTransactions = _getFilteredTransactions();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Royalty Income'),
        backgroundColor: AppColors.darkNavy,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Refresh',
            onPressed: _fetchRoyaltyBreakdown,
          )
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _fetchRoyaltyBreakdown,
        color: AppColors.primary,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16.0, 16.0, 16.0, 40.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top Hero Card: Total Royalty Earnings
              _buildHeroEarningsCard(totalRoyalty, userRank, goldEarned,
                  platinumEarned, rubyEarned, diamondEarned),
              const SizedBox(height: 24),

              // Section Header: How Royalty Works & Pool Breakdown
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Global Royalty Pools',
                    style: GoogleFonts.inter(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.amber.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      'Midnight 12:00 AM',
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFFB45309),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                'Tap any pool below to view detailed breakdown & payout transactions',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 16),

              // Interactive Pool Cards
              ...pools.map((p) => _buildInteractivePoolCard(p)),
              const SizedBox(height: 24),

              // Royalty Payouts History Section
              _buildPayoutHistorySection(pools, filteredTransactions),
            ],
          ),
        ),
      ),
    );
  }

  // Hero Card with Total Royalty & Quick Pool Badges
  Widget _buildHeroEarningsCard(
      double total,
      String rank,
      double gold,
      double plat,
      double ruby,
      double diamond) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFF59E0B), Color(0xFFEA580C)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFEA580C).withOpacity(0.35),
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
                  Icon(Icons.account_balance_wallet_rounded,
                      color: Colors.white, size: 20),
                  SizedBox(width: 8),
                  Text(
                    'Total Royalty Earnings',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white38),
                ],
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.workspace_premium_rounded,
                        color: Colors.white, size: 14),
                    const SizedBox(width: 4),
                    Text(
                      rank,
                      style: GoogleFonts.inter(
                        color: Colors.white,
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
          Text(
            '₹${total.toStringAsFixed(2)}',
            style: GoogleFonts.inter(
              color: Colors.white,
              fontSize: 36,
              fontWeight: FontWeight.w900,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 14),
          const Divider(color: Colors.white24, height: 1),
          const SizedBox(height: 12),

          // Mini Pool Chips inside hero card
          Text(
            'Earnings By Pool',
            style: GoogleFonts.inter(
              color: Colors.white70,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              _buildMiniChip('Gold', gold, Colors.amber),
              const SizedBox(width: 6),
              _buildMiniChip('Plat', plat, Colors.lightBlueAccent),
              const SizedBox(width: 6),
              _buildMiniChip('Ruby', ruby, Colors.redAccent),
              const SizedBox(width: 6),
              _buildMiniChip('Dia', diamond, Colors.purpleAccent),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMiniChip(String label, double amount, Color dotColor) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.18),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.white12),
        ),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 6,
                  height: 6,
                  decoration: BoxDecoration(
                    color: dotColor,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 4),
                Text(
                  label,
                  style: GoogleFonts.inter(
                    color: Colors.white70,
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 2),
            Text(
              '₹${amount.toStringAsFixed(0)}',
              style: GoogleFonts.inter(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Interactive Pool Card with Click to View Modal
  Widget _buildInteractivePoolCard(Map<String, dynamic> pool) {
    final String id = pool['id'];
    final String title = pool['title'];
    final String rate = pool['rate'];
    final String desc = pool['desc'];
    final double cap = pool['cap'];
    final double earned = pool['earned'];
    final IconData icon = pool['icon'];
    final Color color = pool['color'];
    final bool isQualified = pool['isQualified'];
    final bool isCapped = earned >= cap;

    final double progress = (earned / cap).clamp(0.0, 1.0);
    final double percentage = (progress * 100);

    return InkWell(
      onTap: () => _showPoolDetailsModal(pool),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        margin: const EdgeInsets.only(bottom: 14),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isQualified ? color.withOpacity(0.4) : AppColors.border,
            width: isQualified ? 1.5 : 1.0,
          ),
          boxShadow: [
            BoxShadow(
              color: isQualified
                  ? color.withOpacity(0.08)
                  : Colors.black.withOpacity(0.02),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Row: Icon, Title, Status Badge
            Row(
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundColor: color.withOpacity(0.12),
                  child: Icon(icon, color: color, size: 22),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Text(
                            title,
                            style: GoogleFonts.inter(
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            '($rate)',
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              color: color,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        desc,
                        style: GoogleFonts.inter(
                          color: AppColors.textSecondary,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
                _buildStatusBadge(isQualified, isCapped),
              ],
            ),
            const SizedBox(height: 14),

            // Highlighted Earnings Row
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: color.withOpacity(0.05),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: color.withOpacity(0.15)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Earned from this Pool',
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '₹${earned.toStringAsFixed(2)}',
                        style: GoogleFonts.inter(
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          color: color,
                        ),
                      ),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        'Max Lifetime Cap',
                        style: GoogleFonts.inter(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '₹${NumberFormat('#,##,###').format(cap.toInt())}',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),

            // Progress Bar
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Capping Progress',
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textSecondary,
                  ),
                ),
                Text(
                  '${percentage.toStringAsFixed(1)}%',
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: progress,
                minHeight: 6,
                backgroundColor: Colors.grey.shade100,
                valueColor: AlwaysStoppedAnimation<Color>(color),
              ),
            ),
            const SizedBox(height: 10),

            // Click action prompt
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Text(
                  'Tap to view payouts history',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: color,
                  ),
                ),
                const SizedBox(width: 4),
                Icon(Icons.arrow_forward_ios_rounded, size: 11, color: color),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBadge(bool isQualified, bool isCapped) {
    if (isCapped) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: Colors.amber.shade50,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.amber.shade300),
        ),
        child: Text(
          'CAPPED',
          style: GoogleFonts.inter(
            fontSize: 10,
            fontWeight: FontWeight.bold,
            color: Colors.amber.shade900,
          ),
        ),
      );
    }

    if (isQualified) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: const Color(0xFFD1FAE5),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.check_circle_rounded,
                size: 11, color: Color(0xFF059669)),
            const SizedBox(width: 3),
            Text(
              'ACTIVE',
              style: GoogleFonts.inter(
                fontSize: 10,
                fontWeight: FontWeight.bold,
                color: const Color(0xFF065F46),
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade300),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.lock_rounded, size: 11, color: Colors.grey.shade600),
          const SizedBox(width: 3),
          Text(
            'LOCKED',
            style: GoogleFonts.inter(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              color: Colors.grey.shade600,
            ),
          ),
        ],
      ),
    );
  }

  // Modal Bottom Sheet showing specific pool earnings and transaction history
  void _showPoolDetailsModal(Map<String, dynamic> pool) {
    final String poolId = pool['id'];
    final String title = pool['title'];
    final String rate = pool['rate'];
    final String desc = pool['desc'];
    final double cap = pool['cap'];
    final double earned = pool['earned'];
    final Color color = pool['color'];
    final IconData icon = pool['icon'];
    final bool isQualified = pool['isQualified'];
    final double remainingCap = (cap - earned).clamp(0.0, cap);

    // Filter transactions for this specific pool
    final poolTxs = _getTransactionsForPool(poolId);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          height: MediaQuery.of(context).size.height * 0.78,
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: Column(
            children: [
              // Modal Handle & Header
              const SizedBox(height: 12),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 12, 12),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 20,
                      backgroundColor: color.withOpacity(0.12),
                      child: Icon(icon, color: color, size: 22),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            title,
                            style: GoogleFonts.inter(
                              fontSize: 17,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          Text(
                            '$rate • Daily Share',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: color,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),

              // Modal Content
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(20),
                  children: [
                    // Stats 3-Column Box
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: color.withOpacity(0.06),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: color.withOpacity(0.2)),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: _buildModalStatCol(
                              'Earned',
                              '₹${earned.toStringAsFixed(2)}',
                              color,
                            ),
                          ),
                          Container(
                            height: 36,
                            width: 1,
                            color: color.withOpacity(0.2),
                          ),
                          Expanded(
                            child: _buildModalStatCol(
                              'Max Cap',
                              '₹${NumberFormat('#,##,###').format(cap.toInt())}',
                              AppColors.textPrimary,
                            ),
                          ),
                          Container(
                            height: 36,
                            width: 1,
                            color: color.withOpacity(0.2),
                          ),
                          Expanded(
                            child: _buildModalStatCol(
                              'Remaining',
                              '₹${NumberFormat('#,##,###').format(remainingCap.toInt())}',
                              const Color(0xFF059669),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Requirement card
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.grey.shade50,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.grey.shade200),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(
                            isQualified
                                ? Icons.verified_rounded
                                : Icons.info_outline_rounded,
                            size: 18,
                            color: isQualified
                                ? const Color(0xFF059669)
                                : Colors.grey.shade600,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  isQualified
                                      ? 'You are Qualified for this Pool'
                                      : 'Qualification Requirement',
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: isQualified
                                        ? const Color(0xFF059669)
                                        : AppColors.textPrimary,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  desc,
                                  style: GoogleFonts.inter(
                                    fontSize: 11,
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Section Title: Payout History
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Payout Transactions',
                          style: GoogleFonts.inter(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        Text(
                          '${poolTxs.length} credited',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: color,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Transactions List for this Pool
                    if (poolTxs.isEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(
                            vertical: 36, horizontal: 16),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade50,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.grey.shade200),
                        ),
                        child: Column(
                          children: [
                            Icon(Icons.history_toggle_off_rounded,
                                size: 40, color: Colors.grey.shade400),
                            const SizedBox(height: 10),
                            Text(
                              'No Payouts From $title Yet',
                              style: GoogleFonts.inter(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              isQualified
                                  ? 'Your next daily pool share will be credited at 12:00 AM midnight!'
                                  : 'Achieve the qualification requirement to start receiving daily shares from this pool.',
                              textAlign: TextAlign.center,
                              style: GoogleFonts.inter(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      )
                    else
                      ...poolTxs.map((tx) => _buildTransactionCard(tx, color)),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildModalStatCol(String label, String value, Color valColor) {
    return Column(
      children: [
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 10,
            fontWeight: FontWeight.w600,
            color: AppColors.textSecondary,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: GoogleFonts.inter(
            fontSize: 13,
            fontWeight: FontWeight.w900,
            color: valColor,
          ),
        ),
      ],
    );
  }

  // Royalty Payouts History Section with Filter Tabs
  Widget _buildPayoutHistorySection(
      List<Map<String, dynamic>> pools, List<dynamic> txs) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Royalty Payouts History',
          style: GoogleFonts.inter(
            fontSize: 17,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Filter by pool to see daily midnight credit records',
          style: GoogleFonts.inter(
            fontSize: 12,
            color: AppColors.textSecondary,
          ),
        ),
        const SizedBox(height: 12),

        // Filter Chips Bar
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              _buildFilterChip('ALL', 'All Pools (${_allTransactions.length})'),
              const SizedBox(width: 8),
              _buildFilterChip(
                  'GOLD', 'Gold (${_getTransactionsForPool('GOLD').length})'),
              const SizedBox(width: 8),
              _buildFilterChip('PLATINUM',
                  'Platinum (${_getTransactionsForPool('PLATINUM').length})'),
              const SizedBox(width: 8),
              _buildFilterChip(
                  'RUBY', 'Ruby (${_getTransactionsForPool('RUBY').length})'),
              const SizedBox(width: 8),
              _buildFilterChip('DIAMOND',
                  'Diamond (${_getTransactionsForPool('DIAMOND').length})'),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Transactions list
        if (_isLoading && _allTransactions.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 30),
            child: Center(child: CircularProgressIndicator()),
          )
        else if (txs.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              children: [
                Icon(Icons.inbox_rounded, size: 40, color: Colors.grey.shade400),
                const SizedBox(height: 10),
                Text(
                  _selectedFilter == 'ALL'
                      ? 'No Royalty Payouts Yet'
                      : 'No Payouts for $_selectedFilter Pool',
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Royalty shares are credited every midnight at 12:00 AM once qualified.',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          )
        else
          ...txs.map((tx) {
            final poolKey = _getPoolKeyForTransaction(tx);
            final poolColor = _getColorForPool(poolKey);
            return _buildTransactionCard(tx, poolColor);
          }),
      ],
    );
  }

  Widget _buildFilterChip(String filterKey, String label) {
    final bool isSelected = _selectedFilter == filterKey;
    return InkWell(
      onTap: () => setState(() => _selectedFilter = filterKey),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.darkNavy : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.darkNavy : AppColors.border,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: AppColors.darkNavy.withOpacity(0.2),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  )
                ]
              : null,
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 12,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            color: isSelected ? Colors.white : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }

  Widget _buildTransactionCard(dynamic tx, Color poolColor) {
    final double amount = ((tx['amount'] ?? 0.0) as num).toDouble();
    final String remark = tx['remark'] ?? 'Royalty Pool Share';
    final String dateStr = _formatDate(tx['date'] ?? tx['createdAt']);
    final String poolTag = _getPoolKeyForTransaction(tx);

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 18,
            backgroundColor: const Color(0xFF10B981).withOpacity(0.12),
            child: const Icon(Icons.arrow_downward_rounded,
                color: Color(0xFF10B981), size: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: poolColor.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        poolTag,
                        style: GoogleFonts.inter(
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                          color: poolColor,
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        remark,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  dateStr,
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Text(
            '+₹${amount.toStringAsFixed(2)}',
            style: GoogleFonts.inter(
              fontSize: 15,
              fontWeight: FontWeight.w900,
              color: const Color(0xFF10B981),
            ),
          ),
        ],
      ),
    );
  }

  // Helpers
  dynamic _getPoolStat(String poolId, String field) {
    if (_breakdownData != null && _breakdownData!['pools'] is List) {
      final list = _breakdownData!['pools'] as List;
      final match = list.firstWhere(
        (p) => p['id'] == poolId,
        orElse: () => null,
      );
      if (match != null) return match[field];
    }
    return null;
  }

  bool _isQualifiedFor(String poolId, String userRank) {
    const ranks = ['STARTER', 'GOLD', 'PLATINUM', 'RUBY', 'DIAMOND', 'OWNER'];
    final userIdx = ranks.indexOf(userRank);
    final poolIdx = ranks.indexOf(poolId);
    if (poolIdx != -1 && userIdx >= poolIdx) return true;

    // Check breakdown server response
    final isQ = _getPoolStat(poolId, 'isQualified');
    if (isQ is bool) return isQ;

    return false;
  }

  String _getPoolKeyForTransaction(dynamic tx) {
    final rem = ((tx['remark'] ?? '') + ' ' + (tx['description'] ?? ''))
        .toString()
        .toUpperCase();
    if (rem.includes('PLATINUM')) return 'PLATINUM';
    if (rem.includes('RUBY')) return 'RUBY';
    if (rem.includes('DIAMOND')) return 'DIAMOND';
    return 'GOLD';
  }

  Color _getColorForPool(String poolKey) {
    switch (poolKey) {
      case 'PLATINUM':
        return const Color(0xFF3B82F6);
      case 'RUBY':
        return const Color(0xFFEF4444);
      case 'DIAMOND':
        return const Color(0xFF8B5CF6);
      default:
        return const Color(0xFFF59E0B);
    }
  }

  List<dynamic> _getTransactionsForPool(String poolId) {
    return _allTransactions.where((tx) {
      final key = _getPoolKeyForTransaction(tx);
      return key == poolId;
    }).toList();
  }

  List<dynamic> _getFilteredTransactions() {
    if (_selectedFilter == 'ALL') return _allTransactions;
    return _getTransactionsForPool(_selectedFilter);
  }

  String _formatDate(dynamic dateVal) {
    if (dateVal == null) return 'Recent';
    try {
      final date = DateTime.parse(dateVal.toString()).toLocal();
      return DateFormat('dd MMM yyyy, hh:mm a').format(date);
    } catch (_) {
      return dateVal.toString();
    }
  }
}
