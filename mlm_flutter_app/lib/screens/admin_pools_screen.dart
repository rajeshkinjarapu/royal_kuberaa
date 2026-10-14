import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/constants.dart';

class AdminPoolsScreen extends StatefulWidget {
  const AdminPoolsScreen({super.key});

  @override
  State<AdminPoolsScreen> createState() => _AdminPoolsScreenState();
}

class _AdminPoolsScreenState extends State<AdminPoolsScreen> {
  List<dynamic> _pools = [];
  bool _isLoading = true;
  bool _isTriggering = false;
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    _fetchPools();
  }

  Future<void> _fetchPools() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

      final res = await http.get(
        Uri.parse('${AppConstants.apiBaseUrl}/admin/pools'),
        headers: {'Authorization': 'Bearer $token'},
      );

      final data = jsonDecode(res.body);
      if (res.statusCode == 200 && data['success']) {
        setState(() => _pools = data['data'] ?? []);
      } else {
        setState(() => _errorMessage = data['message'] ?? 'Failed to load pools');
      }
    } catch (e) {
      setState(() => _errorMessage = 'Connection error: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _triggerPoolDistribution() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: const Text('Confirm Distribution'),
        content: const Text('Are you sure you want to trigger daily pool distributions now? This will credit cashback and royalty to all qualified member wallets.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(c, true),
            child: const Text('Trigger Now'),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _isTriggering = true);

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

      final res = await http.post(
        Uri.parse('${AppConstants.apiBaseUrl}/admin/trigger-cron'),
        headers: {'Authorization': 'Bearer $token'},
      );

      final data = jsonDecode(res.body);
      if (mounted) {
        if (res.statusCode == 200 && data['success']) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(data['message'] ?? 'Distribution executed successfully!'), backgroundColor: AppColors.secondary),
          );
          _fetchPools();
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(data['message'] ?? 'Failed to trigger distribution'), backgroundColor: AppColors.error),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _isTriggering = false);
    }
  }

  Color _getPoolColor(String name) {
    switch (name.toUpperCase()) {
      case 'GOLD':
        return Colors.amber.shade700;
      case 'PLATINUM':
        return Colors.cyan.shade700;
      case 'RUBY':
        return Colors.red.shade700;
      case 'DIAMOND':
        return Colors.blue.shade700;
      case 'NON_WORKING':
        return Colors.green.shade700;
      default:
        return AppColors.primary;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Pool Distributions', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 18)),
        elevation: 0,
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _fetchPools),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -3))],
        ),
        child: SizedBox(
          height: 52,
          child: ElevatedButton.icon(
            onPressed: _isTriggering ? null : _triggerPoolDistribution,
            icon: _isTriggering
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Icon(Icons.flash_on),
            label: Text(_isTriggering ? 'Processing Distribution...' : 'Trigger Daily Distributions',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              elevation: 0,
            ),
          ),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _fetchPools,
        color: AppColors.primary,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16.0, 16.0, 16.0, 40.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [Color(0xFF6366F1), Color(0xFF4F46E5)]),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.pie_chart, color: Colors.white, size: 32),
                    SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Royalty & Non-Working Pools', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                          SizedBox(height: 4),
                          Text('Real-time pool balances and automated dividend payout controls.', style: TextStyle(color: Colors.white70, fontSize: 12)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              if (_isLoading)
                const Center(child: Padding(padding: EdgeInsets.all(50.0), child: CircularProgressIndicator(color: AppColors.primary)))
              else if (_errorMessage.isNotEmpty)
                Center(child: Text(_errorMessage, style: const TextStyle(color: AppColors.error)))
              else if (_pools.isEmpty)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(32),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
                  child: const Center(child: Text('No active pools found in database.', style: TextStyle(color: AppColors.textSecondary))),
                )
              else
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _pools.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 14),
                  itemBuilder: (context, idx) {
                    final pool = _pools[idx];
                    final String poolName = pool['poolName'] ?? 'POOL';
                    final double totalFund = ((pool['totalFund'] ?? 0) as num).toDouble();
                    final int membersCount = (pool['membersCount'] ?? 0) as int;
                    final List membersList = pool['membersList'] as List? ?? [];
                    final color = _getPoolColor(poolName);

                    return Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.border),
                        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 8, offset: const Offset(0, 2))],
                      ),
                      child: ExpansionTile(
                        tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        leading: Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(color: color.withOpacity(0.12), shape: BoxShape.circle),
                          child: Icon(Icons.monetization_on, color: color, size: 22),
                        ),
                        title: Text(
                          poolName.replaceAll('_', ' '),
                          style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.textPrimary),
                        ),
                        subtitle: Text(
                          '₹${totalFund.toStringAsFixed(2)}  •  $membersCount Qualified',
                          style: TextStyle(color: color, fontWeight: FontWeight.w600, fontSize: 13),
                        ),
                        children: [
                          const Divider(height: 1),
                          Padding(
                            padding: const EdgeInsets.fromLTRB(16.0, 16.0, 16.0, 40.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text('Estimated Payout / Member:', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                    Text(
                                      membersCount > 0 ? '₹${(totalFund / membersCount).toStringAsFixed(2)}' : '₹0.00',
                                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                const Text('Qualified Member IDs:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
                                const SizedBox(height: 8),
                                if (membersList.isEmpty)
                                  const Text('No members currently qualified for this pool.', style: TextStyle(color: Colors.grey, fontSize: 12, fontStyle: FontStyle.italic))
                                else
                                  Wrap(
                                    spacing: 6,
                                    runSpacing: 6,
                                    children: membersList.take(20).map((id) {
                                      return Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
                                        child: Text(id.toString(), style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: color)),
                                      );
                                    }).toList(),
                                  ),
                                if (membersList.length > 20) ...[
                                  const SizedBox(height: 6),
                                  Text('+ ${membersList.length - 20} more members', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                                ],
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }
}
