import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/profile_provider.dart';
import '../utils/constants.dart';

class PaymentSettingsScreen extends StatefulWidget {
  const PaymentSettingsScreen({super.key});

  @override
  State<PaymentSettingsScreen> createState() => _PaymentSettingsScreenState();
}

class _PaymentSettingsScreenState extends State<PaymentSettingsScreen> {
  final _formKey = GlobalKey<FormState>();

  final _holderNameController = TextEditingController();
  final _bankNameController = TextEditingController();
  final _accountController = TextEditingController();
  final _confirmAccountController = TextEditingController();
  final _ifscController = TextEditingController();
  final _upiController = TextEditingController();

  bool _isLoading = false;
  bool _isApproved = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadExisting();
    });
  }

  void _loadExisting() async {
    final provider = context.read<ProfileProvider>();
    if (provider.profileData == null) {
      await provider.fetchProfile();
    }

    final data = provider.profileData;
    if (data != null && mounted) {
      setState(() {
        _holderNameController.text = data['fullName'] ?? data['name'] ?? '';
        _bankNameController.text = data['bankName'] ?? '';
        _accountController.text = data['accountNumber'] ?? '';
        _confirmAccountController.text = data['accountNumber'] ?? '';
        _ifscController.text = data['ifscCode'] ?? '';
        _upiController.text = data['upiId'] ?? data['paymentQrCode'] ?? '';
        _isApproved = (data['kycStatus'] ?? '') == 'Approved';
      });
    }
  }

  @override
  void dispose() {
    _holderNameController.dispose();
    _bankNameController.dispose();
    _accountController.dispose();
    _confirmAccountController.dispose();
    _ifscController.dispose();
    _upiController.dispose();
    super.dispose();
  }

  Future<void> _saveSettings() async {
    if (_isApproved) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Bank details are verified and locked. Contact Support for changes.'), backgroundColor: Colors.amber),
      );
      return;
    }

    if (!_formKey.currentState!.validate()) return;

    if (_accountController.text.trim() != _confirmAccountController.text.trim()) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Account numbers do not match!'), backgroundColor: AppColors.error),
      );
      return;
    }

    setState(() => _isLoading = true);

    final provider = context.read<ProfileProvider>();
    final currentData = provider.profileData ?? {};

    final success = await provider.updateKyc({
      'panNumber': currentData['panNumber'] ?? '',
      'aadharNumber': currentData['aadharNumber'] ?? '',
      'bankName': _bankNameController.text.trim().toUpperCase(),
      'accountNumber': _accountController.text.trim(),
      'ifscCode': _ifscController.text.trim().toUpperCase(),
      'paymentQrCode': _upiController.text.trim(),
    });

    setState(() => _isLoading = false);

    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Bank & Payment settings saved successfully!'), backgroundColor: AppColors.secondary),
        );
        Navigator.pop(context);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(provider.errorMessage.isNotEmpty ? provider.errorMessage : 'Failed to update payment settings'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Payment Settings', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Notice banner
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: _isApproved ? Colors.green.shade50 : const Color(0xFFEEF2FF),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: _isApproved ? Colors.green.shade200 : const Color(0xFFC7D2FE)),
                ),
                child: Row(
                  children: [
                    Icon(
                      _isApproved ? Icons.verified : Icons.account_balance,
                      color: _isApproved ? Colors.green : AppColors.primary,
                      size: 28,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _isApproved ? 'Bank Details Verified' : 'Bank Payout Configuration',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                              color: _isApproved ? Colors.green.shade800 : AppColors.primary,
                            ),
                          ),
                          const SizedBox(height: 3),
                          Text(
                            _isApproved
                                ? 'Your account details are approved for payouts and locked for security.'
                                : 'All withdrawal payouts will be credited directly to this bank account.',
                            style: TextStyle(
                              fontSize: 11,
                              color: _isApproved ? Colors.green.shade700 : AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Account Holder Name
              const Text('Account Holder Name', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _holderNameController,
                readOnly: _isApproved,
                textCapitalization: TextCapitalization.characters,
                decoration: _inputDecoration('Name as per Bank Passbook', Icons.person_outline),
                validator: (val) => val == null || val.trim().isEmpty ? 'Account holder name is required' : null,
              ),

              const SizedBox(height: 18),

              // Bank Name
              const Text('Bank Name', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _bankNameController,
                readOnly: _isApproved,
                textCapitalization: TextCapitalization.characters,
                decoration: _inputDecoration('e.g. STATE BANK OF INDIA, HDFC BANK', Icons.account_balance_outlined),
                validator: (val) => val == null || val.trim().isEmpty ? 'Bank name is required' : null,
              ),

              const SizedBox(height: 18),

              // Account Number
              const Text('Bank Account Number', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _accountController,
                readOnly: _isApproved,
                keyboardType: TextInputType.number,
                obscureText: _isApproved,
                decoration: _inputDecoration('Enter your bank account number', Icons.numbers_outlined),
                validator: (val) {
                  if (val == null || val.trim().length < 8) return 'Enter a valid account number';
                  return null;
                },
              ),

              const SizedBox(height: 18),

              // Confirm Account Number
              if (!_isApproved) ...[
                const Text('Confirm Account Number', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary)),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _confirmAccountController,
                  keyboardType: TextInputType.number,
                  decoration: _inputDecoration('Re-enter bank account number', Icons.lock_outline),
                  validator: (val) {
                    if (val != _accountController.text.trim()) return 'Account numbers do not match';
                    return null;
                  },
                ),
                const SizedBox(height: 18),
              ],

              // IFSC Code
              const Text('IFSC Code', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _ifscController,
                readOnly: _isApproved,
                textCapitalization: TextCapitalization.characters,
                maxLength: 11,
                decoration: _inputDecoration('11-character IFSC (e.g. SBIN0001234)', Icons.qr_code_outlined).copyWith(counterText: ''),
                validator: (val) {
                  if (val == null || val.trim().length != 11) return 'IFSC must be exactly 11 characters';
                  return null;
                },
              ),

              const SizedBox(height: 18),

              // UPI ID / VPA
              const Text('UPI ID (Optional)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _upiController,
                readOnly: _isApproved,
                decoration: _inputDecoration('e.g. yourname@okhdfcbank, mobile@upi', Icons.alternate_email),
              ),

              const SizedBox(height: 32),

              if (!_isApproved)
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _saveSettings,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 0,
                    ),
                    child: _isLoading
                        ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Text('Save Payment Settings', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String hint, IconData icon) {
    return InputDecoration(
      hintText: hint,
      prefixIcon: Icon(icon, color: AppColors.textSecondary),
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
    );
  }
}
