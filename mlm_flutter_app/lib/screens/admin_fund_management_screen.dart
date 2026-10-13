import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/admin_provider.dart';
import '../utils/constants.dart';

class AdminFundManagementScreen extends StatefulWidget {
  const AdminFundManagementScreen({super.key});

  @override
  State<AdminFundManagementScreen> createState() => _AdminFundManagementScreenState();
}

class _AdminFundManagementScreenState extends State<AdminFundManagementScreen> {
  final _memberIdController = TextEditingController();
  final _amountController = TextEditingController();
  final _remarkController = TextEditingController();
  String _actionType = 'credit'; // 'credit', 'debit'
  String _walletType = 'main'; // 'main', 'rebirth'
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AdminProvider>().fetchFundStats();
    });
  }

  @override
  void dispose() {
    _memberIdController.dispose();
    _amountController.dispose();
    _remarkController.dispose();
    super.dispose();
  }

  Future<void> _submitFundAction() async {
    final memberId = _memberIdController.text.trim();
    final amount = double.tryParse(_amountController.text) ?? 0.0;

    if (memberId.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter Member ID or Mobile')));
      return;
    }
    if (amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter a valid amount')));
      return;
    }

    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Confirm ${_actionType.toUpperCase()}'),
        content: Text('Are you sure you want to ${_actionType} ₹$amount to $memberId\'s ${_walletType.toUpperCase()} wallet?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: _actionType == 'credit' ? Colors.green : AppColors.error),
            child: const Text('Confirm', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _isSubmitting = true);

    final res = await context.read<AdminProvider>().processFundAction(
      memberId: memberId,
      amount: amount,
      actionType: _actionType,
      walletType: _walletType,
      remark: _remarkController.text.trim(),
    );

    setState(() => _isSubmitting = false);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message']),
          backgroundColor: res['success'] ? AppColors.secondary : AppColors.error,
        ),
      );
      if (res['success']) {
        _memberIdController.clear();
        _amountController.clear();
        _remarkController.clear();
      }
    }
  }

  Future<void> _triggerCron() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Trigger Daily Royalty & Cashback Pools?'),
        content: const Text('This will immediately calculate and distribute the Daily Royalty Pool shares and Non-Working Cashback for today.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.purple),
            child: const Text('Run Distribution', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    final success = await context.read<AdminProvider>().triggerCron();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(success ? 'Pool Distribution Triggered Successfully!' : 'Failed to trigger cron'),
          backgroundColor: success ? AppColors.secondary : AppColors.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AdminProvider>();
    final stats = provider.fundStats;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Fund Management'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Stats Grid
            if (stats != null) ...[
              Text('System Financial Liability', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildStatCard(
                      'Total Main Wallets',
                      '₹${(stats['totalMainWallet'] ?? 0).toStringAsFixed(0)}',
                      Colors.blue,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildStatCard(
                      'Rebirth Wallets',
                      '₹${(stats['totalRebirthWallet'] ?? 0).toStringAsFixed(0)}',
                      Colors.purple,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildStatCard(
                      'Total Members',
                      '${stats['activeMembers'] ?? 0} / ${stats['totalMembers'] ?? 0} Active',
                      Colors.teal,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildStatCard(
                      'Pending Withdrawals',
                      '₹${(stats['pendingWithdrawalsAmount'] ?? 0).toStringAsFixed(0)}',
                      Colors.orange,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
            ],

            // Daily Cron Pool Distribution Button
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Colors.deepPurple, Colors.purpleAccent]),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Pool Distribution', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                      Text('Manually trigger daily midnight payout', style: TextStyle(color: Colors.white70, fontSize: 12)),
                    ],
                  ),
                  ElevatedButton(
                    onPressed: _triggerCron,
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.white, foregroundColor: Colors.deepPurple),
                    child: const Text('Trigger Now', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Manual Credit / Debit Form Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Manual Fund Credit / Debit', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                  const SizedBox(height: 16),

                  // Action Type Selector (Credit / Debit)
                  Row(
                    children: [
                      Expanded(
                        child: ChoiceChip(
                          label: const Center(child: Text('Credit Funds (+)')),
                          selected: _actionType == 'credit',
                          selectedColor: Colors.green.withOpacity(0.2),
                          labelStyle: TextStyle(color: _actionType == 'credit' ? Colors.green : AppColors.textSecondary, fontWeight: FontWeight.bold),
                          onSelected: (val) => setState(() => _actionType = 'credit'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ChoiceChip(
                          label: const Center(child: Text('Debit Funds (-)')),
                          selected: _actionType == 'debit',
                          selectedColor: AppColors.error.withOpacity(0.2),
                          labelStyle: TextStyle(color: _actionType == 'debit' ? AppColors.error : AppColors.textSecondary, fontWeight: FontWeight.bold),
                          onSelected: (val) => setState(() => _actionType = 'debit'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Wallet Type Selector
                  Row(
                    children: [
                      Expanded(
                        child: ChoiceChip(
                          label: const Center(child: Text('Main Wallet')),
                          selected: _walletType == 'main',
                          selectedColor: AppColors.primary.withOpacity(0.2),
                          labelStyle: TextStyle(color: _walletType == 'main' ? AppColors.primary : AppColors.textSecondary, fontWeight: FontWeight.bold),
                          onSelected: (val) => setState(() => _walletType = 'main'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ChoiceChip(
                          label: const Center(child: Text('Rebirth Wallet')),
                          selected: _walletType == 'rebirth',
                          selectedColor: Colors.purple.withOpacity(0.2),
                          labelStyle: TextStyle(color: _walletType == 'rebirth' ? Colors.purple : AppColors.textSecondary, fontWeight: FontWeight.bold),
                          onSelected: (val) => setState(() => _walletType = 'rebirth'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  TextField(
                    controller: _memberIdController,
                    decoration: InputDecoration(
                      labelText: 'Member ID or Mobile Number',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    ),
                  ),
                  const SizedBox(height: 12),

                  TextField(
                    controller: _amountController,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      labelText: 'Amount (₹)',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    ),
                  ),
                  const SizedBox(height: 12),

                  TextField(
                    controller: _remarkController,
                    decoration: InputDecoration(
                      labelText: 'Reason / Remark (Optional)',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    ),
                  ),
                  const SizedBox(height: 20),

                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: _isSubmitting ? null : _submitFundAction,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: _actionType == 'credit' ? Colors.green : AppColors.error,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      child: _isSubmitting
                          ? const CircularProgressIndicator(color: Colors.white)
                          : Text('${_actionType == 'credit' ? 'Credit' : 'Debit'} Amount', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(String title, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.bold)),
          const SizedBox(height: 6),
          Text(value, style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.w900, color: AppColors.textPrimary)),
        ],
      ),
    );
  }
}
