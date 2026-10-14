import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/admin_provider.dart';
import '../utils/constants.dart';
import 'package:intl/intl.dart';

class AdminPayoutsScreen extends StatefulWidget {
  const AdminPayoutsScreen({super.key});

  @override
  State<AdminPayoutsScreen> createState() => _AdminPayoutsScreenState();
}

class _AdminPayoutsScreenState extends State<AdminPayoutsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AdminProvider>().fetchWithdrawals();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AdminProvider>();
    final requests = provider.withdrawals;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Payout Approvals'),
        elevation: 0,
      ),
      body: provider.isLoading && requests.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: provider.fetchWithdrawals,
              child: requests.isEmpty
                  ? const Center(child: Text('No pending payout requests'))
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: requests.length,
                      itemBuilder: (context, index) {
                        final req = requests[index];
                        final isPending = req['status'] == 'Pending';

                        return Card(
                          margin: const EdgeInsets.only(bottom: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          child: Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      (req['memberId'] ?? req['userId']?['memberId'] ?? 'Unknown').toString(),
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                    ),
                                    Text(
                                      '₹${req['netAmount'] ?? req['payableAmount'] ?? req['amount'] ?? 0}',
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.blue),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Text('Gross: ₹${req['grossAmount'] ?? req['amount'] ?? 0} | TDS (5%): ₹${req['tdsAmount'] ?? 0} | Admin (5%): ₹${req['adminChargeAmount'] ?? req['adminCharge'] ?? 0}'),
                                Text('Date: ${req['createdAt'] != null || req['requestDate'] != null ? DateFormat('dd MMM yyyy, hh:mm a').format(DateTime.parse(req['createdAt'] ?? req['requestDate'])) : 'N/A'}'),
                                const SizedBox(height: 16),
                                if (isPending)
                                  Row(
                                    children: [
                                      Expanded(
                                        child: ElevatedButton(
                                          onPressed: () async {
                                            final success = await provider.processWithdrawal(req['_id'], 'approve');
                                            if (success && mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Payout Approved')));
                                          },
                                          style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                                          child: const Text('APPROVE', style: TextStyle(color: Colors.white)),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: ElevatedButton(
                                          onPressed: () async {
                                            final success = await provider.processWithdrawal(req['_id'], 'reject');
                                            if (success && mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Payout Rejected')));
                                          },
                                          style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
                                          child: const Text('REJECT', style: TextStyle(color: Colors.white)),
                                        ),
                                      ),
                                    ],
                                  )
                                else
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: req['status'] == 'Approved' ? Colors.green.withOpacity(0.1) : AppColors.error.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: Text(
                                      req['status'],
                                      style: TextStyle(color: req['status'] == 'Approved' ? Colors.green : AppColors.error, fontWeight: FontWeight.bold),
                                    ),
                                  )
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
    );
  }
}
