import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/admin_provider.dart';
import '../utils/constants.dart';

class AdminKycScreen extends StatefulWidget {
  const AdminKycScreen({super.key});

  @override
  State<AdminKycScreen> createState() => _AdminKycScreenState();
}

class _AdminKycScreenState extends State<AdminKycScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AdminProvider>().fetchKycRequests();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AdminProvider>();
    final requests = provider.kycRequests;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('KYC Approvals'),
        elevation: 0,
      ),
      body: provider.isLoading && requests.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: provider.fetchKycRequests,
              child: requests.isEmpty
                  ? const Center(child: Text('No pending KYC requests'))
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: requests.length,
                      itemBuilder: (context, index) {
                        final req = requests[index];

                        return Card(
                          margin: const EdgeInsets.only(bottom: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          child: Padding(
                            padding: const EdgeInsets.fromLTRB(16.0, 16.0, 16.0, 40.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('${req['name']} (${req['memberId']})', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                const Divider(),
                                Text('PAN: ${req['panNumber']}'),
                                Text('Aadhar: ${req['aadharNumber']}'),
                                Text('Bank: ${req['bankName']} - ${req['accountNumber']}'),
                                Text('IFSC: ${req['ifscCode']}'),
                                const SizedBox(height: 16),
                                Row(
                                  children: [
                                    Expanded(
                                      child: ElevatedButton(
                                        onPressed: () async {
                                          final success = await provider.processKyc(req['memberId'], 'approve');
                                          if (success && mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Approved')));
                                        },
                                        style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                                        child: const Text('APPROVE', style: TextStyle(color: Colors.white)),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: ElevatedButton(
                                        onPressed: () async {
                                          final success = await provider.processKyc(req['memberId'], 'reject');
                                          if (success && mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Rejected')));
                                        },
                                        style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
                                        child: const Text('REJECT', style: TextStyle(color: Colors.white)),
                                      ),
                                    ),
                                  ],
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
