import 'dart:convert';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;
import 'package:go_router/go_router.dart';
import '../utils/constants.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _sponsorController = TextEditingController();
  final _nameController = TextEditingController();
  final _mobileController = TextEditingController();
  final _emailController = TextEditingController();
  
  bool _isLoading = false;
  bool _isSponsorValidating = false;
  String _sponsorName = '';
  String _sponsorError = '';

  @override
  void dispose() {
    _sponsorController.dispose();
    _nameController.dispose();
    _mobileController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  void _validateSponsor(String sponsorId) async {
    if (sponsorId.length < 5) {
      setState(() {
        _sponsorName = '';
        _sponsorError = '';
      });
      return;
    }

    setState(() {
      _isSponsorValidating = true;
      _sponsorError = '';
    });

    try {
      final response = await http.get(Uri.parse('${AppConstants.apiBaseUrl}/sponsor/$sponsorId'));
      final data = jsonDecode(response.body);

      setState(() {
        if (data['success'] == true) {
          _sponsorName = data['name'] ?? data['sponsorName'] ?? '';
          _sponsorError = '';
        } else {
          _sponsorName = '';
          _sponsorError = 'Invalid Sponsor ID';
        }
      });
    } catch (e) {
      setState(() => _sponsorError = 'Error validating sponsor');
    } finally {
      setState(() => _isSponsorValidating = false);
    }
  }

  void _register() async {
    if (_sponsorName.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter a valid Sponsor ID')));
      return;
    }
    if (_nameController.text.trim().isEmpty || _mobileController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill all required fields')));
      return;
    }
    if (_mobileController.text.trim().length != 10) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter a valid 10-digit mobile number')));
      return;
    }

    // Automatically generate 6-digit numeric password
    final autoPassword = (100000 + Random().nextInt(900000)).toString();

    setState(() => _isLoading = true);

    try {
      final response = await http.post(
        Uri.parse('${AppConstants.apiBaseUrl}/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'name': _nameController.text.trim().toUpperCase(),
          'mobile': _mobileController.text.trim(),
          'password': autoPassword,
          'sponsorId': _sponsorController.text.trim().toUpperCase(),
        }),
      );

      final data = jsonDecode(response.body);

      if ((response.statusCode == 200 || response.statusCode == 201) && data['success'] == true) {
        if (mounted) {
          final registeredUser = data['user'] ?? data['data'] ?? {};
          final finalPassword = data['plainPassword'] ?? registeredUser['plainPassword'] ?? autoPassword;
          // Go to success screen, passing credentials
          context.go('/register_success', extra: {
            'memberId': registeredUser['memberId'] ?? '',
            'password': finalPassword,
            'fullName': _nameController.text.trim().toUpperCase(),
            'mobile': _mobileController.text.trim(),
          });
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(data['message'] ?? 'Registration failed'), backgroundColor: AppColors.error));
        }
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Network error. Please try again.'), backgroundColor: AppColors.error));
    }

    setState(() => _isLoading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Add New Member'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(24.0, 24.0, 24.0, 40.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Sponsor Details', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary)),
            const SizedBox(height: 8),
            _buildTextField(
              controller: _sponsorController,
              hint: 'Sponsor ID (e.g. RK0305)',
              icon: Icons.person_add_alt_1,
              onChanged: _validateSponsor,
              textCapitalization: TextCapitalization.characters,
            ),
            if (_isSponsorValidating)
              const Padding(padding: EdgeInsets.all(8.0), child: Text('Validating...', style: TextStyle(color: Colors.blue, fontSize: 12))),
            if (_sponsorName.isNotEmpty)
              Padding(
                padding: const EdgeInsets.all(8.0),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle, color: AppColors.secondary, size: 16),
                    const SizedBox(width: 8),
                    Text('Sponsor: $_sponsorName', style: const TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            if (_sponsorError.isNotEmpty)
              Padding(
                padding: const EdgeInsets.all(8.0),
                child: Text(_sponsorError, style: const TextStyle(color: AppColors.error, fontSize: 12)),
              ),
            
            const SizedBox(height: 24),
            const Text('Personal Details', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primary)),
            const SizedBox(height: 8),
            
            _buildTextField(
              controller: _nameController,
              hint: 'Full Name',
              icon: Icons.person_outline,
              textCapitalization: TextCapitalization.characters,
            ),
            const SizedBox(height: 16),
            
            _buildTextField(
              controller: _mobileController,
              hint: 'Mobile Number',
              icon: Icons.phone_android,
              keyboardType: TextInputType.phone,
              maxLength: 10,
            ),
            const SizedBox(height: 16),
            
            _buildTextField(
              controller: _emailController,
              hint: 'Email Address (Optional)',
              icon: Icons.email_outlined,
              keyboardType: TextInputType.emailAddress,
            ),
            const SizedBox(height: 20),
            
            // Automatic Password Notice Card (Password is auto-generated and shown on image)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF10B981).withOpacity(0.08),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFF10B981).withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withOpacity(0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.lock_reset_rounded, color: Color(0xFF059669), size: 22),
                  ),
                  const SizedBox(width: 14),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Auto-Generated Secure Password',
                          style: TextStyle(
                            color: Color(0xFF065F46),
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        SizedBox(height: 3),
                        Text(
                          'A 6-digit password will be generated automatically and displayed on your Welcome Card to save as an image.',
                          style: TextStyle(
                            color: Color(0xFF047857),
                            fontSize: 11,
                            height: 1.35,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _register,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 4,
                ),
                child: _isLoading
                    ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('REGISTER MEMBER', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
              ),
            ),
            const SizedBox(height: 16),
            Wrap(
              alignment: WrapAlignment.center,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                const Text('By registering, you agree to our ', style: TextStyle(color: AppColors.textSecondary, fontSize: 11)),
                GestureDetector(
                  onTap: () => context.push('/terms'),
                  child: const Text('Terms', style: TextStyle(color: AppColors.primary, fontSize: 11, fontWeight: FontWeight.bold)),
                ),
                const Text(' & ', style: TextStyle(color: AppColors.textSecondary, fontSize: 11)),
                GestureDetector(
                  onTap: () => context.push('/privacy'),
                  child: const Text('Privacy Policy', style: TextStyle(color: AppColors.primary, fontSize: 11, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    Function(String)? onChanged,
    TextInputType? keyboardType,
    TextCapitalization textCapitalization = TextCapitalization.none,
    bool obscureText = false,
    int? maxLength,
    List<TextInputFormatter>? inputFormatters,
    Widget? suffixIcon,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: TextField(
        controller: controller,
        onChanged: onChanged,
        keyboardType: keyboardType,
        textCapitalization: textCapitalization,
        obscureText: obscureText,
        maxLength: maxLength,
        inputFormatters: inputFormatters,
        decoration: InputDecoration(
          counterText: '',
          hintText: hint,
          prefixIcon: Icon(icon, color: AppColors.textSecondary),
          suffixIcon: suffixIcon,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
          filled: true,
          fillColor: Colors.white,
        ),
      ),
    );
  }
}
