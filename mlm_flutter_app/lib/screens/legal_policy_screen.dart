import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../utils/constants.dart';

class LegalPolicyScreen extends StatelessWidget {
  final int initialTabIndex;

  const LegalPolicyScreen({super.key, this.initialTabIndex = 0});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      initialIndex: initialTabIndex.clamp(0, 3),
      length: 4,
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: Text('Legal & Compliance', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 18)),
          backgroundColor: Colors.white,
          foregroundColor: AppColors.textPrimary,
          elevation: 0,
          bottom: const TabBar(
            isScrollable: true,
            labelColor: AppColors.primary,
            unselectedLabelColor: AppColors.textSecondary,
            indicatorColor: AppColors.primary,
            indicatorWeight: 3,
            labelStyle: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
            tabs: [
              Tab(text: 'Terms & Conditions'),
              Tab(text: 'Privacy Policy'),
              Tab(text: 'Return & Refund'),
              Tab(text: 'Disclaimer'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            _buildTabContent(
              'Terms & Conditions',
              'Last Updated: October 2026',
              '''1. ACCEPTANCE OF TERMS
By accessing and using the Royal Kuberaa mobile platform or website, you agree to be bound by these Terms and Conditions and our business operating guidelines.

2. ELIGIBILITY & MEMBERSHIP
Membership is open to Indian citizens aged 18 years and above. Each individual is permitted to register one primary member account with verified KYC documents (Aadhaar & PAN).

3. REGISTRATION PACKAGE & WELCOME KIT
The standard registration fee is ₹1,500 (inclusive of applicable taxes), which provides an initial Welcome Product Kit, personal dashboard access, and placement in the matrix business distribution model.

4. 100% NON-WORKING RECOVERY
Members not actively sponsoring directs remain eligible for daily non-working cashback distributions up to ₹1,000 maximum recovery, subject to daily global company turnover pools.

5. WITHDRAWALS & TAX COMPLIANCE
All earnings withdrawals are processed via direct NEFT/IMPS bank transfer subject to:
• Minimum withdrawal amount: ₹200
• Statutory TDS deduction: 5% (with valid PAN)
• System Admin & Maintenance charge: 10%

6. ACCOUNT INTEGRITY
Creation of fraudulent accounts, unauthorized promotional claims, or violation of ethical guidelines will result in permanent account deactivation.''',
            ),
            _buildTabContent(
              'Privacy Policy',
              'Last Updated: October 2026',
              '''1. INFORMATION WE COLLECT
We collect personal identification details necessary for financial compliance and account management, including:
• Full Name, Mobile Number, and Email Address
• PAN Card Number & Aadhaar Number (for mandatory KYC)
• Bank Account Number, IFSC code, and Branch Name

2. HOW WE USE YOUR INFORMATION
Your personal and financial information is strictly utilized to:
• Authenticate login credentials and process secure transactions
• Disburse withdrawal payouts directly to verified bank accounts
• Comply with statutory tax regulations (TDS filings)
• Send important account notifications and OTPs

3. DATA SECURITY
We employ industry-standard 256-bit SSL encryption for data transmission and store hashed passwords and TPINs. We do not sell, rent, or lease member data to third-party marketing agencies.

4. USER RIGHTS
You retain the right to review your registered profile data at any time via the Profile & KYC dashboard.''',
            ),
            _buildTabContent(
              'Return & Refund Policy',
              'Last Updated: October 2026',
              '''1. PRODUCT DISPATCH & WELCOME KIT
Upon successful account activation with ₹1,500 package, your Welcome Product Kit is initiated for delivery to your registered shipping address within 7-10 business days.

2. CANCELLATION PERIOD
Members may cancel their activation and request a full package refund within 48 hours of initial payment, provided the Welcome Product Kit has not yet been dispatched.

3. DAMAGED OR DEFECTIVE PRODUCTS
If you receive a defective or damaged Welcome Product, contact Customer Support within 48 hours of delivery with photographic evidence. A replacement kit will be dispatched free of charge.

4. DIGITAL COMMISSIONS
Once registration funds have been mathematically split and credited into downline commission pools, direct bonuses, and royalty pools according to the business plan, digital transactions are irrevocable.''',
            ),
            _buildTabContent(
              'Legal Disclaimer',
              'Last Updated: October 2026',
              '''1. BUSINESS OPPORTUNITY DISCLAIMER
Royal Kuberaa provides an innovative, automated affiliate and royalty-sharing software model. Participation represents an entrepreneurial business initiative; income projections depend on personal effort, team development, and company revenue pools.

2. NO GUARANTEED WEALTH CLAIMS
Earnings are derived strictly from product package sales and company turnover allocations. We make no representations of fixed interest, deposit returns, or speculative financial instruments.

3. GOVERNING LAW
Any disputes arising out of or related to these policies shall be subject to the exclusive jurisdiction of the competent courts in India.''',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTabContent(String title, String subtitle, String content) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20.0),
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
            const SizedBox(height: 4),
            Text(subtitle, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w600)),
            const Divider(height: 28),
            Text(
              content,
              style: const TextStyle(fontSize: 13, color: Color(0xFF334155), height: 1.6),
            ),
          ],
        ),
      ),
    );
  }
}
