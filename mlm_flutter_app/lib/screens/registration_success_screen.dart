import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import '../utils/constants.dart';

class RegistrationSuccessScreen extends StatefulWidget {
  final Map<String, dynamic> credentials;

  const RegistrationSuccessScreen({super.key, required this.credentials});

  @override
  State<RegistrationSuccessScreen> createState() => _RegistrationSuccessScreenState();
}

class _RegistrationSuccessScreenState extends State<RegistrationSuccessScreen>
    with SingleTickerProviderStateMixin {
  final GlobalKey _cardKey = GlobalKey();
  bool _isSaving = false;
  bool _isSharing = false;
  late AnimationController _animController;
  late Animation<double> _scaleAnim;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(vsync: this, duration: const Duration(milliseconds: 700));
    _scaleAnim = CurvedAnimation(parent: _animController, curve: Curves.elasticOut);
    _animController.forward();
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  Future<Uint8List?> _captureCard() async {
    try {
      final boundary = _cardKey.currentContext?.findRenderObject() as RenderRepaintBoundary?;
      if (boundary == null) return null;
      final image = await boundary.toImage(pixelRatio: 3.0);
      final byteData = await image.toByteData(format: ui.ImageByteFormat.png);
      return byteData?.buffer.asUint8List();
    } catch (e) {
      debugPrint('Capture error: $e');
      return null;
    }
  }

  Future<void> _saveAndShare() async {
    setState(() => _isSaving = true);
    try {
      final bytes = await _captureCard();
      if (bytes == null) throw Exception('Could not capture card');

      final dir = await getTemporaryDirectory();
      final file = File('${dir.path}/RoyalKuberaa_${widget.credentials['memberId'] ?? 'ID'}.png');
      await file.writeAsBytes(bytes);

      await Share.shareXFiles(
        [XFile(file.path)],
        text: '🏆 Royal Kuberaa Account Details\nMember ID: ${widget.credentials['memberId']}\n⚠️ Keep this safe!',
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: ${e.toString()}'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<void> _shareText() async {
    setState(() => _isSharing = true);
    try {
      final memberId = widget.credentials['memberId'] ?? '';
      final password = widget.credentials['password'] ?? '';
      final fullName = widget.credentials['fullName'] ?? '';
      await Share.share(
        '🏆 Royal Kuberaa - New Account Created!\n\nName: $fullName\nMember ID: $memberId\nPassword: $password\n\n⚠️ Keep this safe! Never share with anyone.',
      );
    } finally {
      if (mounted) setState(() => _isSharing = false);
    }
  }

  Future<void> _copyToClipboard() async {
    final memberId = widget.credentials['memberId'] ?? '';
    final password = widget.credentials['password'] ?? '';
    final fullName = widget.credentials['fullName'] ?? '';
    await Clipboard.setData(ClipboardData(
      text: 'Royal Kuberaa Account\nName: $fullName\nMember ID: $memberId\nPassword: $password\n⚠️ Keep this safe!',
    ));
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Row(children: [
            Icon(Icons.copy, color: Colors.white, size: 18),
            SizedBox(width: 8),
            Text('Copied to clipboard!'),
          ]),
          backgroundColor: Colors.indigo,
          duration: Duration(seconds: 2),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final memberId = widget.credentials['memberId'] ?? 'ERROR';
    final password = widget.credentials['password'] ?? 'ERROR';
    final fullName = widget.credentials['fullName'] ?? 'NEW MEMBER';
    final mobile = widget.credentials['mobile'] ?? '';

    return Scaffold(
      backgroundColor: AppColors.primary,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            children: [
              const SizedBox(height: 12),
              ScaleTransition(
                scale: _scaleAnim,
                child: Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.15),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.check_circle, color: AppColors.secondary, size: 70),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Registration Successful! 🎉',
                style: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 6),
              const Text(
                'Save your account details below safely!',
                style: TextStyle(color: Colors.white70, fontSize: 13),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),

              // ===== CAPTURE CARD (RepaintBoundary) =====
              RepaintBoundary(
                key: _cardKey,
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(28),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(color: Colors.black.withOpacity(0.25), blurRadius: 30, offset: const Offset(0, 15)),
                    ],
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
                            child: const Text('RK', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w900, fontSize: 18)),
                          ),
                          const SizedBox(width: 10),
                          Text('ROYAL KUBERAA', style: GoogleFonts.inter(color: AppColors.primary, fontWeight: FontWeight.w900, fontSize: 16, letterSpacing: 1.5)),
                        ],
                      ),
                      const SizedBox(height: 4),
                      const Text('Account Details Card', style: TextStyle(color: AppColors.textSecondary, fontSize: 11)),
                      const Padding(padding: EdgeInsets.symmetric(vertical: 18), child: Divider(color: AppColors.border)),

                      _buildInfoRow(Icons.person_outline, 'Full Name', fullName, AppColors.textPrimary),
                      if (mobile.isNotEmpty) ...[
                        const SizedBox(height: 10),
                        _buildInfoRow(Icons.phone_outlined, 'Mobile', mobile, AppColors.textPrimary),
                      ],
                      const SizedBox(height: 16),

                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(colors: [AppColors.primary, AppColors.primaryDark]),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('MEMBER ID (LOGIN ID)', style: TextStyle(color: Colors.white70, fontSize: 10, letterSpacing: 1)),
                            const SizedBox(height: 6),
                            Text(memberId, style: GoogleFonts.inter(fontSize: 26, fontWeight: FontWeight.w900, color: Colors.white)),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),

                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.error.withOpacity(0.06),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.error.withOpacity(0.3)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('PASSWORD', style: TextStyle(color: AppColors.error, fontSize: 10, letterSpacing: 1, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 6),
                            Text(password, style: GoogleFonts.inter(fontSize: 26, fontWeight: FontWeight.w900, color: AppColors.error)),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        decoration: BoxDecoration(
                          color: Colors.amber.shade50,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Colors.amber.shade200),
                        ),
                        child: const Row(
                          children: [
                            Text('⚠️', style: TextStyle(fontSize: 16)),
                            SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'Never share your password. Royal Kuberaa will never ask for it.',
                                style: TextStyle(color: Colors.orange, fontSize: 11, fontWeight: FontWeight.w600),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              // ===== END CAPTURE CARD =====

              const SizedBox(height: 20),

              // 3 Action Buttons
              Row(
                children: [
                  Expanded(
                    child: _buildActionBtn(
                      icon: Icons.download_rounded,
                      label: _isSaving ? 'Saving...' : 'Save Image',
                      color: AppColors.secondary,
                      isLoading: _isSaving,
                      onTap: _isSaving ? null : _saveAndShare,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildActionBtn(
                      icon: Icons.share_rounded,
                      label: _isSharing ? 'Sharing...' : 'Share Text',
                      color: Colors.orange,
                      isLoading: _isSharing,
                      onTap: _isSharing ? null : _shareText,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _buildActionBtn(
                      icon: Icons.copy_rounded,
                      label: 'Copy Details',
                      color: Colors.indigo.shade300,
                      isLoading: false,
                      onTap: _copyToClipboard,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton.icon(
                  onPressed: () => context.go('/login'),
                  icon: const Icon(Icons.login_rounded),
                  label: const Text('Go to Login', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    elevation: 0,
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value, Color textColor) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AppColors.textSecondary),
        const SizedBox(width: 10),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 10, letterSpacing: 0.5)),
            Text(value, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: textColor)),
          ],
        ),
      ],
    );
  }

  Widget _buildActionBtn({required IconData icon, required String label, required Color color, required bool isLoading, VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: color.withOpacity(0.15),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withOpacity(0.5)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            isLoading
                ? SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: color))
                : Icon(icon, color: color, size: 22),
            const SizedBox(height: 4),
            Text(label, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}
