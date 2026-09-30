import 'package:flutter/material.dart';
import '../login_screen.dart';
import 'network_tree_screen.dart';
import 'withdraw_screen.dart';
import 'wallets_screen.dart';
import '../../services/api_service.dart';

class MemberDashboard extends StatefulWidget {
  const MemberDashboard({Key? key}) : super(key: key);

  @override
  State<MemberDashboard> createState() => _MemberDashboardState();
}

class _MemberDashboardState extends State<MemberDashboard> with SingleTickerProviderStateMixin {
  bool _isLoading = true;
  Map<String, dynamic>? _dashboardData;
  late AnimationController _animationController;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _fetchData();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _fetchData() async {
    final data = await ApiService.getDashboardData(1);
    if (mounted) {
      setState(() {
        _dashboardData = data;
        _isLoading = false;
      });
      _animationController.forward();
    }
  }

  void _logout(BuildContext context) {
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (context) => const LoginScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Color(0xFF030712), // Deep Space Black
        body: Center(child: CircularProgressIndicator(color: Color(0xFF38BDF8))),
      );
    }

    final user = _dashboardData?['user'] ?? {'name': 'Rajesh Kumar', 'member_id': 'RK123456', 'rank': 'gold'};
    final wallet = _dashboardData?['wallet'] ?? {'main_balance': '12500', 'rebirth_balance': '600'};
    final autopool = _dashboardData?['autopool'] ?? {'pool_level': 1};

    double mainBal = double.tryParse(wallet["main_balance"].toString()) ?? 12500;
    double rebirthBal = double.tryParse(wallet["rebirth_balance"].toString()) ?? 600;

    return Scaffold(
      backgroundColor: const Color(0xFF030712), // Ultra modern dark background
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text('Dashboard', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold, letterSpacing: 1)),
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_active_outlined, color: Color(0xFF38BDF8)),
            onPressed: () {},
          )
        ],
      ),
      drawer: _buildDrawer(context, user),
      body: RefreshIndicator(
        color: const Color(0xFF38BDF8),
        backgroundColor: const Color(0xFF1E293B),
        onRefresh: _fetchData,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildAnimatedItem(
                index: 0,
                child: _buildAdvancedHeader(user),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildAnimatedItem(
                      index: 1,
                      child: const Text('My Earnings Overview', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: 0.5)),
                    ),
                    const SizedBox(height: 20),
                    _buildAnimatedItem(
                      index: 2,
                      child: _buildVibrantGrid(mainBal, rebirthBal),
                    ),
                    const SizedBox(height: 32),
                    _buildAnimatedItem(
                      index: 3,
                      child: const Text('Network Activity', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Colors.white, letterSpacing: 0.5)),
                    ),
                    const SizedBox(height: 16),
                    _buildAnimatedItem(
                      index: 4,
                      child: _buildFuturisticNetworkList(autopool),
                    ),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAnimatedItem({required int index, required Widget child}) {
    return AnimatedBuilder(
      animation: _animationController,
      builder: (context, child) {
        final delay = index * 0.1;
        final start = delay;
        final end = delay + 0.5 > 1.0 ? 1.0 : delay + 0.5;
        
        final curvedAnimation = CurvedAnimation(
          parent: _animationController,
          curve: Interval(start, end, curve: Curves.easeOutCubic),
        );

        return Opacity(
          opacity: curvedAnimation.value,
          child: Transform.translate(
            offset: Offset(0, 40 * (1 - curvedAnimation.value)),
            child: child,
          ),
        );
      },
      child: child,
    );
  }

  Widget _buildAdvancedHeader(Map<String, dynamic> user) {
    String rankName = (user['rank'] ?? 'Free').toString().toUpperCase();
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.05), width: 1),
        boxShadow: [
          BoxShadow(color: const Color(0xFF38BDF8).withOpacity(0.15), blurRadius: 30, offset: const Offset(0, 10)),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: const LinearGradient(colors: [Color(0xFF38BDF8), Color(0xFF818CF8)]),
              boxShadow: [BoxShadow(color: const Color(0xFF818CF8).withOpacity(0.5), blurRadius: 15)],
            ),
            child: CircleAvatar(
              radius: 28,
              backgroundColor: const Color(0xFF1E293B),
              child: Text(user['name']?.substring(0, 1).toUpperCase() ?? 'U', style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('WELCOME BACK', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
                const SizedBox(height: 4),
                Text(user['name'] ?? 'User', style: const TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                const SizedBox(height: 8),
                Row(
                  children: [
                    _buildNeonBadge(rankName, const [Color(0xFFF59E0B), Color(0xFFFCD34D)]),
                    const SizedBox(width: 8),
                    _buildNeonBadge(user['member_id'] ?? 'ID', const [Color(0xFF38BDF8), Color(0xFF818CF8)]),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNeonBadge(String text, List<Color> colors) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [colors[0].withOpacity(0.2), colors[1].withOpacity(0.2)]),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: colors[0].withOpacity(0.5), width: 1),
      ),
      child: Text(text, style: TextStyle(color: colors[1], fontWeight: FontWeight.bold, fontSize: 10, letterSpacing: 0.5)),
    );
  }

  Widget _buildVibrantGrid(double mainBal, double rebirthBal) {
    return LayoutBuilder(
      builder: (context, constraints) {
        int crossAxisCount = constraints.maxWidth > 800 ? 4 : (constraints.maxWidth > 500 ? 3 : 2);
        
        return GridView.count(
          crossAxisCount: crossAxisCount,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          childAspectRatio: 0.95, // Squarish modern cards
          children: [
            _buildVibrantCard('Total Earnings', 18500, Icons.rocket_launch_rounded, const [Color(0xFF06B6D4), Color(0xFF3B82F6)]), // Cyan to Blue
            _buildVibrantCard('Main Wallet', mainBal, Icons.account_balance_wallet_rounded, const [Color(0xFF10B981), Color(0xFF047857)]), // Emerald
            _buildVibrantCard('Direct Referral', 4500, Icons.person_add_alt_1_rounded, const [Color(0xFFF43F5E), Color(0xFFF97316)]), // Rose to Orange
            _buildVibrantCard('Team Income', 2500, Icons.groups_rounded, const [Color(0xFF8B5CF6), Color(0xFFD946EF)]), // Purple to Fuchsia
            _buildVibrantCard('Withdraw Fund', rebirthBal, Icons.currency_exchange_rounded, const [Color(0xFF14B8A6), Color(0xFF0F766E)]), // Teal
            _buildVibrantCard('Autopool Fund', 8000, Icons.all_inclusive_rounded, const [Color(0xFF6366F1), Color(0xFF4338CA)]), // Indigo
            _buildVibrantCard('All Ranks', 0, Icons.workspace_premium_rounded, const [Color(0xFFF59E0B), Color(0xFFD97706)]), // Amber
          ],
        );
      }
    );
  }

  Widget _buildVibrantCard(String title, double amount, IconData icon, List<Color> gradientColors) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: gradientColors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(color: gradientColors[0].withOpacity(0.4), blurRadius: 15, offset: const Offset(0, 8)),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: Colors.white, size: 24),
              ),
              Icon(Icons.arrow_outward_rounded, color: Colors.white.withOpacity(0.5), size: 20),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title.toUpperCase(), 
                style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 8),
              TweenAnimationBuilder<double>(
                tween: Tween<double>(begin: 0, end: amount),
                duration: const Duration(seconds: 2),
                curve: Curves.easeOutQuart,
                builder: (context, value, child) {
                  return Text(
                    '₹ ${value.toInt()}',
                    style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w900, letterSpacing: -0.5),
                  );
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFuturisticNetworkList(Map<String, dynamic> autopool) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withOpacity(0.05), width: 1),
      ),
      child: Column(
        children: [
          _buildGlassRow('Direct Referrals', '3', Icons.person_add_outlined, const Color(0xFF38BDF8)),
          Divider(height: 1, color: Colors.white.withOpacity(0.05)),
          _buildGlassRow('Total Team Size', '124', Icons.account_tree_outlined, const Color(0xFFF43F5E)),
          Divider(height: 1, color: Colors.white.withOpacity(0.05)),
          _buildGlassRow('Autopool Status', 'Level ${autopool["pool_level"]}', Icons.change_circle_outlined, const Color(0xFF10B981)),
        ],
      ),
    );
  }

  Widget _buildGlassRow(String title, String value, IconData icon, Color iconColor) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: iconColor, size: 22),
          ),
          const SizedBox(width: 16),
          Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: Colors.white)),
          const Spacer(),
          Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
        ],
      ),
    );
  }

  Widget _buildDrawer(BuildContext context, Map<String, dynamic> user) {
    return Drawer(
      backgroundColor: const Color(0xFF030712),
      child: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.only(top: 60, bottom: 24, left: 24),
            decoration: const BoxDecoration(
              border: Border(bottom: BorderSide(color: Color(0xFF1E293B), width: 1)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.hub_rounded, color: Color(0xFF38BDF8), size: 40),
                const SizedBox(height: 16),
                Text(user['name'] ?? 'User', style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                Text('ID: ${user["member_id"]}', style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13)),
              ],
            ),
          ),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.only(top: 16, bottom: 24),
              children: [
                _buildDrawerSectionTitle('MAIN'),
                _buildDrawerItem(context, 'Dashboard', Icons.dashboard_outlined, true, () => Navigator.pop(context)),
                _buildDrawerItem(context, 'Wallets', Icons.account_balance_wallet_outlined, false, () {
                  Navigator.pop(context);
                  Navigator.push(context, MaterialPageRoute(builder: (context) => const WalletsScreen()));
                }),
                _buildDrawerItem(context, 'AutoPool Matrix', Icons.account_tree_outlined, false, () {}),
                _buildDrawerItem(context, 'Rank Income', Icons.emoji_events_outlined, false, () {}),
                _buildDrawerItem(context, 'Rebirth ID', Icons.loop_outlined, false, () {}),
                _buildDrawerItem(context, 'Products', Icons.inventory_2_outlined, false, () {}),
                _buildDrawerItem(context, 'Offers', Icons.card_giftcard_outlined, false, () {}),
                
                const Padding(padding: EdgeInsets.symmetric(vertical: 8.0), child: Divider(height: 1, color: Color(0xFF1E293B))),
                _buildDrawerSectionTitle('FINANCE'),
                _buildDrawerItem(context, 'Deposit Funds', Icons.currency_rupee_outlined, false, () {}),
                _buildDrawerItem(context, 'Passbook', Icons.swap_vert_outlined, false, () {}),
                _buildDrawerItem(context, 'Withdraw / P2P', Icons.price_change_outlined, false, () {
                  Navigator.pop(context);
                  Navigator.push(context, MaterialPageRoute(builder: (context) => const WithdrawScreen()));
                }),

                const Padding(padding: EdgeInsets.symmetric(vertical: 8.0), child: Divider(height: 1, color: Color(0xFF1E293B))),
                _buildDrawerSectionTitle('ACCOUNT'),
                _buildDrawerItem(context, 'My Network', Icons.groups_outlined, false, () {
                  Navigator.pop(context);
                  Navigator.push(context, MaterialPageRoute(builder: (context) => const NetworkTreeScreen()));
                }),
                _buildDrawerItem(context, 'Add Member', Icons.person_add_outlined, false, () {}),
                _buildDrawerItem(context, 'Genealogy', Icons.account_tree_outlined, false, () {}),
                _buildDrawerItem(context, 'Profile', Icons.person_outline, false, () {}),
                _buildDrawerItem(context, 'KYC', Icons.verified_user_outlined, false, () {}),
                _buildDrawerItem(context, 'Bank Settings', Icons.account_balance_outlined, false, () {}),
                _buildDrawerItem(context, 'Transaction PIN', Icons.lock_outline, false, () {}),
                _buildDrawerItem(context, 'Change Password', Icons.key_outlined, false, () {}),
                _buildDrawerItem(context, 'Support', Icons.support_agent_outlined, false, () {}),

                const Padding(padding: EdgeInsets.symmetric(vertical: 8.0), child: Divider(height: 1, color: Color(0xFF1E293B))),
                _buildDrawerSectionTitle('INFORMATION'),
                _buildDrawerItem(context, 'About Us', Icons.info_outline, false, () {}),
                _buildDrawerItem(context, 'Terms & Conditions', Icons.description_outlined, false, () {}),
                _buildDrawerItem(context, 'Privacy Policy', Icons.privacy_tip_outlined, false, () {}),
                _buildDrawerItem(context, 'Return & Refund', Icons.replay_outlined, false, () {}),
                _buildDrawerItem(context, 'Disclaimer', Icons.warning_amber_outlined, false, () {}),
              ],
            ),
          ),
          const Divider(height: 1, color: Color(0xFF1E293B)),
          Padding(
            padding: const EdgeInsets.all(12.0),
            child: _buildDrawerItem(context, 'Logout', Icons.logout, false, () => _logout(context), color: const Color(0xFFF43F5E)),
          ),
        ],
      ),
    );
  }

  Widget _buildDrawerSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 24, bottom: 8, top: 8),
      child: Text(
        title, 
        style: const TextStyle(
          color: Color(0xFF64748B), 
          fontSize: 11, 
          fontWeight: FontWeight.w900,
          letterSpacing: 1.5,
        ),
      ),
    );
  }

  Widget _buildDrawerItem(BuildContext context, String title, IconData icon, bool isSelected, VoidCallback onTap, {Color? color}) {
    Color itemColor = color ?? (isSelected ? Colors.white : const Color(0xFF94A3B8));
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
      child: ListTile(
        dense: true,
        leading: Icon(icon, color: itemColor, size: 22),
        title: Text(title, style: TextStyle(color: itemColor, fontSize: 14, fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500)),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        tileColor: isSelected ? const Color(0xFF38BDF8).withOpacity(0.15) : Colors.transparent, // Cyan glow for selected
        onTap: onTap,
      ),
    );
  }
}
