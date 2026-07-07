import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/models/support_material_model.dart';
import '../../../../core/services/remote_support_materials_service.dart';
import '../../../../core/theme/smt_theme.dart';
import '../screens/pdf_viewer_screen.dart';
import '../screens/image_viewer_screen.dart';
import '../screens/video_viewer_screen.dart';

class SupportMaterialsScreen extends ConsumerStatefulWidget {
  const SupportMaterialsScreen({Key? key}) : super(key: key);
  
  @override
  ConsumerState<SupportMaterialsScreen> createState() => _SupportMaterialsScreenState();
}

class _SupportMaterialsScreenState extends ConsumerState<SupportMaterialsScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  bool _isLoading = false;
  List<SupportMaterial> _materials = [];
  List<SupportMaterial> _filteredMaterials = [];
  
  // Track expanded machines
  Set<String> _expandedMachines = {};
  
  @override
  void initState() {
    super.initState();
    _loadMaterials();
  }
  
  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
  
  Future<void> _loadMaterials() async {
    setState(() => _isLoading = true);
    
    try {
      final supportService = ref.read(remoteSupportMaterialsServiceProvider);
      final materials = await supportService.getAllMaterials();
      
      setState(() {
        _materials = materials;
        _filteredMaterials = materials;
        _isLoading = false;
        // Expand first machine by default
        final machines = _getUniqueMachines(materials);
        if (machines.isNotEmpty) {
          _expandedMachines.add(machines.first);
        }
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading materials: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }
  
  void _filterMaterials() {
    setState(() {
      if (_searchQuery.isEmpty) {
        _filteredMaterials = _materials;
      } else {
        _filteredMaterials = _materials.where((material) {
          return material.matchesQuery(_searchQuery);
        }).toList();
        
        // Sort by relevance
        _filteredMaterials.sort((a, b) => 
          b.getRelevanceScore(_searchQuery).compareTo(a.getRelevanceScore(_searchQuery)));
      }
    });
  }

  List<String> _getUniqueMachines(List<SupportMaterial> materials) {
    final machines = <String>{};
    for (final m in materials) {
      machines.add(m.machineModel ?? 'General');
    }
    // Sort with "General" last
    final sorted = machines.toList()..sort((a, b) {
      if (a == 'General') return 1;
      if (b == 'General') return -1;
      return a.compareTo(b);
    });
    return sorted;
  }

  Map<String, List<SupportMaterial>> _groupByMachine() {
    final grouped = <String, List<SupportMaterial>>{};
    for (final material in _filteredMaterials) {
      final machine = material.machineModel ?? 'General';
      grouped.putIfAbsent(machine, () => []).add(material);
    }
    return grouped;
  }

  Map<String, List<SupportMaterial>> _groupByCategory(List<SupportMaterial> materials) {
    final grouped = <String, List<SupportMaterial>>{};
    for (final material in materials) {
      grouped.putIfAbsent(material.category, () => []).add(material);
    }
    return grouped;
  }
  
  @override
  Widget build(BuildContext context) {
    final groupedByMachine = _groupByMachine();
    final machines = _getUniqueMachines(_filteredMaterials);
    
    return Scaffold(
      backgroundColor: const Color(0xFFF5F5F5),
      body: CustomScrollView(
        slivers: [
          // Compact App Bar
          SliverAppBar(
            expandedHeight: 100,
            floating: true,
            pinned: true,
            backgroundColor: SMTTheme.primaryRed,
            flexibleSpace: FlexibleSpaceBar(
              title: const Text(
                'Support Library',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
              ),
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFFB71C1C), Color(0xFFE53935)],
                  ),
                ),
              ),
            ),
            actions: [
              Center(
                child: Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: Text(
                    '${_materials.length} docs',
                    style: const TextStyle(fontSize: 12, color: Colors.white70),
                  ),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.chat),
                onPressed: () => context.go('/chat'),
                tooltip: 'AI Support',
              ),
            ],
          ),
          
          // Search Bar
          SliverToBoxAdapter(
            child: Container(
              padding: const EdgeInsets.all(12),
              child: TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: 'Search by title, machine, or content...',
                  prefixIcon: const Icon(Icons.search, size: 20),
                  suffixIcon: _searchQuery.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear, size: 20),
                          onPressed: () {
                            _searchController.clear();
                            setState(() => _searchQuery = '');
                            _filterMaterials();
                          },
                        )
                      : null,
                  filled: true,
                  fillColor: Colors.white,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  isDense: true,
                ),
                style: const TextStyle(fontSize: 14),
                onChanged: (query) {
                  setState(() => _searchQuery = query);
                  _filterMaterials();
                },
              ),
            ),
          ),
          
          // Content
          if (_isLoading)
            const SliverFillRemaining(
              child: Center(child: CircularProgressIndicator()),
            )
          else if (_filteredMaterials.isEmpty)
            SliverFillRemaining(child: _buildEmptyState())
          else if (_searchQuery.isNotEmpty)
            // Flat search results
            _buildSearchResults()
          else
            // Grouped by machine with expandable sections
            SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  if (index >= machines.length) return null;
                  final machine = machines[index];
                  final materialsForMachine = groupedByMachine[machine] ?? [];
                  return _buildMachineSection(machine, materialsForMachine);
                },
                childCount: machines.length,
              ),
            ),
          
          // Bottom padding
          const SliverToBoxAdapter(child: SizedBox(height: 80)),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.go('/chat'),
        backgroundColor: SMTTheme.primaryRed,
        child: const Icon(Icons.smart_toy),
        tooltip: 'Ask AI',
      ),
    );
  }

  Widget _buildMachineSection(String machine, List<SupportMaterial> materials) {
    final isExpanded = _expandedMachines.contains(machine);
    final groupedByCategory = _groupByCategory(materials);
    final categories = groupedByCategory.keys.toList()..sort();
    
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          // Machine Header (always visible)
          InkWell(
            onTap: () {
              setState(() {
                if (isExpanded) {
                  _expandedMachines.remove(machine);
                } else {
                  _expandedMachines.add(machine);
                }
              });
            },
            borderRadius: BorderRadius.circular(12),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: machine == 'General' 
                          ? Colors.grey.withOpacity(0.1)
                          : SMTTheme.primaryRed.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(
                      machine == 'General' ? Icons.folder : Icons.precision_manufacturing,
                      color: machine == 'General' ? Colors.grey[600] : SMTTheme.primaryRed,
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          machine,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                          ),
                        ),
                        Text(
                          '${materials.length} items',
                          style: TextStyle(
                            color: Colors.grey[600],
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  AnimatedRotation(
                    turns: isExpanded ? 0.5 : 0,
                    duration: const Duration(milliseconds: 200),
                    child: Icon(
                      Icons.keyboard_arrow_down,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          // Expanded Content
          AnimatedCrossFade(
            firstChild: const SizedBox.shrink(),
            secondChild: Column(
              children: [
                const Divider(height: 1),
                ...categories.map((category) {
                  final categoryMaterials = groupedByCategory[category]!;
                  return _buildCategorySubsection(category, categoryMaterials);
                }).toList(),
              ],
            ),
            crossFadeState: isExpanded 
                ? CrossFadeState.showSecond 
                : CrossFadeState.showFirst,
            duration: const Duration(milliseconds: 200),
          ),
        ],
      ),
    );
  }

  Widget _buildCategorySubsection(String category, List<SupportMaterial> materials) {
    final color = _getCategoryColor(category);
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Category header
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: Row(
            children: [
              Icon(_getCategoryIcon(category), size: 16, color: color),
              const SizedBox(width: 8),
              Text(
                _formatCategoryName(category),
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                  color: color,
                ),
              ),
              const SizedBox(width: 6),
              Text(
                '(${materials.length})',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[500],
                ),
              ),
            ],
          ),
        ),
        // Material items
        ...materials.map((material) => _buildCompactMaterialItem(material, color)).toList(),
        const SizedBox(height: 8),
      ],
    );
  }

  Widget _buildCompactMaterialItem(SupportMaterial material, Color color) {
    return InkWell(
      onTap: () => _openMaterial(material),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        child: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Icon(
                _getFileTypeIcon(material.fileType),
                color: color,
                size: 16,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                material.title,
                style: const TextStyle(fontSize: 13),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                material.fileType.toUpperCase(),
                style: TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey[600],
                ),
              ),
            ),
            const SizedBox(width: 4),
            Icon(Icons.chevron_right, size: 18, color: Colors.grey[400]),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchResults() {
    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      sliver: SliverList(
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            final material = _filteredMaterials[index];
            final color = _getCategoryColor(material.category);
            
            return Container(
              margin: const EdgeInsets.only(bottom: 6),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.03),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: InkWell(
                onTap: () => _openMaterial(material),
                borderRadius: BorderRadius.circular(10),
                child: Padding(
                  padding: const EdgeInsets.all(10),
                  child: Row(
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: color.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(
                          _getFileTypeIcon(material.fileType),
                          color: color,
                          size: 18,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              material.title,
                              style: const TextStyle(
                                fontWeight: FontWeight.w500,
                                fontSize: 13,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                                  decoration: BoxDecoration(
                                    color: color.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(3),
                                  ),
                                  child: Text(
                                    _formatCategoryName(material.category),
                                    style: TextStyle(
                                      fontSize: 10,
                                      color: color,
                                    ),
                                  ),
                                ),
                                if (material.machineModel != null) ...[
                                  const SizedBox(width: 6),
                                  Expanded(
                                    child: Text(
                                      material.machineModel!,
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: Colors.grey[600],
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ],
                        ),
                      ),
                      Icon(Icons.chevron_right, size: 18, color: Colors.grey[400]),
                    ],
                  ),
                ),
              ),
            );
          },
          childCount: _filteredMaterials.length,
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.search_off, size: 48, color: Colors.grey[300]),
          const SizedBox(height: 12),
          Text(
            _searchQuery.isEmpty 
                ? 'No materials available'
                : 'No results for "$_searchQuery"',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 6),
          Text(
            'Try a different search term',
            style: TextStyle(color: Colors.grey[500], fontSize: 13),
          ),
        ],
      ),
    );
  }

  void _openMaterial(SupportMaterial material) {
    switch (material.fileType.toLowerCase()) {
      case 'pdf':
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => PdfViewerScreen(
              url: material.fileUrl,
              title: material.title,
            ),
          ),
        );
        break;
      case 'mp4':
      case 'video':
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => VideoViewerScreen(
              url: material.fileUrl,
              title: material.title,
            ),
          ),
        );
        break;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'image':
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ImageViewerScreen(
              url: material.fileUrl,
              title: material.title,
            ),
          ),
        );
        break;
      default:
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Cannot open ${material.fileType} files')),
        );
    }
  }

  String _formatCategoryName(String name) {
    return name[0].toUpperCase() + name.substring(1);
  }

  Color _getCategoryColor(String category) {
    switch (category.toLowerCase()) {
      case 'manuals': return Colors.blue;
      case 'troubleshooting': return Colors.orange;
      case 'schematics': return Colors.purple;
      case 'contracts': return Colors.green;
      case 'videos': return Colors.red;
      default: return Colors.grey;
    }
  }

  IconData _getCategoryIcon(String category) {
    switch (category.toLowerCase()) {
      case 'manuals': return Icons.menu_book;
      case 'troubleshooting': return Icons.build;
      case 'schematics': return Icons.architecture;
      case 'contracts': return Icons.description;
      case 'videos': return Icons.play_circle;
      default: return Icons.folder;
    }
  }

  IconData _getFileTypeIcon(String fileType) {
    switch (fileType.toLowerCase()) {
      case 'pdf': return Icons.picture_as_pdf;
      case 'mp4':
      case 'video': return Icons.play_circle;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'image': return Icons.image;
      case 'docx':
      case 'document': return Icons.description;
      default: return Icons.insert_drive_file;
    }
  }
}
