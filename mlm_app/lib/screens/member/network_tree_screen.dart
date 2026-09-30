import 'package:flutter/material.dart';

class NetworkTreeScreen extends StatelessWidget {
  const NetworkTreeScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Team (Downline)'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '10 Level Team Structure',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: ListView.builder(
                itemCount: 10,
                itemBuilder: (context, index) {
                  return _buildLevelCard(
                    level: index + 1,
                    membersCount: (index == 0) ? 3 : (index * 12 + 5), // Mock data
                    activeMembers: (index == 0) ? 3 : (index * 8 + 2), // Mock data
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLevelCard({required int level, required int membersCount, required int activeMembers}) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: Colors.indigo.shade100,
          child: Text('L$level', style: const TextStyle(color: Colors.indigo, fontWeight: FontWeight.bold)),
        ),
        title: Text('Level $level', style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text('Total: $membersCount | Active: $activeMembers'),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
        onTap: () {
          // Future: Navigate to detail view for this level
        },
      ),
    );
  }
}
