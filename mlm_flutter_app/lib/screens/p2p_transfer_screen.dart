import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../providers/dashboard_provider.dart';
import '../utils/constants.dart';
import 'package:shared_preferences/shared_preferences.dart';

class P2PTransferScreen extends StatefulWidget {
  const P2PTransferScreen({super.key});

  @override
  State<P2PTransferScreen> createState() => _P2PTransferScreenState();
}

class _P2PTransferScreenState extends State<P2PTransferScreen> {
  final _receiverController = TextEditingController();
  final _amountController = TextEditingController();
  final _tpinController = TextEditingController();
  
  bool _isLoading = false;
  bool _isValidating = false;
  String _receiverName = '';
  String _receiverError = '';

  @override
  void dispose() {
    _receiverController.dispose();
    _amountController.dispose();
    _tpinController.dispose();
    super.dispose();
  }

  void _validateReceiver(String receiverId) async {
    if (receiverId.length < 5) {
      setState(() {
        _receiverName = '';
        _receiverError = '';
      });
      return;
    }

    setState(() {
      _isValidating = true;
      _receiverError = '';
    });

    try {
      final response = await http.get(
        Uri.parse('${AppConstants.apiBaseUrl}/sponsor/$receiverId'),
      );
      final data = jsonDecode(response.body);

      setState(() {
        if (data['success']) {
          _receiverName = data['name'];
          _receiverError = '';
        } else {
          _receiverName = '';
          _receiverError = 'Invalid Member ID';
        }
      });
    } catch (e) {
      setState(() => _receiverError = 'Error validating member');
    } finally {
      setState(() => _isValidating = false);
    }
  }

  void _transfer() async {
    if (_receiverName.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter a valid Receiver ID')));
      return;
    }
    final amount = double.tryParse(_amountController.text) ?? 0.0;
    if (amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter a valid amount')));
      return;
    }
    if (_tpinController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter your T-PIN')));
      return;
    }

    setState(() => _isLoading = true);

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');

      final response = await http.post(
        Uri.parse('${AppConstants.apiBaseUrl}/p2p'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token'
        },
        body: jsonEncode({
          'receiverId': _receiverController.text.trim().toUpperCase(),
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
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(data['message'] ?? 'Transfer failed'), backgroundColor: AppColors.error));
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

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('P2P Transfer'),
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
                color: AppColors.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.primary.withOpacity(0.2)),
              ),
              child: Column(
                children: [
                  const Text('Available Balance', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text('₹${mainWallet.toStringAsFixed(2)}', style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: AppColors.primary)),
                ],
              ),
            ),
            const SizedBox(height: 24),
            const Text('Receiver Details', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
            const SizedBox(height: 8),
            
            TextField(
              controller: _receiverController,
              onChanged: _validateReceiver,
              textCapitalization: TextCapitalization.characters,
              decoration: InputDecoration(
                hintText: 'Enter Receiver ID (e.g. RK123456)',
                prefixIcon: const Icon(Icons.person_search),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                filled: true,
                fillColor: Colors.white,
              ),
            ),
            if (_isValidating)
              const Padding(padding: EdgeInsets.all(8.0), child: Text('Validating...', style: TextStyle(color: Colors.blue, fontSize: 12))),
            if (_receiverName.isNotEmpty)
              Padding(
                padding: const EdgeInsets.all(8.0),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle, color: AppColors.secondary, size: 16),
                    const SizedBox(width: 8),
                    Text('Name: $_receiverName', style: const TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            if (_receiverError.isNotEmpty)
              Padding(
                padding: const EdgeInsets.all(8.0),
                child: Text(_receiverError, style: const TextStyle(color: AppColors.error, fontSize: 12)),
              ),
              
            const SizedBox(height: 16),
            const Text('Amount to Transfer', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
            const SizedBox(height: 8),
            
            TextField(
              controller: _amountController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                hintText: 'Enter Amount',
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
            
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 16.0),
              child: Text('Note: 5% charge applies for P2P transfers.', style: TextStyle(color: Colors.red, fontSize: 12, fontWeight: FontWeight.bold)),
            ),
            
            const SizedBox(height: 24),
            
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _transfer,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: _isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text('TRANSFER NOW', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
