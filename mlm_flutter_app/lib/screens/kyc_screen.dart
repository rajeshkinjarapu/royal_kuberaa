import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/profile_provider.dart';
import '../utils/constants.dart';

class KycScreen extends StatefulWidget {
  const KycScreen({super.key});

  @override
  State<KycScreen> createState() => _KycScreenState();
}

class _KycScreenState extends State<KycScreen> {
  final _formKey = GlobalKey<FormState>();
  
  final _panController = TextEditingController();
  final _aadharController = TextEditingController();
  final _bankNameController = TextEditingController();
  final _accountController = TextEditingController();
  final _ifscController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  void _loadData() async {
    final provider = context.read<ProfileProvider>();
    if (provider.profileData == null) {
      await provider.fetchProfile();
    }
    
    final data = provider.profileData;
    if (data != null && mounted) {
      setState(() {
        _panController.text = data['panNumber'] ?? '';
        _aadharController.text = data['aadharNumber'] ?? '';
        _bankNameController.text = data['bankName'] ?? '';
        _accountController.text = data['accountNumber'] ?? '';
        _ifscController.text = data['ifscCode'] ?? '';
      });
    }
  }

  @override
  void dispose() {
    _panController.dispose();
    _aadharController.dispose();
    _bankNameController.dispose();
    _accountController.dispose();
    _ifscController.dispose();
    super.dispose();
  }

  Future<void> _submitKyc() async {
    if (!_formKey.currentState!.validate()) return;

    final provider = context.read<ProfileProvider>();
    final success = await provider.updateKyc({
      'panNumber': _panController.text,
      'aadharNumber': _aadharController.text,
      'bankName': _bankNameController.text,
      'accountNumber': _accountController.text,
      'ifscCode': _ifscController.text,
    });

    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('KYC Submitted Successfully!'), backgroundColor: Colors.green));
        context.pop();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to submit KYC or Already Approved.'), backgroundColor: AppColors.error));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ProfileProvider>();
    final status = provider.profileData?['kycStatus'] ?? 'Not Submitted';
    final isApproved = status == 'Approved';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('KYC & Bank Details'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
      ),
      body: provider.isLoading && provider.profileData == null
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24.0),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: isApproved ? Colors.green.withOpacity(0.1) : (status == 'Submitted' ? Colors.orange.withOpacity(0.1) : AppColors.error.withOpacity(0.1)),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: isApproved ? Colors.green : (status == 'Submitted' ? Colors.orange : AppColors.error)),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            isApproved ? Icons.verified : (status == 'Submitted' ? Icons.hourglass_empty : Icons.warning_amber_rounded),
                            color: isApproved ? Colors.green : (status == 'Submitted' ? Colors.orange : AppColors.error),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('KYC Status', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                Text(status, style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: isApproved ? Colors.green : (status == 'Submitted' ? Colors.orange : AppColors.error))),
                              ],
                            ),
                          )
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    Text('Identity Documents', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                    const SizedBox(height: 16),
                    _buildTextField(_panController, 'PAN Card Number', Icons.credit_card, isApproved),
                    const SizedBox(height: 16),
                    _buildTextField(_aadharController, 'Aadhar Number', Icons.perm_identity, isApproved),
                    
                    const SizedBox(height: 32),
                    Text('Bank Details (For Withdrawals)', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                    const SizedBox(height: 16),
                    _buildTextField(_bankNameController, 'Bank Name', Icons.account_balance, isApproved),
                    const SizedBox(height: 16),
                    _buildTextField(_accountController, 'Account Number', Icons.numbers, isApproved),
                    const SizedBox(height: 16),
                    _buildTextField(_ifscController, 'IFSC Code', Icons.code, isApproved),

                    const SizedBox(height: 32),
                    if (!isApproved)
                      SizedBox(
                        width: double.infinity,
                        height: 50,
                        child: ElevatedButton(
                          onPressed: provider.isLoading ? null : _submitKyc,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: provider.isLoading
                              ? const CircularProgressIndicator(color: Colors.white)
                              : const Text('Submit for Verification', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                        ),
                      ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildTextField(TextEditingController controller, String label, IconData icon, bool readOnly) {
    return TextFormField(
      controller: controller,
      readOnly: readOnly,
      validator: (value) => value == null || value.isEmpty ? 'Required' : null,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: AppColors.primary),
        filled: true,
        fillColor: readOnly ? Colors.grey[200] : Colors.white,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
      ),
    );
  }
}
