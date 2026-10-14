import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/network_provider.dart';
import '../providers/auth_provider.dart';
import '../utils/constants.dart';

class TeamNetworkScreen extends StatefulWidget {
  const TeamNetworkScreen({super.key});

  @override
  State<TeamNetworkScreen> createState() => _TeamNetworkScreenState();
}

class _TeamNetworkScreenState extends State<TeamNetworkScreen> {
  final List<String> _historyStack = [];
  String _searchQuery = '';
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NetworkProvider>().fetchTree();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _navigateToMember(String memberId) {
    setState(() => _historyStack.add(memberId));
    context.read<NetworkProvider>().fetchTree(memberId);
  }

  void _navigateBack() {
    if (_historyStack.isNotEmpty) {
      setState(() => _historyStack.removeLast());
      final target = _historyStack.isNotEmpty ? _historyStack.last : null;
      context.read<NetworkProvider>().fetchTree(target);
    }
  }

  @override
  Widget build(BuildContext context) {
    final netProvider = context.watch<NetworkProvider>();
    final tree = netProvider.treeData;
    final currentUser = context.watch<AuthProvider>().user;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('Team Network', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white)),
        backgroundColor: AppColors.darkNavy,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              final target = _historyStack.isNotEmpty ? _historyStack.last : null;
              context.read<NetworkProvider>().fetchTree(target);
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          final target = _historyStack.isNotEmpty ? _historyStack.last : null;
          await context.read<NetworkProvider>().fetchTree(target);
        },
        color: AppColors.primary,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16.0, 16.0, 16.0, 40.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Search & Filter
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: TextField(
                  controller: _searchController,
                  onChanged: (val) => setState(() => _searchQuery = val.trim().toLowerCase()),
                  decoration: InputDecoration(
                    hintText: 'Search by Member ID or Name...',
                    prefixIcon: const Icon(Icons.search, color: AppColors.textSecondary),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, size: 18),
                            onPressed: () {
                              _searchController.clear();
                              setState(() => _searchQuery = '');
                            },
                          )
                        : null,
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  ),
                ),
              ),

              const SizedBox(height: 14),

              // Breadcrumb Navigation
              if (_historyStack.isNotEmpty) ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Row(
                    children: [
                      InkWell(
                        onTap: () {
                          setState(() => _historyStack.clear());
                          context.read<NetworkProvider>().fetchTree();
                        },
                        child: Text(
                          currentUser?['memberId'] ?? 'Root',
                          style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 12),
                        ),
                      ),
                      for (int i = 0; i < _historyStack.length; i++) ...[
                        const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 4),
                          child: Icon(Icons.chevron_right, size: 16, color: Colors.grey),
                        ),
                        InkWell(
                          onTap: i < _historyStack.length - 1
                              ? () {
                                  final target = _historyStack[i];
                                  setState(() => _historyStack.removeRange(i + 1, _historyStack.length));
                                  context.read<NetworkProvider>().fetchTree(target);
                                }
                              : null,
                          child: Text(
                            _historyStack[i],
                            style: TextStyle(
                              color: i == _historyStack.length - 1 ? AppColors.textPrimary : AppColors.primary,
                              fontWeight: i == _historyStack.length - 1 ? FontWeight.bold : FontWeight.w500,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ],
                      const Spacer(),
                      InkWell(
                        onTap: _navigateBack,
                        child: const Row(
                          children: [
                            Icon(Icons.arrow_upward, size: 14, color: Colors.grey),
                            SizedBox(width: 2),
                            Text('Back Up', style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
              ],

              if (netProvider.isLoading)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(50.0),
                    child: CircularProgressIndicator(color: AppColors.primary),
                  ),
                )
              else if (tree == null)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(32),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    children: [
                      Icon(Icons.account_tree_outlined, size: 48, color: Colors.grey.shade400),
                      const SizedBox(height: 12),
                      const Text('No Network Data Found', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 6),
                      Text(netProvider.errorMessage.isNotEmpty ? netProvider.errorMessage : 'Your team genealogy will appear here as members join.',
                          textAlign: TextAlign.center, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                    ],
                  ),
                )
              else ...[
                // Root Card
                _buildMemberCard(tree, isRoot: true),

                const SizedBox(height: 20),

                // Downline Members Section
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Direct Downline (${(tree['children'] as List?)?.length ?? 0})',
                      style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                    ),
                    const Text('Tap node to expand', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                  ],
                ),
                const SizedBox(height: 12),

                // Children List
                Builder(
                  builder: (context) {
                    final children = (tree['children'] as List? ?? []).where((child) {
                      if (_searchQuery.isEmpty) return true;
                      final id = (child['memberId'] ?? '').toString().toLowerCase();
                      final name = (child['name'] ?? '').toString().toLowerCase();
                      return id.contains(_searchQuery) || name.contains(_searchQuery);
                    }).toList();

                    if (children.isEmpty) {
                      return Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Center(
                          child: Text(
                            _searchQuery.isNotEmpty ? 'No members match "$_searchQuery"' : 'No downline members under this node yet.',
                            style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                          ),
                        ),
                      );
                    }

                    return ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: children.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (context, idx) {
                        return _buildMemberCard(children[idx], isRoot: false);
                      },
                    );
                  },
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMemberCard(Map<String, dynamic> data, {required bool isRoot}) {
    final memberId = data['memberId'] ?? 'N/A';
    final name = data['name'] ?? 'Member';
    final isActive = data['isActive'] == true || data['status'] == 'Active';
    final childrenCount = (data['children'] as List?)?.length ?? 0;
    final totalTeam = data['totalTeam'] ?? data['teamCount'] ?? childrenCount;

    return InkWell(
      onTap: isRoot ? null : () => _navigateToMember(memberId),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isRoot ? AppColors.primary.withOpacity(0.04) : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isRoot ? AppColors.primary.withOpacity(0.3) : AppColors.border, width: isRoot ? 1.5 : 1),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 8, offset: const Offset(0, 2)),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isRoot ? AppColors.primary : (isActive ? Colors.teal.shade50 : Colors.grey.shade100),
                shape: BoxShape.circle,
              ),
              child: Icon(
                isRoot ? Icons.star : Icons.person,
                color: isRoot ? Colors.white : (isActive ? Colors.teal : Colors.grey),
                size: 20,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        memberId,
                        style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.textPrimary),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: isActive ? Colors.green.withOpacity(0.1) : Colors.red.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          isActive ? 'ACTIVE' : 'INACTIVE',
                          style: TextStyle(color: isActive ? Colors.green : Colors.red, fontSize: 9, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 3),
                  Text(name, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.people_outline, size: 14, color: AppColors.textSecondary),
                    const SizedBox(width: 4),
                    Text('$totalTeam', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.textPrimary)),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  isRoot ? 'Focus Node' : 'Explore >',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: isRoot ? AppColors.primary : Colors.grey,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
