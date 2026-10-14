import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/admin_provider.dart';
import '../utils/constants.dart';

class AdminSettingsScreen extends StatefulWidget {
  const AdminSettingsScreen({super.key});

  @override
  State<AdminSettingsScreen> createState() => _AdminSettingsScreenState();
}

class _AdminSettingsScreenState extends State<AdminSettingsScreen> {
  final _siteNameController = TextEditingController();
  final _minWithdrawalController = TextEditingController();
  final _tdsController = TextEditingController();
  final _adminChargeController = TextEditingController();
  final _bankNameController = TextEditingController();
  final _accountNameController = TextEditingController();
  final _accountNumberController = TextEditingController();
  final _ifscController = TextEditingController();
  final _upiController = TextEditingController();
  bool _maintenanceMode = false;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await context.read<AdminProvider>().fetchSettings();
      _populateFields();
    });
  }

  void _populateFields() {
    final settings = context.read<AdminProvider>().settings;
    if (settings != null) {
      setState(() {
        _siteNameController.text = (settings['siteName'] ?? 'Royal Kuberaa').toString();
        _minWithdrawalController.text = (settings['minimumWithdrawal'] ?? 500).toString();
        _tdsController.text = (settings['tdsPercentage'] ?? 5).toString();
        _adminChargeController.text = (settings['adminChargePercentage'] ?? 5).toString();
        _bankNameController.text = (settings['companyBankName'] ?? '').toString();
        _accountNameController.text = (settings['companyAccountName'] ?? '').toString();
        _accountNumberController.text = (settings['companyAccountNumber'] ?? '').toString();
        _ifscController.text = (settings['companyIfsc'] ?? '').toString();
        _upiController.text = (settings['companyUpiId'] ?? '').toString();
        _maintenanceMode = settings['maintenanceMode'] == true;
      });
    }
  }

  @override
  void dispose() {
    _siteNameController.dispose();
    _minWithdrawalController.dispose();
    _tdsController.dispose();
    _adminChargeController.dispose();
    _bankNameController.dispose();
    _accountNameController.dispose();
    _accountNumberController.dispose();
    _ifscController.dispose();
    _upiController.dispose();
    super.dispose();
  }

  Future<void> _saveSettings() async {
    setState(() => _isSaving = true);

    final success = await context.read<AdminProvider>().updateSettings({
      'siteName': _siteNameController.text.trim(),
      'minimumWithdrawal': double.tryParse(_minWithdrawalController.text) ?? 500,
      'tdsPercentage': double.tryParse(_tdsController.text) ?? 5,
      'adminChargePercentage': double.tryParse(_adminChargeController.text) ?? 5,
      'companyBankName': _bankNameController.text.trim(),
      'companyAccountName': _accountNameController.text.trim(),
      'companyAccountNumber': _accountNumberController.text.trim(),
      'companyIfsc': _ifscController.text.trim(),
      'companyUpiId': _upiController.text.trim(),
      'maintenanceMode': _maintenanceMode,
    });

    setState(() => _isSaving = false);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(success ? 'System Settings Saved Successfully!' : 'Failed to update settings'),
          backgroundColor: success ? AppColors.secondary : AppColors.error,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AdminProvider>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('System Settings'),
        elevation: 0,
      ),
      body: provider.isLoading && provider.settings == null
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSectionCard(
                    title: 'Withdrawal & Commission Rules',
                    icon: Icons.account_balance_wallet_outlined,
                    children: [
                      _buildTextField(_minWithdrawalController, 'Minimum Withdrawal (₹)', TextInputType.number),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(child: _buildTextField(_tdsController, 'TDS (%)', TextInputType.number)),
                          const SizedBox(width: 12),
                          Expanded(child: _buildTextField(_adminChargeController, 'Admin Charge (%)', TextInputType.number)),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  _buildSectionCard(
                    title: 'Company Bank & Deposit Details',
                    icon: Icons.account_balance_outlined,
                    children: [
                      _buildTextField(_upiController, 'Company UPI ID (e.g. name@upi)'),
                      const SizedBox(height: 12),
                      _buildTextField(_bankNameController, 'Bank Name (e.g. HDFC Bank)'),
                      const SizedBox(height: 12),
                      _buildTextField(_accountNameController, 'Account Holder Name'),
                      const SizedBox(height: 12),
                      _buildTextField(_accountNumberController, 'Account Number'),
                      const SizedBox(height: 12),
                      _buildTextField(_ifscController, 'IFSC Code'),
                    ],
                  ),
                  const SizedBox(height: 16),

                  _buildSectionCard(
                    title: 'Platform Maintenance',
                    icon: Icons.build_circle_outlined,
                    children: [
                      SwitchListTile(
                        title: const Text('Maintenance Mode', style: TextStyle(fontWeight: FontWeight.bold)),
                        subtitle: const Text('Blocks user logins and requests during updates'),
                        value: _maintenanceMode,
                        activeColor: AppColors.primary,
                        onChanged: (val) => setState(() => _maintenanceMode = val),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: _isSaving ? null : _saveSettings,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: _isSaving
                          ? const CircularProgressIndicator(color: Colors.white)
                          : const Text('Save System Settings', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    ),
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
    );
  }

  Widget _buildSectionCard({required String title, required IconData icon, required List<Widget> children}) {
    return Container(
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
          Row(
            children: [
              Icon(icon, color: AppColors.primary, size: 22),
              const SizedBox(width: 8),
              Text(title, style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
            ],
          ),
          const Divider(height: 24),
          ...children,
        ],
      ),
    );
  }

  Widget _buildTextField(TextEditingController controller, String label, [TextInputType keyboard = TextInputType.text]) {
    return TextField(
      controller: controller,
      keyboardType: keyboard,
      decoration: InputDecoration(
        labelText: label,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      ),
    );
  }
}
