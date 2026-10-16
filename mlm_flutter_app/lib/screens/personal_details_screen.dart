import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/auth_provider.dart';
import '../providers/profile_provider.dart';
import '../utils/constants.dart';

class PersonalDetailsScreen extends StatefulWidget {
  const PersonalDetailsScreen({super.key});

  @override
  State<PersonalDetailsScreen> createState() => _PersonalDetailsScreenState();
}

class _PersonalDetailsScreenState extends State<PersonalDetailsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ProfileProvider>().fetchProfile();
    });
  }

  void _copyToClipboard(String text, String label) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle, color: Colors.white, size: 18),
            const SizedBox(width: 8),
            Text('$label copied to clipboard!'),
          ],
        ),
        backgroundColor: AppColors.secondary,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  String _formatDate(dynamic dateVal) {
    if (dateVal == null) return 'N/A';
    try {
      final d = DateTime.parse(dateVal.toString()).toLocal();
      final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      final day = d.day.toString().padLeft(2, '0');
      final month = months[d.month - 1];
      final year = d.year;
      final hour = d.hour > 12 ? d.hour - 12 : (d.hour == 0 ? 12 : d.hour);
      final ampm = d.hour >= 12 ? 'PM' : 'AM';
      final min = d.minute.toString().padLeft(2, '0');
      return '$day $month $year, $hour:$min $ampm';
    } catch (_) {
      return dateVal.toString();
    }
  }

  @override
  Widget build(BuildContext context) {
    final profileData = context.watch<ProfileProvider>().profileData;
    final authUser = context.watch<AuthProvider>().user;
    final user = profileData ?? authUser;

    final name = (user?['name'] ?? user?['fullName'] ?? '').toString().trim();
    final displayName = name.isNotEmpty ? name : 'Royal Member';
    final memberId = (user?['memberId'] ?? 'N/A').toString().trim();
    final mobile = (user?['mobile'] ?? user?['phone'] ?? 'N/A').toString().trim();
    final email = (user?['email'] ?? '').toString().trim();
    final sponsorId = (user?['sponsorId'] ?? 'Top Sponsor').toString().trim();
    final rank = (user?['rank'] ?? 'STARTER').toString().toUpperCase();
    final bool isActive = user?['isActive'] == true;
    final kycStatus = (user?['kycStatus'] ?? 'Pending').toString();
    final upiId = (user?['upiId'] ?? '').toString().trim();
    final hasQr = (user?['paymentQrCode'] ?? '').toString().trim().isNotEmpty;
    final bankName = (user?['bankName'] ?? '').toString().trim();
    final accNo = (user?['accountNumber'] ?? '').toString().trim();
    final ifsc = (user?['ifscCode'] ?? '').toString().trim();
    final joinDate = _formatDate(user?['createdAt'] ?? user?['joinDate']);
    final activeDate = user?['activatedAt'] != null ? _formatDate(user?['activatedAt']) : null;

    final initial = displayName.isNotEmpty ? displayName[0].toUpperCase() : 'R';

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          'Personal Details',
          style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white),
        ),
        backgroundColor: AppColors.darkNavy,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        child: Column(
          children: [
            // ========== TOP LUXURY HEADER CARD ==========
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF0F172A), Color(0xFF1E1B4B), Color(0xFF2E1065)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: const Color(0xFFD4AF37).withOpacity(0.35), width: 1.2),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF2E1065).withOpacity(0.35),
                    blurRadius: 18,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Column(
                children: [
                  // Avatar with Golden Crown Ring
                  Stack(
                    alignment: Alignment.center,
                    children: [
                      Container(
                        width: 86,
                        height: 86,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: const LinearGradient(
                            colors: [Color(0xFFF0D878), Color(0xFFD4AF37), Color(0xFFB8942E)],
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFFD4AF37).withOpacity(0.4),
                              blurRadius: 16,
                            ),
                          ],
                        ),
                      ),
                      Container(
                        width: 78,
                        height: 78,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: Color(0xFF0F172A),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          initial,
                          style: GoogleFonts.inter(
                            fontSize: 34,
                            fontWeight: FontWeight.w900,
                            color: const Color(0xFFF0D878),
                          ),
                        ),
                      ),
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                            color: Color(0xFFD4AF37),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.workspace_premium, color: Color(0xFF1A0B2E), size: 16),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // Member Name
                  Text(
                    displayName,
                    style: GoogleFonts.inter(
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      color: Colors.white,
                      letterSpacing: 0.3,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),

                  // Member ID Chip with Copy
                  InkWell(
                    onTap: () => _copyToClipboard(memberId, 'Member ID'),
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.white.withOpacity(0.2)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.badge_outlined, color: Color(0xFFF0D878), size: 16),
                          const SizedBox(width: 6),
                          Text(
                            memberId,
                            style: GoogleFonts.inter(
                              color: const Color(0xFFF0D878),
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                              letterSpacing: 1,
                            ),
                          ),
                          const SizedBox(width: 8),
                          const Icon(Icons.copy_rounded, color: Colors.white70, size: 14),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Rank & Status Badge Row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFFD4AF37), Color(0xFFB8942E)],
                          ),
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFFD4AF37).withOpacity(0.35),
                              blurRadius: 8,
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.military_tech_rounded, color: Color(0xFF1A0B2E), size: 15),
                            const SizedBox(width: 4),
                            Text(
                              rank,
                              style: const TextStyle(
                                color: Color(0xFF1A0B2E),
                                fontWeight: FontWeight.w900,
                                fontSize: 12,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 10),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: isActive ? const Color(0xFF10B981).withOpacity(0.2) : Colors.amber.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: isActive ? const Color(0xFF10B981) : Colors.amber,
                            width: 1,
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              isActive ? Icons.check_circle_rounded : Icons.pending_rounded,
                              color: isActive ? const Color(0xFF10B981) : Colors.amber,
                              size: 14,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              isActive ? 'Active Member' : 'Pending ID',
                              style: TextStyle(
                                color: isActive ? const Color(0xFF10B981) : Colors.amber,
                                fontWeight: FontWeight.bold,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // ========== CARD 1: MEMBERSHIP DETAILS ==========
            _buildSectionCard(
              title: 'Membership & Network',
              icon: Icons.badge_outlined,
              children: [
                _buildInfoTile(
                  icon: Icons.person_rounded,
                  label: 'Full Name',
                  value: displayName,
                ),
                _buildDivider(),
                _buildInfoTile(
                  icon: Icons.fingerprint_rounded,
                  label: 'Member ID',
                  value: memberId,
                  trailing: _buildCopyChip(memberId, 'Member ID'),
                ),
                _buildDivider(),
                _buildInfoTile(
                  icon: Icons.group_add_rounded,
                  label: 'Sponsor ID',
                  value: sponsorId,
                  trailing: sponsorId != 'Top Sponsor' ? _buildCopyChip(sponsorId, 'Sponsor ID') : null,
                ),
                _buildDivider(),
                _buildInfoTile(
                  icon: Icons.stars_rounded,
                  label: 'Current Rank',
                  value: rank,
                  customValueWidget: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFFD4AF37).withOpacity(0.12),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFD4AF37).withOpacity(0.4)),
                    ),
                    child: Text(
                      rank,
                      style: const TextStyle(
                        color: Color(0xFFB8942E),
                        fontWeight: FontWeight.w800,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ),
                _buildDivider(),
                _buildInfoTile(
                  icon: Icons.calendar_month_rounded,
                  label: 'Registration Date',
                  value: joinDate,
                ),
                if (activeDate != null) ...[
                  _buildDivider(),
                  _buildInfoTile(
                    icon: Icons.flash_on_rounded,
                    label: 'Activation Date',
                    value: activeDate,
                  ),
                ],
              ],
            ),
            const SizedBox(height: 18),

            // ========== CARD 2: CONTACT DETAILS ==========
            _buildSectionCard(
              title: 'Contact Information',
              icon: Icons.contact_phone_outlined,
              children: [
                _buildInfoTile(
                  icon: Icons.phone_android_rounded,
                  label: 'Mobile Number',
                  value: mobile,
                  trailing: mobile != 'N/A' ? _buildCopyChip(mobile, 'Mobile Number') : null,
                ),
                _buildDivider(),
                _buildInfoTile(
                  icon: Icons.mail_outline_rounded,
                  label: 'Email Address',
                  value: email.isNotEmpty ? email : 'Not Provided',
                ),
              ],
            ),
            const SizedBox(height: 18),

            // ========== CARD 3: BANK & PAYOUT DETAILS ==========
            _buildSectionCard(
              title: 'Payout & Banking Overview',
              icon: Icons.account_balance_rounded,
              actionWidget: TextButton(
                onPressed: () async {
                  await context.push('/payment-settings');
                  if (mounted) context.read<ProfileProvider>().fetchProfile();
                },
                child: const Text('Edit', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
              children: [
                _buildInfoTile(
                  icon: Icons.qr_code_rounded,
                  label: 'Payment QR Code',
                  value: hasQr ? 'QR Code Uploaded & Linked' : 'Not Uploaded Yet',
                  customValueWidget: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: hasQr ? const Color(0xFFD1FAE5) : const Color(0xFFFEF3C7),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      hasQr ? '✓ Uploaded' : '✕ Missing',
                      style: TextStyle(
                        color: hasQr ? const Color(0xFF065F46) : const Color(0xFFD97706),
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ),
                if (upiId.isNotEmpty) ...[
                  _buildDivider(),
                  _buildInfoTile(
                    icon: Icons.alternate_email_rounded,
                    label: 'UPI ID',
                    value: upiId,
                    trailing: _buildCopyChip(upiId, 'UPI ID'),
                  ),
                ],
                if (bankName.isNotEmpty) ...[
                  _buildDivider(),
                  _buildInfoTile(
                    icon: Icons.account_balance_outlined,
                    label: 'Bank Name',
                    value: bankName,
                  ),
                ],
                if (accNo.isNotEmpty) ...[
                  _buildDivider(),
                  _buildInfoTile(
                    icon: Icons.pin_outlined,
                    label: 'Account Number',
                    value: accNo.length > 4 ? '•••• ${accNo.substring(accNo.length - 4)}' : accNo,
                  ),
                ],
                if (ifsc.isNotEmpty) ...[
                  _buildDivider(),
                  _buildInfoTile(
                    icon: Icons.domain_rounded,
                    label: 'IFSC Code',
                    value: ifsc,
                  ),
                ],
              ],
            ),
            const SizedBox(height: 18),

            // ========== CARD 4: KYC STATUS ==========
            _buildSectionCard(
              title: 'KYC Compliance Status',
              icon: Icons.verified_user_outlined,
              actionWidget: TextButton(
                onPressed: () => context.push('/kyc'),
                child: const Text('View KYC', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
              children: [
                _buildInfoTile(
                  icon: Icons.security_rounded,
                  label: 'Verification Status',
                  value: kycStatus,
                  customValueWidget: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: kycStatus == 'Approved'
                          ? const Color(0xFFD1FAE5)
                          : (kycStatus == 'Rejected' ? const Color(0xFFFEE2E2) : const Color(0xFFFEF3C7)),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      kycStatus == 'Approved' ? '✓ Verified' : kycStatus,
                      style: TextStyle(
                        color: kycStatus == 'Approved'
                            ? const Color(0xFF065F46)
                            : (kycStatus == 'Rejected' ? const Color(0xFFB91C1C) : const Color(0xFFD97706)),
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionCard({
    required String title,
    required IconData icon,
    required List<Widget> children,
    Widget? actionWidget,
  }) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.025),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 16, 18, 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(7),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(icon, color: AppColors.primary, size: 18),
                    ),
                    const SizedBox(width: 10),
                    Text(
                      title,
                      style: GoogleFonts.inter(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF0F172A),
                      ),
                    ),
                  ],
                ),
                if (actionWidget != null) actionWidget,
              ],
            ),
          ),
          const Divider(height: 1, color: Color(0xFFF1F5F9)),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
            child: Column(children: children),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoTile({
    required IconData icon,
    required String label,
    required String value,
    Widget? trailing,
    Widget? customValueWidget,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 9),
      child: Row(
        children: [
          Icon(icon, size: 18, color: const Color(0xFF94A3B8)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(
                    fontSize: 11,
                    color: Color(0xFF64748B),
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
                if (customValueWidget != null)
                  customValueWidget
                else
                  Text(
                    value,
                    style: const TextStyle(
                      fontSize: 14,
                      color: Color(0xFF0F172A),
                      fontWeight: FontWeight.w700,
                    ),
                  ),
              ],
            ),
          ),
          if (trailing != null) trailing,
        ],
      ),
    );
  }

  Widget _buildCopyChip(String text, String label) {
    return InkWell(
      onTap: () => _copyToClipboard(text, label),
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(8),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.copy_rounded, size: 13, color: Color(0xFF475569)),
            SizedBox(width: 4),
            Text('Copy', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF475569))),
          ],
        ),
      ),
    );
  }

  Widget _buildDivider() {
    return const Divider(height: 1, thickness: 1, color: Color(0xFFF8FAFC));
  }
}
