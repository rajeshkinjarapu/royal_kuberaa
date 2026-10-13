import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import '../utils/constants.dart';

class AdminAppUploadScreen extends StatefulWidget {
  const AdminAppUploadScreen({super.key});

  @override
  State<AdminAppUploadScreen> createState() => _AdminAppUploadScreenState();
}

class _AdminAppUploadScreenState extends State<AdminAppUploadScreen> {
  final _versionController = TextEditingController(text: '1.0.0');
  final _notesController = TextEditingController(text: 'Production release with full features.');

  @override
  void dispose() {
    _versionController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _openDownloadUrl() async {
    final uri = Uri.parse('${AppConstants.apiBaseUrl}/app/download');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open download link'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('App Version & Release', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 18)),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Current Version Banner
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [AppColors.primary, AppColors.primaryDark]),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Current Published APK', style: TextStyle(color: Colors.white70, fontSize: 12)),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(12)),
                        child: const Text('LIVE', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text('Royal Kuberaa Android App', style: GoogleFonts.inter(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  const Text('Release Package: RoyalKuberaa.apk', style: TextStyle(color: Colors.white60, fontSize: 12)),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    onPressed: _openDownloadUrl,
                    icon: const Icon(Icons.download, size: 18),
                    label: const Text('Test APK Download Link'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: AppColors.primary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      elevation: 0,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Distribution Controls
            const Text('Shorebird & GitHub Actions CI/CD', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.bolt, color: Colors.orange, size: 24),
                      SizedBox(width: 8),
                      Text('Over-The-Air (OTA) Code Push', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    ],
                  ),
                  SizedBox(height: 8),
                  Text(
                    'With Shorebird integration active on this application, you do NOT need to rebuild or ask members to reinstall the APK for Dart code changes or bug fixes.\n\nSimply run:\n`shorebird patch android`\nand all active app installations will update automatically within seconds!',
                    style: TextStyle(color: AppColors.textSecondary, fontSize: 12, height: 1.4),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Public Download Endpoint Info
            const Text('Direct Member Download URL', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                children: [
                  const Icon(Icons.link, size: 20, color: AppColors.primary),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Text(
                      '${AppConstants.apiBaseUrl}/app/download',
                      style: TextStyle(fontSize: 12, fontFamily: 'monospace', fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
