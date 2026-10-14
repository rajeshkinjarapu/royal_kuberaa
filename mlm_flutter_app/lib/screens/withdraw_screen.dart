import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../providers/dashboard_provider.dart';
import '../utils/constants.dart';
import 'package:shared_preferences/shared_preferences.dart';

class WithdrawScreen extends StatefulWidget {
  const WithdrawScreen({super.key});

  @override
  State<WithdrawScreen> createState() => _WithdrawScreenState();
}

class _WithdrawScreenState extends State<WithdrawScreen> {
  final _amountController = TextEditingController();
  final _tpinController = TextEditingController();
  bool _isLoading = false;
  bool _isFetchingBank = true;
  Map<String, dynamic>? _bankDetails;
  String _kycStatus = 'Pending';

  @override
  void initState() {
    super.initState();
    _fetchBankDetails();
  }

  Future<void> _fetchBankDetails() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      
      final response = await http.get(
        Uri.parse('${AppConstants.apiBaseUrl}/user/profile'),
        headers: {'Authorization': 'Bearer $token'},
      );
      
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] && data['user'] != null) {
          setState(() {
            _kycStatus = data['user']['kycStatus'] ?? 'Pending';
            _bankDetails = {
              'bankName': data['user']['bankName'],
              'accountNumber': data['user']['accountNumber'],
              'ifscCode': data['user']['ifscCode'],
            };
          });
        }
      }
    } catch (e) {
      // Ignore errors silently
    } finally {
      if (mounted) setState(() => _isFetchingBank = false);
    }
  }

  @override
  void dispose() {
    _amountController.dispose();
    _tpinController.dispose();
    super.dispose();
  }

  void _withdraw() async {
    final amount = double.tryParse(_amountController.text) ?? 0.0;
    if (amount < 500) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Minimum withdrawal amount is ₹500.')));
      return;
    }
    if (_tpinController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter your T-PIN.')));
      return;
    }

    setState(() => _isLoading = true);

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

      final response = await http.post(
        Uri.parse('${AppConstants.apiBaseUrl}/withdraw'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token'
        },
        body: jsonEncode({
          'amount': amount,
          'tpin': _tpinController.text.trim(),
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['success']) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(data['message']), backgroundColor: AppColors.secondary));
          context.read<DashboardProvider>().fetchDashboardData();
          context.pop();
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(data['message'] ?? 'Withdrawal failed'), backgroundColor: AppColors.error));
        }
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Network error. Please try again.'), backgroundColor: AppColors.error));
    }

    setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    final dashData = context.watch<DashboardProvider>().dashboardData;
    final mainWallet = dashData?['mainWallet'] ?? 0.0;
    final bool hasQrCode = (_bankDetails != null &&
        _bankDetails!['paymentQrCode'] != null &&
        _bankDetails!['paymentQrCode'].toString().trim().isNotEmpty);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Bank Withdrawal'),
        backgroundColor: AppColors.darkNavy,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.purple.withOpacity(0.1),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.purple.withOpacity(0.2)),
              ),
              child: Column(
                children: [
                  const Text('Available for Withdrawal', style: TextStyle(color: Colors.purple, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text('₹${mainWallet.toStringAsFixed(2)}', style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Colors.purple)),
                ],
              ),
            ),
            const SizedBox(height: 24),
            
            const Text('Amount to Withdraw', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
            const SizedBox(height: 8),
            
            TextField(
              controller: _amountController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                hintText: 'Enter Amount (Min ₹500)',
                prefixIcon: const Icon(Icons.currency_rupee),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                filled: true,
                fillColor: Colors.white,
              ),
            ),
            
            const SizedBox(height: 16),
            const Text('Transaction PIN (T-PIN)', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
            const SizedBox(height: 8),
            
            TextField(
              controller: _tpinController,
              keyboardType: TextInputType.number,
              obscureText: true,
              decoration: InputDecoration(
                hintText: 'Enter 6-digit T-PIN',
                prefixIcon: const Icon(Icons.lock),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                filled: true,
                fillColor: Colors.white,
              ),
            ),
            
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 16.0),
              child: Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.orange.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Withdrawal Deductions:', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.deepOrange)),
                    SizedBox(height: 4),
                    Text('• 5% TDS', style: TextStyle(fontSize: 12)),
                    Text('• 5% Admin Charge', style: TextStyle(fontSize: 12)),
                    Text('Total Deduction: 10%', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Bank Details Section
            const Text('Receiving Bank Account', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
            const SizedBox(height: 8),
            _isFetchingBank
                ? const Center(child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator()))
                : Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: hasQrCode
                          ? Colors.green.withOpacity(0.08)
                          : Colors.amber.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: hasQrCode
                            ? Colors.green.withOpacity(0.3)
                            : Colors.amber.withOpacity(0.4),
                      ),
                    ),
                    child: hasQrCode
                        ? Row(
                            children: [
                              const Icon(Icons.qr_code_2_rounded, color: Colors.green, size: 36),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('Payout Destination: Payment QR', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.green)),
                                    const SizedBox(height: 2),
                                    Text('UPI / QR Linked: ${_bankDetails?['paymentQrCode']}', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary), maxLines: 1, overflow: TextOverflow.ellipsis),
                                  ],
                                ),
                              ),
                              TextButton(
                                onPressed: () => context.push('/payment-settings'),
                                child: const Text('Change', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                              )
                            ],
                          )
                        : Row(
                            children: [
                              const Icon(Icons.qr_code_scanner, color: Colors.amber, size: 32),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('Payment QR Not Uploaded', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.amber)),
                                    const SizedBox(height: 2),
                                    const Text('Upload your QR code to receive instant payouts.', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                                  ],
                                ),
                              ),
                              ElevatedButton(
                                onPressed: () => context.push('/payment-settings'),
                                style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6)),
                                child: const Text('Add QR', style: TextStyle(fontSize: 11)),
                              )
                            ],
                          ),
                  ),

            const SizedBox(height: 24),
            
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _withdraw,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: _isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('SUBMIT REQUEST', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
