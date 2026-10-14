import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;
import '../providers/auth_provider.dart';
import '../utils/constants.dart';

class AddMemberScreen extends StatefulWidget {
  const AddMemberScreen({super.key});

  @override
  State<AddMemberScreen> createState() => _AddMemberScreenState();
}

class _AddMemberScreenState extends State<AddMemberScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _mobileController = TextEditingController();
  final _sponsorController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _isLoading = false;
  String _sponsorName = '';
  bool _isCheckingSponsor = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user = context.read<AuthProvider>().user;
      if (user != null && user['memberId'] != null) {
        _sponsorController.text = user['memberId'];
        _sponsorName = user['fullName'] ?? user['name'] ?? 'You';
        setState(() {});
      }
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    _mobileController.dispose();
    _sponsorController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _checkSponsor(String id) async {
    if (id.trim().length < 3) return;
    setState(() => _isCheckingSponsor = true);
    try {
      final res = await http.get(Uri.parse('${AppConstants.apiBaseUrl}/sponsor/$id'));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success']) {
          setState(() => _sponsorName = data['name'] ?? data['data']?['name'] ?? 'Valid Sponsor');
        } else {
          setState(() => _sponsorName = 'Invalid Sponsor ID');
        }
      } else {
        setState(() => _sponsorName = 'Invalid Sponsor ID');
      }
    } catch (_) {
      setState(() => _sponsorName = 'Network Error');
    } finally {
      setState(() => _isCheckingSponsor = false);
    }
  }

  Future<void> _submitRegister() async {
    if (!_formKey.currentState!.validate()) return;
    if (_sponsorName.contains('Invalid')) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid Sponsor ID'), backgroundColor: AppColors.error),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final res = await http.post(
        Uri.parse('${AppConstants.apiBaseUrl}/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'name': _nameController.text.trim().toUpperCase(),
          'mobile': _mobileController.text.trim(),
          'sponsorId': _sponsorController.text.trim().toUpperCase(),
          'password': _passwordController.text.trim(),
        }),
      );

      final data = jsonDecode(res.body);

      if ((res.statusCode == 200 || res.statusCode == 201) && data['success'] == true) {
        final registeredUser = data['user'] ?? data['data'];
        if (mounted) {
          context.pushReplacement('/register_success', extra: {
            'memberId': registeredUser['memberId'],
            'password': _passwordController.text.trim(),
            'fullName': _nameController.text.trim().toUpperCase(),
            'mobile': _mobileController.text.trim(),
          });
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(data['message'] ?? 'Registration failed'), backgroundColor: AppColors.error),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Server connection failed. Try again.'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Add New Member'),
        backgroundColor: AppColors.darkNavy,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [AppColors.primary, AppColors.primaryDark]),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.person_add_alt_1, color: Colors.white, size: 32),
                    SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Direct Registration', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                          SizedBox(height: 4),
                          Text('Register a new team member instantly under your downline.', style: TextStyle(color: Colors.white70, fontSize: 12)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Full Name
              const Text('Full Name', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _nameController,
                textCapitalization: TextCapitalization.characters,
                decoration: InputDecoration(
                  hintText: 'Enter full name (e.g. RAJESH KUMAR)',
                  prefixIcon: const Icon(Icons.person_outline),
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
                ),
                validator: (val) => val == null || val.trim().isEmpty ? 'Full Name is required' : null,
              ),

              const SizedBox(height: 18),

              // Mobile Number
              const Text('Mobile Number', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _mobileController,
                keyboardType: TextInputType.phone,
                maxLength: 10,
                decoration: InputDecoration(
                  counterText: '',
                  hintText: '10-digit mobile number',
                  prefixIcon: const Icon(Icons.phone_outlined),
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
                ),
                validator: (val) {
                  if (val == null || val.trim().length != 10) return 'Enter a valid 10-digit mobile number';
                  return null;
                },
              ),

              const SizedBox(height: 18),

              // Sponsor ID
              const Text('Sponsor ID', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _sponsorController,
                textCapitalization: TextCapitalization.characters,
                onChanged: _checkSponsor,
                decoration: InputDecoration(
                  hintText: 'Enter Sponsor ID',
                  prefixIcon: const Icon(Icons.badge_outlined),
                  suffixIcon: _isCheckingSponsor
                      ? const Padding(padding: EdgeInsets.all(12.0), child: SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)))
                      : null,
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
                ),
                validator: (val) => val == null || val.trim().isEmpty ? 'Sponsor ID is required' : null,
              ),
              if (_sponsorName.isNotEmpty) ...[
                const SizedBox(height: 6),
                Row(
                  children: [
                    Icon(
                      _sponsorName.contains('Invalid') || _sponsorName.contains('Error') ? Icons.cancel : Icons.check_circle,
                      size: 14,
                      color: _sponsorName.contains('Invalid') || _sponsorName.contains('Error') ? AppColors.error : AppColors.secondary,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      _sponsorName.contains('Invalid') || _sponsorName.contains('Error') ? _sponsorName : 'Sponsor: $_sponsorName',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: _sponsorName.contains('Invalid') || _sponsorName.contains('Error') ? AppColors.error : AppColors.secondary,
                      ),
                    ),
                  ],
                ),
              ],

              const SizedBox(height: 18),

              // Password (6 digits)
              const Text('Password (6 Digits)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _passwordController,
                keyboardType: TextInputType.number,
                maxLength: 6,
                obscureText: true,
                decoration: InputDecoration(
                  counterText: '',
                  hintText: 'Set 6-digit numeric password',
                  prefixIcon: const Icon(Icons.lock_outline),
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
                ),
                validator: (val) {
                  if (val == null || val.trim().length != 6) return 'Password must be exactly 6 digits';
                  return null;
                },
              ),

              const SizedBox(height: 32),

              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _submitRegister,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 0,
                  ),
                  child: _isLoading
                      ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Text('Register Member', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
