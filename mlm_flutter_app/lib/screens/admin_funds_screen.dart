import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/admin_provider.dart';
import '../utils/constants.dart';
import 'package:intl/intl.dart';

class AdminFundsScreen extends StatefulWidget {
  const AdminFundsScreen({super.key});

  @override
  State<AdminFundsScreen> createState() => _AdminFundsScreenState();
}

class _AdminFundsScreenState extends State<AdminFundsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AdminProvider>().fetchFundRequests();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AdminProvider>();
    final requests = provider.fundRequests;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Fund Requests'),
        elevation: 0,
      ),
      body: provider.isLoading && requests.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: provider.fetchFundRequests,
              child: requests.isEmpty
                  ? const Center(child: Text('No pending fund requests'))
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
                            padding: const EdgeInsets.fromLTRB(16.0, 16.0, 16.0, 40.0),
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
                                    Text('₹${req['amount']}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.green)),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Text('UTR: ${req['utrNumber']}'),
                                Text('Date: ${req['createdAt'] != null || req['requestDate'] != null ? DateFormat('dd MMM yyyy, hh:mm a').format(DateTime.parse(req['createdAt'] ?? req['requestDate'])) : 'N/A'}'),
                                const SizedBox(height: 16),
                                if (isPending)
                                  Row(
                                    children: [
                                      Expanded(
                                        child: ElevatedButton(
                                          onPressed: () async {
                                            final success = await provider.processFundRequest(req['_id'], 'approve');
                                            if (success && mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Fund Approved')));
                                          },
                                          style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                                          child: const Text('APPROVE', style: TextStyle(color: Colors.white)),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Expanded(
                                        child: ElevatedButton(
                                          onPressed: () async {
                                            final success = await provider.processFundRequest(req['_id'], 'reject');
                                            if (success && mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Fund Rejected')));
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
