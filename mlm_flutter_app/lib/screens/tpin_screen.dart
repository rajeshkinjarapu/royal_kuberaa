import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/profile_provider.dart';
import '../utils/constants.dart';

class TpinScreen extends StatefulWidget {
  const TpinScreen({super.key});

  @override
  State<TpinScreen> createState() => _TpinScreenState();
}

class _TpinScreenState extends State<TpinScreen> {
  final _formKey = GlobalKey<FormState>();
  
  final _currentController = TextEditingController();
  final _newController = TextEditingController();
  final _confirmController = TextEditingController();

  bool _obscureCurrent = true;
  bool _obscureNew = true;
  bool _obscureConfirm = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<ProfileProvider>();
      if (provider.profileData == null) {
        provider.fetchProfile();
      }
    });
  }

  @override
  void dispose() {
    _currentController.dispose();
    _newController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    if (_newController.text != _confirmController.text) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('New T-PINs do not match!'), backgroundColor: AppColors.error));
      return;
    }

    final provider = context.read<ProfileProvider>();
    // If user has no T-PIN, currentTpin can be anything or empty, backend might check it but the UI should just pass it
    final success = await provider.setTpin(
      provider.hasTpin ? _currentController.text : '', 
      _newController.text
    );

    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('T-PIN updated successfully!'), backgroundColor: Colors.green));
        context.pop();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to update T-PIN. Please check your current T-PIN.'), backgroundColor: AppColors.error));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ProfileProvider>();
    final isLoading = provider.isLoading;
    final hasTpin = provider.hasTpin;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Transaction PIN (T-PIN)'),
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
                    Text(hasTpin ? 'Change your T-PIN' : 'Create your T-PIN', style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
                    const SizedBox(height: 8),
                    const Text('T-PIN is required for all financial transactions including withdrawals and P2P transfers.', style: TextStyle(color: AppColors.textSecondary, height: 1.5)),
                    const SizedBox(height: 32),

                    if (hasTpin) ...[
                      _buildPasswordField(_currentController, 'Current T-PIN', _obscureCurrent, () => setState(() => _obscureCurrent = !_obscureCurrent)),
                      const SizedBox(height: 16),
                    ],
                    
                    _buildPasswordField(_newController, 'New T-PIN', _obscureNew, () => setState(() => _obscureNew = !_obscureNew)),
                    const SizedBox(height: 16),
                    _buildPasswordField(_confirmController, 'Confirm New T-PIN', _obscureConfirm, () => setState(() => _obscureConfirm = !_obscureConfirm)),
                    
                    const SizedBox(height: 40),
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: isLoading ? null : _submit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: isLoading
                            ? const CircularProgressIndicator(color: Colors.white)
                            : Text(hasTpin ? 'Update T-PIN' : 'Create T-PIN', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildPasswordField(TextEditingController controller, String label, bool obscureText, VoidCallback onToggle) {
    return TextFormField(
      controller: controller,
      obscureText: obscureText,
      maxLength: 6,
      keyboardType: TextInputType.number,
      validator: (value) {
        if (value == null || value.isEmpty) return 'Required';
        if (value.length < 4) return 'PIN must be at least 4 digits';
        return null;
      },
      decoration: InputDecoration(
        labelText: label,
        counterText: '',
        prefixIcon: const Icon(Icons.pin, color: AppColors.primary),
        suffixIcon: IconButton(
          icon: Icon(obscureText ? Icons.visibility_off : Icons.visibility, color: Colors.grey),
          onPressed: onToggle,
        ),
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
      ),
    );
  }
}
