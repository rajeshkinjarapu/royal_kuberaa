import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';
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

  String _formatAmount(dynamic val) {
    if (val == null) return '0';
    final n = double.tryParse(val.toString()) ?? 0.0;
    if ((n - n.round()).abs() < 0.05) {
      return n.round().toString();
    }
    return n.toStringAsFixed(2);
  }

  void _shareReferralLink(String memberId) {
    final link = 'https://royalkuberaa.com/register?sponsorId=$memberId';
    final text = '👑 *Join Royal Kuberaa - India\'s 100% Distribution Hybrid Plan!*\n\n'
        '🎁 *Joining:* ₹1,500 with Tangible Welcome Product Kit!\n'
        '💰 *Direct Bonus:* ₹400 per referral + ₹100 Level 1 = ₹500 Total!\n'
        '👥 *Team Income:* 10 Levels deep (₹300 distributed)!\n'
        '🌊 *100% Autopool Cashback:* Guaranteed ₹1,500 recovery!\n'
        '👑 *Daily Royalty Pools:* Gold, Platinum, Ruby, Diamond!\n\n'
        '👉 *Register Now:* $link\n'
        '🔑 *Sponsor ID:* $memberId';
    Share.share(text, subject: 'Join Royal Kuberaa');
  }

  void _copyToClipboard(String text, String label) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$label copied to clipboard!'),
        backgroundColor: Colors.green,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final dashProvider = context.watch<DashboardProvider>();
    final dashData = dashProvider.dashboardData;
    final memberId = user?['memberId'] ?? 'N/A';
    final isActive = user?['isActive'] == true;

    return RefreshIndicator(
      onRefresh: () => context.read<DashboardProvider>().fetchDashboardData(),
      color: AppColors.primary,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(14.0, 10.0, 14.0, 80.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── TOP PROFILE STRIP ──
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              margin: const EdgeInsets.only(bottom: 10),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.darkNavy, Color(0xFF1E293B)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(color: AppColors.darkNavy.withOpacity(0.12), blurRadius: 8, offset: const Offset(0, 3)),
                ],
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          user?['fullName'] ?? user?['name'] ?? 'Member',
                          style: GoogleFonts.inter(fontSize: 16.5, fontWeight: FontWeight.bold, color: Colors.white),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Member ID: $memberId',
                          style: const TextStyle(fontSize: 12, color: Color(0xFFD4AF37), fontWeight: FontWeight.bold),
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

            // ── ACTIVATION STATUS ALERT BANNER ──
            if (!isActive)
              Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFDC2626), Color(0xFF991B1B)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(color: const Color(0xFFDC2626).withOpacity(0.3), blurRadius: 10, offset: const Offset(0, 4)),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.flash_on, color: Colors.white, size: 24),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Account Inactive (Pending ₹1,500)',
                            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                          const SizedBox(height: 2),
                          const Text(
                            'Activate your ID to start receiving Direct, Level, Royalty & Autopool income!',
                            style: TextStyle(color: Colors.white70, fontSize: 11),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      onPressed: () => context.push('/activate'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: const Color(0xFFDC2626),
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      child: const Text('Activate', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11)),
                    ),
                  ],
                ),
              )
            else
              Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3)),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.verified, color: Color(0xFF059669), size: 16),
                    SizedBox(width: 8),
                    Text(
                      'Verified Active ID • Welcome Product Kit Active',
                      style: TextStyle(color: Color(0xFF065F46), fontSize: 11.5, fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
              ),
            
            if (dashProvider.isLoading && dashData == null)
              const Center(child: Padding(padding: EdgeInsets.all(40.0), child: CircularProgressIndicator(color: AppColors.primary)))
            else if (dashProvider.errorMessage.isNotEmpty && dashData == null)
              Center(child: Text(dashProvider.errorMessage, style: const TextStyle(color: AppColors.error)))
            else ...[
              // ── MAIN WALLET CARD ──
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppColors.primary, AppColors.primaryDark],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(color: AppColors.primary.withOpacity(0.25), blurRadius: 10, offset: const Offset(0, 4)),
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
                            Icon(Icons.account_balance_wallet, color: Colors.white70, size: 15),
                            SizedBox(width: 6),
                            Text('Main Wallet Balance', style: TextStyle(color: Colors.white70, fontSize: 11.5, fontWeight: FontWeight.w500)),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.18),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              CircleAvatar(radius: 3, backgroundColor: Color(0xFF10B981)),
                              SizedBox(width: 4),
                              Text('Live', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '₹${_formatAmount(dashData?['mainWallet'])}',
                      style: GoogleFonts.inter(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w900, letterSpacing: -0.5),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _buildWalletAction(Icons.add_circle_outline, 'Deposit', () => context.push('/deposit')),
                        const SizedBox(width: 6),
                        _buildWalletAction(Icons.flash_on, 'Activate', () => context.push('/activate')),
                        const SizedBox(width: 6),
                        _buildWalletAction(Icons.arrow_upward, 'Withdraw', () => context.push('/withdraw')),
                        const SizedBox(width: 6),
                        _buildWalletAction(Icons.swap_horiz, 'Transfer', () => context.push('/transfer')),
                      ],
                    )
                  ],
                ),
              ),
              const SizedBox(height: 12),

              // ── INVITE & EARN ₹400 REFERRAL CARD ──
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFFFFBEB), Color(0xFFFEF3C7)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.4)),
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
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: const Color(0xFFD97706).withOpacity(0.15),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(Icons.card_giftcard, color: Color(0xFFB45309), size: 18),
                            ),
                            const SizedBox(width: 8),
                            const Text(
                              'Invite & Earn ₹400 Direct',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF92400E)),
                            ),
                          ],
                        ),
                        InkWell(
                          onTap: () => _copyToClipboard(memberId, 'Sponsor ID'),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: const Color(0xFFF59E0B)),
                            ),
                            child: Row(
                              children: [
                                Text('ID: $memberId', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFFB45309))),
                                const SizedBox(width: 4),
                                const Icon(Icons.copy, size: 12, color: Color(0xFFB45309)),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () => _copyToClipboard('https://royalkuberaa.com/register?sponsorId=$memberId', 'Referral Link'),
                            icon: const Icon(Icons.link, size: 15),
                            label: const Text('Copy Link', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: const Color(0xFF92400E),
                              side: const BorderSide(color: Color(0xFFF59E0B)),
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () => _shareReferralLink(memberId),
                            icon: const Icon(Icons.share, size: 15, color: Colors.white),
                            label: const Text('Share WhatsApp', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white)),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF059669),
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Income Overview', style: GoogleFonts.inter(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                  InkWell(
                    onTap: () => context.push('/finance'),
                    child: const Text('View All', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primary)),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              
              // 6 Income Overview Cards in a 2x3 Grid
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                childAspectRatio: 1.48,
                children: [
                  _buildStatCard(
                    title: 'Total Earning',
                    value: '₹${_formatAmount(dashData?['totalEarnings'])}',
                    icon: Icons.account_balance_wallet,
                    color: const Color(0xFF059669),
                    onTap: () => context.push('/finance'),
                  ),
                  _buildStatCard(
                    title: 'Direct Income',
                    value: '₹${_formatAmount(dashData?['directIncome'])}',
                    icon: Icons.person_add_alt_1,
                    color: const Color(0xFF2563EB),
                    onTap: () => context.push('/network'),
                  ),
                  _buildStatCard(
                    title: 'Team Level Income',
                    value: '₹${_formatAmount(dashData?['levelIncome'] ?? dashData?['teamLevelIncome'])}',
                    icon: Icons.people,
                    color: const Color(0xFF7C3AED),
                    onTap: () => context.push('/network'),
                  ),
                  _buildStatCard(
                    title: 'Royalty Income',
                    value: '₹${_formatAmount(dashData?['royaltyIncome'])}',
                    icon: Icons.star,
                    color: const Color(0xFFD97706),
                    onTap: () => context.push('/royalty'),
                  ),
                  _buildStatCard(
                    title: 'Autopool Income',
                    value: '₹${_formatAmount(dashData?['cashbackIncome'] ?? dashData?['autopoolIncome'])}',
                    icon: Icons.all_inclusive,
                    color: const Color(0xFF0D9488),
                    onTap: () => context.push('/cashback'),
                  ),
                  _buildStatCard(
                    title: 'Rebirth Wallet',
                    value: '₹${_formatAmount(dashData?['rebirthWallet'])}',
                    icon: Icons.monetization_on,
                    color: const Color(0xFFE11D48),
                    onTap: () => context.push('/rebirth'),
                  ),
                ],
              ),
            ]
          ],
        ),
      ),
    );
  }

  Widget _buildWalletAction(IconData icon, String label, VoidCallback onTap) {
    return Expanded(
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(10),
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.16),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.white.withOpacity(0.12)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, color: Colors.white, size: 15),
                const SizedBox(width: 5),
                Text(label, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
    VoidCallback? onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: [
              BoxShadow(color: color.withOpacity(0.06), blurRadius: 8, offset: const Offset(0, 3)),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 18, color: color),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.inter(
                      color: const Color(0xFF64748B),
                      fontSize: 11.5,
                      fontWeight: FontWeight.w600,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    alignment: Alignment.centerLeft,
                    child: Text(
                      value,
                      style: GoogleFonts.inter(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: const Color(0xFF0F172A),
                        letterSpacing: -0.3,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
