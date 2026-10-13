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

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NetworkProvider>().fetchTree();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<NetworkProvider>();
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _searchController,
                  textCapitalization: TextCapitalization.characters,
                  decoration: const InputDecoration(
                    hintText: 'Search Downline ID',
                    prefixIcon: Icon(Icons.search),
                    border: OutlineInputBorder(),
                    contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: () {
                  if (_searchController.text.trim().isNotEmpty) {
                    provider.fetchTree(_searchController.text.trim().toUpperCase());
                  }
                },
                child: const Text('Search'),
              ),
              if (_searchController.text.trim().isNotEmpty)
                IconButton(
                  icon: const Icon(Icons.clear),
                  onPressed: () {
                    _searchController.clear();
                    provider.fetchTree();
                  },
                )
            ],
          ),
        ),
        if (provider.isLoading)
          const Expanded(child: Center(child: CircularProgressIndicator(color: AppColors.primary)))
        else if (provider.errorMessage.isNotEmpty)
          Expanded(child: Center(child: Text(provider.errorMessage, style: const TextStyle(color: AppColors.error))))
        else if (provider.treeData == null)
          const Expanded(child: Center(child: Text('No Tree Data Available')))
        else
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: _buildTreeNode(provider.treeData!),
            ),
          )
      ],
    );
  }

  Widget _buildTreeNode(Map<String, dynamic> node) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: (node['isActive'] == true) ? AppColors.secondary.withOpacity(0.1) : Colors.red.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: (node['isActive'] == true) ? AppColors.secondary : Colors.red),
          ),
          child: Column(
            children: [
              Text(node['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              Text(node['id'] ?? '', style: const TextStyle(color: AppColors.primary, fontSize: 12, fontWeight: FontWeight.bold)),
              Text('L: ${node['leftTeamCount'] ?? 0} | R: ${node['rightTeamCount'] ?? 0}', style: const TextStyle(fontSize: 10, color: Colors.grey)),
            ],
          ),
        ),
        if (node['left'] != null || node['right'] != null) ...[
          Container(width: 2, height: 20, color: AppColors.border),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  children: [
                    Container(height: 2, color: AppColors.border),
                    const SizedBox(height: 8),
                    if (node['left'] != null) _buildTreeNode(node['left']) else const Text('Empty', style: TextStyle(color: Colors.grey, fontSize: 12))
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  children: [
                    Container(height: 2, color: AppColors.border),
                    const SizedBox(height: 8),
                    if (node['right'] != null) _buildTreeNode(node['right']) else const Text('Empty', style: TextStyle(color: Colors.grey, fontSize: 12))
                  ],
                ),
              ),
            ],
          )
        ]
      ],
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
