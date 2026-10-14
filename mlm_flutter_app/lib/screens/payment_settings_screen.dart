import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import '../providers/profile_provider.dart';
import '../utils/constants.dart';

class PaymentSettingsScreen extends StatefulWidget {
  const PaymentSettingsScreen({super.key});

  @override
  State<PaymentSettingsScreen> createState() => _PaymentSettingsScreenState();
}

class _PaymentSettingsScreenState extends State<PaymentSettingsScreen> {
  final _upiController = TextEditingController();
  File? _selectedImage;
  bool _isLoading = false;
  final ImagePicker _picker = ImagePicker();

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
        _upiController.text = data['paymentQrCode'] ?? '';
      });
    }
  }

  @override
  void dispose() {
    _upiController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    try {
      final XFile? picked = await _picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1024,
        maxHeight: 1024,
        imageQuality: 85,
      );
      if (picked != null) {
        setState(() {
          _selectedImage = File(picked.path);
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error picking image: $e'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  Future<void> _saveQrSettings() async {
    if (_selectedImage == null && _upiController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a QR code image or enter UPI ID.')),
      );
      return;
    }

    setState(() => _isLoading = true);
    final provider = context.read<ProfileProvider>();
    bool success = false;

    // 1. Upload QR image file if chosen
    if (_selectedImage != null) {
      success = await provider.uploadPaymentQr(_selectedImage!);
    } else if (_upiController.text.trim().isNotEmpty) {
      success = await provider.updatePaymentQr(_upiController.text.trim());
    }

    setState(() => _isLoading = false);

    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Row(
              children: [
                Icon(Icons.check_circle, color: Colors.white, size: 20),
                SizedBox(width: 8),
                Text('Payment QR Code Saved Successfully!'),
              ],
            ),
            backgroundColor: AppColors.secondary,
          ),
        );
        setState(() => _selectedImage = null);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(provider.errorMessage.isNotEmpty ? provider.errorMessage : 'Failed to save QR code.'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final profile = context.watch<ProfileProvider>().profileData;
    final currentQr = profile?['paymentQrCode'] ?? '';
    final hasExistingQr = currentQr.toString().isNotEmpty;

    String qrImageUrl = '';
    if (hasExistingQr && currentQr.toString().startsWith('/uploads')) {
      final base = AppConstants.apiBaseUrl.replaceAll('/api', '');
      qrImageUrl = '$base$currentQr';
    } else if (hasExistingQr && (currentQr.toString().startsWith('http://') || currentQr.toString().startsWith('https://'))) {
      qrImageUrl = currentQr.toString();
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Payment QR Settings', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white)),
        backgroundColor: AppColors.darkNavy,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20.0, 20.0, 20.0, 40.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Info Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.darkNavy, Color(0xFF1E293B)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(color: AppColors.darkNavy.withOpacity(0.2), blurRadius: 10, offset: const Offset(0, 4)),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFD4AF37).withOpacity(0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.qr_code_2_rounded, color: Color(0xFFD4AF37), size: 32),
                  ),
                  const SizedBox(width: 14),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Direct QR Code Payouts',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'Upload PhonePe, GooglePay, or Paytm QR to receive direct payouts without bank forms.',
                          style: TextStyle(color: Colors.white70, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // QR Code Upload Box
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4)),
                ],
              ),
              child: Column(
                children: [
                  Text(
                    'Upload Payment QR Code',
                    style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Screenshot from PhonePe / GooglePay / Paytm',
                    style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
                  ),
                  const SizedBox(height: 18),

                  // Image Display Area
                  GestureDetector(
                    onTap: _pickImage,
                    child: Container(
                      width: 220,
                      height: 220,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: _selectedImage != null ? AppColors.secondary : AppColors.primary.withOpacity(0.4),
                          width: 2,
                          style: BorderStyle.solid,
                        ),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(14),
                        child: _selectedImage != null
                            ? Image.file(_selectedImage!, fit: BoxFit.contain)
                            : qrImageUrl.isNotEmpty
                                ? Image.network(
                                    qrImageUrl,
                                    fit: BoxFit.contain,
                                    errorBuilder: (ctx, err, stack) => _buildPlaceholder(),
                                  )
                                : _buildPlaceholder(),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Choose Image Button
                  OutlinedButton.icon(
                    onPressed: _pickImage,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.primary,
                      side: const BorderSide(color: AppColors.primary),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                    ),
                    icon: const Icon(Icons.photo_library_outlined, size: 20),
                    label: Text(_selectedImage != null ? 'Change Selected Image' : 'Select QR from Gallery'),
                  ),

                  if (_selectedImage != null) ...[
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.check_circle, color: AppColors.secondary, size: 16),
                        const SizedBox(width: 6),
                        Text('Image ready to upload', style: TextStyle(color: Colors.green.shade700, fontSize: 12, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Optional UPI ID
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'UPI ID (Optional)',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _upiController,
                    decoration: InputDecoration(
                      hintText: 'e.g. 9876543210@paytm / name@upi',
                      prefixIcon: const Icon(Icons.alternate_email, color: AppColors.primary),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
                      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.border)),
                      filled: true,
                      fillColor: const Color(0xFFF8FAFC),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 28),

            // Submit Button
            SizedBox(
              width: double.infinity,
              height: 54,
              child: ElevatedButton.icon(
                onPressed: _isLoading ? null : _saveQrSettings,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 2,
                ),
                icon: _isLoading
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Icon(Icons.cloud_upload_outlined),
                label: Text(
                  _isLoading ? 'Uploading...' : 'SAVE PAYMENT QR CODE',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, letterSpacing: 0.8),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlaceholder() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(Icons.qr_code_scanner, size: 48, color: Colors.grey.shade400),
        const SizedBox(height: 8),
        Text('No QR Code Uploaded', style: TextStyle(color: Colors.grey.shade600, fontSize: 13, fontWeight: FontWeight.w600)),
        const SizedBox(height: 4),
        Text('Tap to select image', style: TextStyle(color: AppColors.primary.withOpacity(0.8), fontSize: 11, fontWeight: FontWeight.bold)),
      ],
    );
  }
}
