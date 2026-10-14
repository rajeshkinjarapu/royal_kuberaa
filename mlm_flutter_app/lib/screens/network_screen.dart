import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../providers/network_provider.dart';
import '../utils/constants.dart';

class NetworkScreen extends StatelessWidget {
  const NetworkScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Column(
        children: [
          Container(
            color: Colors.white,
            child: const TabBar(
              labelColor: AppColors.primary,
              unselectedLabelColor: AppColors.textSecondary,
              indicatorColor: AppColors.primary,
              indicatorWeight: 3,
              tabs: [
                Tab(text: 'Directs'),
                Tab(text: 'Team Tree'),
                Tab(text: 'Rebirths'),
              ],
            ),
          ),
          const Expanded(
            child: TabBarView(
              children: [
                _DirectsView(),
                _TreeView(),
                _RebirthsView(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _DirectsView extends StatefulWidget {
  const _DirectsView();
  @override
  State<_DirectsView> createState() => _DirectsViewState();
}

class _DirectsViewState extends State<_DirectsView> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NetworkProvider>().fetchDirects();
    });
  }

  @override
  Widget build(BuildContext context) {
    final networkProvider = context.watch<NetworkProvider>();
    return RefreshIndicator(
      onRefresh: () => context.read<NetworkProvider>().fetchDirects(),
      color: AppColors.primary,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('My Direct Network', style: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
            const SizedBox(height: 20),
            if (networkProvider.isLoading && networkProvider.directs.isEmpty)
              const Expanded(child: Center(child: CircularProgressIndicator(color: AppColors.primary)))
            else if (networkProvider.errorMessage.isNotEmpty)
              Expanded(child: Center(child: Text(networkProvider.errorMessage, style: const TextStyle(color: AppColors.error))))
            else if (networkProvider.directs.isEmpty)
              const Expanded(child: Center(child: Text('No Direct Members Yet', style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.bold))))
            else
              Expanded(
                child: ListView.builder(
                  itemCount: networkProvider.directs.length,
                  itemBuilder: (context, index) {
                    final member = networkProvider.directs[index];
                    final isActive = member['status'] == 'Active';
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 24,
                            backgroundColor: isActive ? AppColors.secondary.withOpacity(0.1) : Colors.grey.shade100,
                            child: Text((member['name'] ?? 'M')[0].toUpperCase(), style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: isActive ? AppColors.secondary : Colors.grey.shade500)),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(member['name'] ?? 'Unknown Member', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary), maxLines: 1, overflow: TextOverflow.ellipsis),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    Text(member['id'] ?? 'N/A', style: const TextStyle(fontSize: 13, color: AppColors.primary, fontWeight: FontWeight.w600)),
                                    const SizedBox(width: 8),
                                    Text(member['status'] ?? '', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: isActive ? AppColors.secondary : Colors.red)),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(member['rank'] ?? 'USER', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
                              const SizedBox(height: 4),
                              Text(member['joinDate'] ?? '', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _TreeView extends StatefulWidget {
  const _TreeView();
  @override
  State<_TreeView> createState() => _TreeViewState();
}

class _TreeViewState extends State<_TreeView> {
  final _searchController = TextEditingController();
  final List<String> _history = [];

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
    setState(() => _history.add(memberId));
    context.read<NetworkProvider>().fetchTree(memberId);
  }

  void _navigateBack() {
    if (_history.isNotEmpty) {
      setState(() => _history.removeLast());
      final target = _history.isNotEmpty ? _history.last : null;
      context.read<NetworkProvider>().fetchTree(target);
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<NetworkProvider>();
    final tree = provider.treeData;

    return Column(
      children: [
        // Search & Filter Bar
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _searchController,
                  textCapitalization: TextCapitalization.characters,
                  decoration: InputDecoration(
                    hintText: 'Search Downline ID (e.g. RK0305)',
                    prefixIcon: const Icon(Icons.search, size: 20),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    filled: true,
                    fillColor: Colors.white,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: () {
                  final query = _searchController.text.trim();
                  if (query.isNotEmpty) {
                    _navigateToMember(query.toUpperCase());
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                ),
                child: const Text('Search'),
              ),
              if (_searchController.text.trim().isNotEmpty)
                IconButton(
                  icon: const Icon(Icons.clear),
                  onPressed: () {
                    _searchController.clear();
                    setState(() => _history.clear());
                    provider.fetchTree();
                  },
                )
            ],
          ),
        ),

        // Navigation Breadcrumb / History
        if (_history.isNotEmpty)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            color: Colors.white,
            child: Row(
              children: [
                InkWell(
                  onTap: () {
                    setState(() => _history.clear());
                    provider.fetchTree();
                  },
                  child: const Row(
                    children: [
                      Icon(Icons.home_outlined, size: 16, color: AppColors.primary),
                      SizedBox(width: 4),
                      Text('My Root', style: TextStyle(color: AppColors.primary, fontSize: 12, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
                const Text(' > ', style: TextStyle(color: Colors.grey)),
                Expanded(
                  child: Text(
                    _history.last,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: AppColors.textPrimary),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                TextButton.icon(
                  onPressed: _navigateBack,
                  icon: const Icon(Icons.arrow_upward, size: 14),
                  label: const Text('Back Up', style: TextStyle(fontSize: 11)),
                ),
              ],
            ),
          ),

        if (provider.isLoading)
          const Expanded(child: Center(child: CircularProgressIndicator(color: AppColors.primary)))
        else if (provider.errorMessage.isNotEmpty)
          Expanded(child: Center(child: Text(provider.errorMessage, style: const TextStyle(color: AppColors.error))))
        else if (tree == null)
          const Expanded(child: Center(child: Text('No Tree Data Available')))
        else
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Root Node Card
                  _buildRootCard(tree),
                  const SizedBox(height: 20),

                  // Direct Downline List Section
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Direct Downline (${(tree['children'] as List?)?.length ?? 0})',
                        style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.textPrimary),
                      ),
                      const Text(
                        'Tap member to view their team',
                        style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  Builder(
                    builder: (context) {
                      final children = (tree['children'] as List? ?? []);
                      if (children.isEmpty) {
                        return Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(28),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: const Center(
                            child: Column(
                              children: [
                                Icon(Icons.group_outlined, size: 40, color: Colors.grey),
                                SizedBox(height: 8),
                                Text(
                                  'No downline members registered under this node yet.',
                                  style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                                  textAlign: TextAlign.center,
                                ),
                              ],
                            ),
                          ),
                        );
                      }

                      return ListView.separated(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: children.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (context, index) {
                          final child = children[index];
                          return _buildChildCard(child);
                        },
                      );
                    },
                  ),
                ],
              ),
            ),
          )
      ],
    );
  }

  Widget _buildRootCard(Map<String, dynamic> node) {
    final isActive = node['isActive'] == true;
    final directs = node['totalDirects'] ?? 0;
    final activeDirects = node['activeDirects'] ?? 0;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.darkNavy, Color(0xFF1E293B)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: AppColors.darkNavy.withOpacity(0.2), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 24,
                backgroundColor: isActive ? AppColors.secondary : Colors.grey,
                child: Text(
                  (node['name'] ?? 'M')[0].toUpperCase(),
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 20),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      node['name'] ?? 'Member',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 17),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'ID: ${node['id'] ?? node['memberId'] ?? ''}',
                      style: const TextStyle(color: Color(0xFFD4AF37), fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: isActive ? Colors.green.withOpacity(0.25) : Colors.red.withOpacity(0.25),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: isActive ? Colors.greenAccent : Colors.redAccent),
                ),
                child: Text(
                  isActive ? 'ACTIVE' : 'INACTIVE',
                  style: TextStyle(
                    color: isActive ? Colors.greenAccent : Colors.redAccent,
                    fontWeight: FontWeight.bold,
                    fontSize: 11,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Divider(color: Colors.white12),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildStatCol('Rank', node['rank'] ?? 'STARTER', const Color(0xFF38BDF8)),
              _buildStatCol('Direct Team', '$directs Members', Colors.white),
              _buildStatCol('Active Directs', '$activeDirects Members', AppColors.secondary),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatCol(String label, String value, Color valueColor) {
    return Column(
      children: [
        Text(label, style: const TextStyle(color: Colors.white60, fontSize: 11)),
        const SizedBox(height: 2),
        Text(value, style: TextStyle(color: valueColor, fontWeight: FontWeight.bold, fontSize: 13)),
      ],
    );
  }

  Widget _buildChildCard(Map<String, dynamic> child) {
    final isActive = child['isActive'] == true;
    final childId = child['id'] ?? child['memberId'] ?? '';
    final subChildren = child['children'] as List? ?? [];
    final directsCount = child['totalDirects'] ?? subChildren.length;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 6, offset: const Offset(0, 2)),
        ],
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        leading: CircleAvatar(
          radius: 20,
          backgroundColor: isActive ? AppColors.secondary.withOpacity(0.12) : Colors.grey.shade100,
          child: Text(
            (child['name'] ?? 'M')[0].toUpperCase(),
            style: TextStyle(fontWeight: FontWeight.bold, color: isActive ? AppColors.secondary : Colors.grey),
          ),
        ),
        title: Text(
          child['name'] ?? '',
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
        ),
        subtitle: Row(
          children: [
            Text(childId, style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 12)),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: isActive ? Colors.green.shade50 : Colors.red.shade50,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                isActive ? 'Active' : 'Unactivated',
                style: TextStyle(fontSize: 10, color: isActive ? Colors.green.shade700 : Colors.red.shade700, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
        trailing: InkWell(
          onTap: () => _navigateToMember(childId),
          borderRadius: BorderRadius.circular(8),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.08),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '$directsCount Directs',
                  style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 11),
                ),
                const SizedBox(width: 4),
                const Icon(Icons.chevron_right, size: 16, color: AppColors.primary),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _RebirthsView extends StatefulWidget {
  const _RebirthsView();
  @override
  State<_RebirthsView> createState() => _RebirthsViewState();
}

class _RebirthsViewState extends State<_RebirthsView> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NetworkProvider>().fetchRebirths();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<NetworkProvider>();
    return RefreshIndicator(
      onRefresh: () => context.read<NetworkProvider>().fetchRebirths(),
      color: AppColors.primary,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('My Rebirth IDs', style: GoogleFonts.inter(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
            const SizedBox(height: 20),
            if (provider.isLoading && provider.rebirths.isEmpty)
              const Expanded(child: Center(child: CircularProgressIndicator(color: AppColors.primary)))
            else if (provider.errorMessage.isNotEmpty)
              Expanded(child: Center(child: Text(provider.errorMessage, style: const TextStyle(color: AppColors.error))))
            else if (provider.rebirths.isEmpty)
              const Expanded(child: Center(child: Text('No Rebirth IDs Yet', style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.bold))))
            else
              Expanded(
                child: ListView.builder(
                  itemCount: provider.rebirths.length,
                  itemBuilder: (context, index) {
                    final member = provider.rebirths[index];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(member['memberId'] ?? member['id'] ?? 'N/A', style: const TextStyle(fontSize: 16, color: AppColors.primary, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 4),
                              Text('Created: ${member['createdDate'] ?? member['createdAt'] ?? 'Recently'}', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(color: AppColors.secondary.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
                            child: const Text('Active Node', style: TextStyle(color: AppColors.secondary, fontWeight: FontWeight.bold, fontSize: 12)),
                          )
                        ],
                      ),
                    );
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }
}
