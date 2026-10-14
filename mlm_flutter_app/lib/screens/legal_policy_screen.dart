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
          title: Text(
            'Legal & Compliance',
            style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white),
          ),
          backgroundColor: AppColors.darkNavy,
          foregroundColor: Colors.white,
          elevation: 0,
          bottom: const TabBar(
            isScrollable: true,
            labelColor: Colors.white,
            unselectedLabelColor: Colors.white60,
            indicatorColor: AppColors.accent,
            indicatorWeight: 3,
            labelStyle: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
            tabs: [
              Tab(text: 'Terms & Plan Conditions'),
              Tab(text: 'Privacy Policy'),
              Tab(text: 'Return & Refund'),
              Tab(text: 'Legal Disclaimer'),
            ],
          ),
        ),
        body: TabBarView(
          children: [
            // Tab 1: Terms & Conditions (100% matched to Official BUSINESS_PLAN.md)
            _buildContentWrapper(
              title: 'Terms & Business Plan Conditions',
              subtitle: 'Official Distributor Agreement & Compensation Plan Guidelines',
              children: [
                _buildSectionCard(
                  number: '1',
                  title: 'ACCEPTANCE OF TERMS & ELIGIBILITY',
                  content:
                      'By accessing and registering on the Royal Kuberaa mobile platform or website, you confirm that you are an Indian citizen of at least 18 years of age. You agree to act as an Independent Affiliate Distributor and be legally bound by these operating rules, compliance policies, and compensation guidelines.',
                ),
                _buildSectionCard(
                  number: '2',
                  title: 'MEMBERSHIP PACKAGE & WELCOME PRODUCT KIT',
                  content:
                      'The standard registration activation fee is ₹1,500 (inclusive of applicable taxes). Each activation provides:\n'
                      '• High-quality physical Welcome Product Kit delivered to your address\n'
                      '• Lifetime personal member dashboard & genealogy access\n'
                      '• Placement in the 10-Level Team Distribution & Global Royalty Network\n'
                      '• 100% Joining Fund Distribution across members with zero company retention from product pack.',
                ),
                _buildSectionCard(
                  number: '3',
                  title: 'DIRECT REFERRAL INCOME (₹400 PER JOINING)',
                  content:
                      '• Earn ₹400 instant commission for every member you directly sponsor.\n'
                      '• Unlimited direct referrals are permitted.\n'
                      '• Plus, for each direct referral you also earn Level 1 income of ₹100, totaling ₹500 per direct!',
                ),
                _buildSectionCard(
                  number: '4',
                  title: 'TEAM LEVEL INCOME (10 LEVELS — ₹300 FUND)',
                  content:
                      'Earn team commissions up to 10 generations deep from your entire unilevel network without any binary pair matching requirements:\n'
                      '• Level 1: ₹100 per member\n'
                      '• Level 2: ₹50 per member\n'
                      '• Level 3: ₹40 per member\n'
                      '• Level 4: ₹30 per member\n'
                      '• Level 5: ₹20 per member\n'
                      '• Levels 6 & 7: ₹15 per member each\n'
                      '• Levels 8, 9 & 10: ₹10 per member each\n'
                      'Total ₹300 distributed per activation with no daily capping or flush-outs on level earnings.',
                ),
                _buildSectionCard(
                  number: '5',
                  title: 'DAILY ROYALTY POOLS (₹400 FUND — MIDNIGHT SHARE)',
                  content:
                      'From every ₹1,500 joining in the company, ₹400 is contributed to 4 Global Daily Royalty Pools and distributed EQUALLY every night at 12:00 AM among all qualified members:\n'
                      '• Gold Pool (₹120 / joining): Refer 2 Directs | Lifetime Capping: ₹20,000\n'
                      '• Platinum Pool (₹60 / joining): 2 Directs become Gold | Lifetime Capping: ₹1,00,000\n'
                      '• Ruby Pool (₹70 / joining): 5 Directs become Platinum | Lifetime Capping: ₹5,00,000\n'
                      '• Diamond Pool (₹150 / joining): 5 Directs become Ruby | Lifetime Capping: ₹25,00,000\n'
                      'Once a member reaches their tier capping limit, pool distributions for that rank automatically complete.',
                ),
                _buildSectionCard(
                  number: '6',
                  title: 'GLOBAL FIFO AUTOPOOL (100% CASHBACK — ₹1,500 CAPPING)',
                  content:
                      'Revolutionary 100% cashback guarantee for every single activated member:\n'
                      '• ₹150 from every company joining is deposited into the Global FIFO Autopool Fund.\n'
                      '• Distributed EQUALLY among the active Top 10 members in the FIFO queue (₹15.00 each on every company joining).\n'
                      '• ₹1,500 Full Capping: Each member in queue continues to receive ₹15 per joining until they recover 100% of their ₹1,500 activation package!\n'
                      '• Once ₹1,500 is completed, the member graduates, and the next member in line steps into the active Top 10.\n'
                      '• Earning Direct or Level income does NOT stop or impact your FIFO Autopool cashback.',
                ),
                _buildSectionCard(
                  number: '7',
                  title: 'REBIRTH ID SYSTEM (90% MAIN / 10% REBIRTH SPLIT)',
                  content:
                      '• 90% of all member earnings go directly into the Main Wallet (available for immediate withdrawal or P2P transfer).\n'
                      '• 10% is automatically routed to the Rebirth Wallet.\n'
                      '• When the Rebirth Wallet reaches ₹1,500, a new automated Rebirth ID position is created under your original sponsor, injecting:\n'
                      '   - ₹400 into Passive Sponsor Income\n'
                      '   - ₹1,100 directly into the 4 Daily Royalty Pools for perpetual growth.',
                ),
                _buildSectionCard(
                  number: '8',
                  title: 'WITHDRAWALS, STATUTORY TAXES & DEDUCTIONS',
                  content:
                      '• Minimum Withdrawal Limit: ₹500 per transaction.\n'
                      '• Statutory TDS (Section 194H): 5% deducted for income tax compliance.\n'
                      '• Platform Maintenance & Admin Charge: 5%.\n'
                      '• Total Deduction: Exactly 10% (You receive 90% net payout).\n'
                      '• Direct Payout Modes: Instant transfer to your uploaded PhonePe / GooglePay / Paytm QR Code, UPI ID, or registered Bank Account.\n'
                      '• 4-Digit T-PIN: Mandatory security PIN required for all financial transactions.\n'
                      '• P2P Wallet Transfer: 5% service charge applies.',
                ),
                _buildSectionCard(
                  number: '9',
                  title: 'CODE OF CONDUCT & TERMINATION',
                  content:
                      'Members must adhere to fair business practices. Cross-sponsoring, deceptive marketing, making false claims of fixed guaranteed banking interest, or tampering with system security will result in immediate termination of membership and forfeiture of pending balances.',
                ),
              ],
            ),

            // Tab 2: Privacy Policy
            _buildContentWrapper(
              title: 'Privacy Policy',
              subtitle: 'How Royal Kuberaa safeguards your personal and financial data',
              children: [
                _buildSectionCard(
                  number: '1',
                  title: 'INFORMATION WE COLLECT',
                  content:
                      'We collect only essential details necessary for secure financial disbursements and account verification:\n'
                      '• Profile Details: Full Name, Registered Mobile Number, and Password\n'
                      '• Payout Details: PhonePe / GooglePay / Paytm Payment QR Code Image, UPI ID\n'
                      '• Statutory KYC: PAN Card Number & Aadhaar Number (for legal TDS tax returns)\n'
                      '• Bank Details: Account Number, Bank Name, and IFSC Code\n'
                      '• Security Credentials: 4-digit Transaction PIN (stored in hashed, encrypted format).',
                ),
                _buildSectionCard(
                  number: '2',
                  title: 'HOW YOUR INFORMATION IS USED',
                  content:
                      '• Authenticating your secure member login and T-PIN transactions\n'
                      '• Transferring daily withdrawal commissions directly to your QR Code or UPI\n'
                      '• Calculating unilevel team structure, genealogy, and royalty qualification\n'
                      '• Filing annual Form 16A TDS certificates with the Income Tax Department\n'
                      '• Sending transaction SMS alerts, payout receipts, and security updates.',
                ),
                _buildSectionCard(
                  number: '3',
                  title: 'DATA PROTECTION & SECURITY',
                  content:
                      'We employ industry-standard 256-bit SSL encryption for all network traffic. Passwords and 4-digit T-PINs are cryptographically hashed and never stored in plain text. We do not sell, rent, or trade member data to third-party marketing firms.',
                ),
                _buildSectionCard(
                  number: '4',
                  title: 'USER RIGHTS & DATA ACCESS',
                  content:
                      'You retain full access to view, update, and audit your personal details, payment QR code, and bank credentials at any time through the Profile & KYC settings in the app.',
                ),
              ],
            ),

            // Tab 3: Return & Refund Policy
            _buildContentWrapper(
              title: 'Product Delivery, Return & Refund Policy',
              subtitle: 'Fair, transparent terms for tangible products and physical kits',
              children: [
                _buildSectionCard(
                  number: '1',
                  title: 'WELCOME PRODUCT KIT DISPATCH',
                  content:
                      'Upon successful ID activation with ₹1,500 package, your selected Welcome Product Kit is processed and dispatched to your delivery address with active tracking details provided in your orders dashboard.',
                ),
                _buildSectionCard(
                  number: '2',
                  title: '48-HOUR CANCELLATION PERIOD',
                  content:
                      'Members may cancel their activation and request a full package refund within 48 hours of initial activation, provided the product kit has not yet been dispatched from the warehouse.',
                ),
                _buildSectionCard(
                  number: '3',
                  title: 'DAMAGED OR DEFECTIVE SHIPMENTS',
                  content:
                      'If a product package arrives damaged or defective, please contact Support within 48 hours with photographic evidence. A free replacement product kit will be dispatched immediately without extra charge.',
                ),
                _buildSectionCard(
                  number: '4',
                  title: 'COMMISSION ALLOCATION FINALITY',
                  content:
                      'Once mathematical distribution into 10-level commissions, direct referral bonuses, daily royalty pools, and FIFO autopool funds has been executed, digital commissions credited to members are irrevocable.',
                ),
              ],
            ),

            // Tab 4: Legal Disclaimer
            _buildContentWrapper(
              title: 'Official Legal Disclaimer',
              subtitle: 'Statutory disclosures regarding business participation',
              children: [
                _buildSectionCard(
                  number: '1',
                  title: 'DIRECT SELLING & AFFILIATE MODEL',
                  content:
                      'Royal Kuberaa operates an affiliate direct-selling distribution model backed by genuine tangible consumer products. Participation is an entrepreneurial affiliate business; personal income depends on individual performance, team expansion, and overall product sales volume.',
                ),
                _buildSectionCard(
                  number: '2',
                  title: 'NO SPECULATIVE DEPOSIT OR CHIT FUND CLAIMS',
                  content:
                      'Royal Kuberaa is strictly NOT an investment scheme, chit fund, or collective deposit program. The company does not solicit public deposits or promise fixed speculative interest. 100% of product pack funds are redistributed mathematically according to the published compensation plan.',
                ),
                _buildSectionCard(
                  number: '3',
                  title: 'GOVERNING LAW & JURISDICTION',
                  content:
                      'All distributor agreements, transactions, and company operations are governed in accordance with the direct selling guidelines and laws of the Republic of India. Any legal dispute shall be subject to the exclusive jurisdiction of the competent courts in India.',
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContentWrapper({
    required String title,
    required String subtitle,
    required List<Widget> children,
  }) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(18.0, 20.0, 18.0, 40.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.04),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.verified_user_rounded, color: AppColors.primary, size: 22),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            title,
                            style: GoogleFonts.inter(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            subtitle,
                            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Text(
                    'Last Updated: October 2026 • Royal Kuberaa Compliance',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF475569)),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Section cards
          ...children,
        ],
      ),
    );
  }

  Widget _buildSectionCard({
    required String number,
    required String title,
    required String content,
  }) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 26,
                height: 26,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: AppColors.primary,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  number,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                    letterSpacing: 0.2,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            content,
            style: const TextStyle(
              fontSize: 13,
              color: Color(0xFF334155),
              height: 1.55,
            ),
          ),
        ],
      ),
    );
  }
}
