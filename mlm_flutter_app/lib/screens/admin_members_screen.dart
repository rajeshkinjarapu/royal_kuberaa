import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/admin_provider.dart';
import '../utils/constants.dart';

class AdminMembersScreen extends StatefulWidget {
  const AdminMembersScreen({super.key});

  @override
  State<AdminMembersScreen> createState() => _AdminMembersScreenState();
}

class _AdminMembersScreenState extends State<AdminMembersScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AdminProvider>().fetchUsers();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AdminProvider>();
    final users = provider.users;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Member Management'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
      ),
      body: provider.isLoading && users.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: provider.fetchUsers,
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: users.length,
                itemBuilder: (context, index) {
                  final user = users[index];
                  final isBlocked = user['status'] == 'Blocked' || user['isBlocked'] == true;
                  final memberId = (user['memberId'] ?? user['id'] ?? 'RK').toString();
                  final name = (user['name'] ?? 'Member').toString();
                  final mobile = (user['mobile'] ?? '').toString();
                  final wallet = user['wallet'] ?? user['mainWallet'] ?? 0;
                  final avatarInitial = memberId.length >= 2 ? memberId.substring(0, 2) : 'RK';

                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      leading: CircleAvatar(
                        backgroundColor: isBlocked ? AppColors.error.withOpacity(0.1) : AppColors.primary.withOpacity(0.1),
                        child: Text(avatarInitial, style: TextStyle(color: isBlocked ? AppColors.error : AppColors.primary, fontWeight: FontWeight.bold)),
                      ),
                      title: Text('$name ($memberId)', style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text('Mobile: $mobile\nWallet: ₹$wallet | Status: ${user['status'] ?? (isBlocked ? 'Blocked' : 'Active')}'),
                      trailing: ElevatedButton(
                        onPressed: () async {
                          final success = await provider.toggleUserBlock(memberId);
                          if (success && mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('User ${isBlocked ? 'Unblocked' : 'Blocked'} Successfully')));
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: isBlocked ? Colors.green : AppColors.error,
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                        ),
                        child: Text(isBlocked ? 'UNBLOCK' : 'BLOCK', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  );
                },
              ),
            ),
    );
  }
}
