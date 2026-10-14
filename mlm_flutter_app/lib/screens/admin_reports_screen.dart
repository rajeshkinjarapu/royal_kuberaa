import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/constants.dart';

class AdminReportsScreen extends StatefulWidget {
  const AdminReportsScreen({super.key});

  @override
  State<AdminReportsScreen> createState() => _AdminReportsScreenState();
}

class _AdminReportsScreenState extends State<AdminReportsScreen> {
  Map<String, dynamic>? _reports;
  bool _isLoading = true;
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    _fetchReports();
  }

  Future<void> _fetchReports() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

      final res = await http.get(
        Uri.parse('${AppConstants.apiBaseUrl}/admin/reports'),
        headers: {'Authorization': 'Bearer $token'},
      );

      final data = jsonDecode(res.body);
      if (res.statusCode == 200 && data['success']) {
        setState(() => _reports = data['data']);
      } else {
        setState(() => _errorMessage = data['message'] ?? 'Failed to load system reports');
      }
    } catch (e) {
      setState(() => _errorMessage = 'Connection error: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('System Reports', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 18)),
        elevation: 0,
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _fetchReports),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _fetchReports,
        color: AppColors.primary,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (_isLoading)
                const Center(child: Padding(padding: EdgeInsets.all(60.0), child: CircularProgressIndicator(color: AppColors.primary)))
              else if (_errorMessage.isNotEmpty)
                Center(child: Text(_errorMessage, style: const TextStyle(color: AppColors.error)))
              else if (_reports != null) ...[
                // Members Summary
                _buildSectionHeader('MEMBER GROWTH & ACTIVE NODES'),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(child: _buildMetricCard('Total Registered', '${_reports!['totalUsers'] ?? 0}', Icons.people, AppColors.primary)),
                    const SizedBox(width: 12),
                    Expanded(child: _buildMetricCard('Active Paid IDs', '${_reports!['activeUsers'] ?? 0}', Icons.check_circle, Colors.green)),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(child: _buildMetricCard('Total Rebirths', '${_reports!['totalRebirths'] ?? 0}', Icons.all_inclusive, Colors.purple)),
                    const SizedBox(width: 12),
                    Expanded(child: _buildMetricCard('Roll-up Profit', '₹${_reports!['totalRollupProfit'] ?? 0}', Icons.trending_up, Colors.orange)),
                  ],
                ),

                const SizedBox(height: 24),

                // Income Distributed
                _buildSectionHeader('FINANCIAL TURNOVER & LIABILITIES'),
                const SizedBox(height: 10),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [Color(0xFF1E1B4B), Color(0xFF312E81)]),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Total Income Generated Across Network', style: TextStyle(color: Colors.white70, fontSize: 13)),
                      const SizedBox(height: 8),
                      Text(
                        '₹${((_reports!['totalIncomeGenerated'] ?? 0) as num).toStringAsFixed(2)}',
                        style: GoogleFonts.inter(fontSize: 28, fontWeight: FontWeight.w900, color: Colors.white),
                      ),
                      const SizedBox(height: 6),
                      const Text('Sum of Direct, Binary, Royalty, and Cashback earnings generated.', style: TextStyle(color: Colors.white60, fontSize: 11)),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // Payouts & Deductions
                _buildSectionHeader('WITHDRAWAL PAYOUTS & DEDUCTIONS'),
                const SizedBox(height: 10),
                Builder(
                  builder: (context) {
                    final approved = _reports!['approvedWithdrawals'] ?? {};
                    final pending = _reports!['pendingWithdrawals'] ?? {};

                    return Column(
                      children: [
                        _buildWithdrawalDetailCard('Approved Payouts', approved, Colors.green),
                        const SizedBox(height: 12),
                        _buildWithdrawalDetailCard('Pending Requests', pending, Colors.orange),
                      ],
                    );
                  },
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: const TextStyle(color: AppColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.2),
    );
  }

  Widget _buildMetricCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 18, color: color),
              const SizedBox(width: 6),
              Expanded(child: Text(title, style: const TextStyle(color: AppColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold), overflow: TextOverflow.ellipsis)),
            ],
          ),
          const SizedBox(height: 10),
          Text(value, style: GoogleFonts.inter(fontWeight: FontWeight.w900, fontSize: 20, color: AppColors.textPrimary)),
        ],
      ),
    );
  }

  Widget _buildWithdrawalDetailCard(String title, Map<dynamic, dynamic> data, Color color) {
    final count = data['count'] ?? 0;
    final gross = ((data['gross'] ?? 0) as num).toDouble();
    final tds = ((data['tds'] ?? 0) as num).toDouble();
    final admin = ((data['adminCharge'] ?? 0) as num).toDouble();
    final net = ((data['netPaid'] ?? 0) as num).toDouble();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
                  const SizedBox(width: 8),
                  Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.textPrimary)),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
                child: Text('$count Transactions', style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          const Divider(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildSubStat('Gross', '₹${gross.toStringAsFixed(2)}'),
              _buildSubStat('TDS (5%)', '₹${tds.toStringAsFixed(2)}'),
              _buildSubStat('Admin (10%)', '₹${admin.toStringAsFixed(2)}'),
              _buildSubStat('Net Payout', '₹${net.toStringAsFixed(2)}', isHighlight: true),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSubStat(String label, String value, {bool isHighlight = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 10)),
        const SizedBox(height: 2),
        Text(value, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: isHighlight ? AppColors.primary : AppColors.textPrimary)),
      ],
    );
  }
}
