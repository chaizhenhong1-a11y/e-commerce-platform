import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/staff_category.dart';
import 'staff_providers.dart';
import 'staff_ui_theme.dart';

class StaffCategoriesPage extends ConsumerWidget {
  const StaffCategoriesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final categories = ref.watch(staffCategoriesProvider);
    return StaffUiTheme(
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Categories'),
          actions: <Widget>[
            IconButton(
              tooltip: 'Refresh',
              onPressed: () => ref.invalidate(staffCategoriesProvider),
              icon: const Icon(Icons.refresh_rounded),
            ),
          ],
        ),
        floatingActionButton: FloatingActionButton.extended(
          onPressed: () => _openEditor(context, ref),
          backgroundColor: StaffUiTheme.brand,
          foregroundColor: Colors.white,
          icon: const Icon(Icons.add_rounded),
          label: const Text('New category'),
        ),
        body: RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(staffCategoriesProvider);
            await ref.read(staffCategoriesProvider.future);
          },
          child: categories.when(
            loading: () => const _ScrollableState(
              child: CircularProgressIndicator(),
            ),
            error: (error, _) => _ScrollableState(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: <Widget>[
                  const Icon(Icons.error_outline_rounded, size: 36),
                  const SizedBox(height: 12),
                  const Text('Could not load categories.'),
                  const SizedBox(height: 12),
                  OutlinedButton(
                    onPressed: () => ref.invalidate(staffCategoriesProvider),
                    child: const Text('Try again'),
                  ),
                ],
              ),
            ),
            data: (items) => items.isEmpty
                ? const _ScrollableState(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: <Widget>[
                        Icon(Icons.category_outlined, size: 42),
                        SizedBox(height: 12),
                        Text('No categories yet.'),
                      ],
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 104),
                    itemCount: items.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, index) =>
                        _CategoryCard(category: items[index]),
                  ),
          ),
        ),
      ),
    );
  }

  Future<void> _openEditor(
    BuildContext context,
    WidgetRef ref, {
    StaffCategory? category,
  }) async {
    final changed = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => _CategoryEditor(category: category),
    );
    if (changed == true) ref.invalidate(staffCategoriesProvider);
  }
}

class _CategoryCard extends ConsumerWidget {
  const _CategoryCard({required this.category});
  final StaffCategory category;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: StaffUiTheme.border),
      ),
      child: Row(
        children: <Widget>[
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color:
                  category.isActive ? StaffUiTheme.accent : StaffUiTheme.canvas,
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(Icons.category_outlined),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                Row(
                  children: <Widget>[
                    Expanded(
                      child: Text(
                        category.name,
                        style: const TextStyle(fontWeight: FontWeight.w900),
                      ),
                    ),
                    _StatusPill(active: category.isActive),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  category.slug,
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '${category.productCount} products  •  Sort ${category.sortOrder}',
                  style: const TextStyle(
                      fontSize: 12, fontWeight: FontWeight.w700),
                ),
              ],
            ),
          ),
          PopupMenuButton<String>(
            onSelected: (value) async {
              if (value == 'edit') {
                await const StaffCategoriesPage()._openEditor(
                  context,
                  ref,
                  category: category,
                );
              } else if (value == 'delete') {
                await _delete(context, ref);
              }
            },
            itemBuilder: (_) => <PopupMenuEntry<String>>[
              const PopupMenuItem(value: 'edit', child: Text('Edit')),
              PopupMenuItem(
                value: 'delete',
                enabled: category.productCount == 0,
                child: Text(
                  category.productCount == 0
                      ? 'Delete'
                      : 'Delete (category has products)',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _delete(BuildContext context, WidgetRef ref) async {
    if (category.productCount > 0) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete category?'),
        content: Text('Delete “${category.name}”? This cannot be undone.'),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;
    try {
      await ref.read(staffRepositoryProvider).deleteCategory(category.id);
      ref.invalidate(staffCategoriesProvider);
    } catch (error) {
      if (context.mounted) _showError(context, error);
    }
  }
}

class _CategoryEditor extends ConsumerStatefulWidget {
  const _CategoryEditor({this.category});
  final StaffCategory? category;

  @override
  ConsumerState<_CategoryEditor> createState() => _CategoryEditorState();
}

class _CategoryEditorState extends ConsumerState<_CategoryEditor> {
  late final TextEditingController _name;
  late final TextEditingController _slug;
  late final TextEditingController _sortOrder;
  late bool _isActive;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final category = widget.category;
    _name = TextEditingController(text: category?.name ?? '');
    _slug = TextEditingController(text: category?.slug ?? '');
    _sortOrder = TextEditingController(text: '${category?.sortOrder ?? 0}');
    _isActive = category?.isActive ?? true;
  }

  @override
  void dispose() {
    _name.dispose();
    _slug.dispose();
    _sortOrder.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final editing = widget.category != null;
    return StaffUiTheme(
      child: Padding(
        padding: EdgeInsets.fromLTRB(
          20,
          20,
          20,
          20 + MediaQuery.viewInsetsOf(context).bottom,
        ),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              Text(
                editing ? 'Edit category' : 'New category',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w900,
                    ),
              ),
              const SizedBox(height: 20),
              TextField(
                controller: _name,
                autofocus: !editing,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(labelText: 'Name'),
                onChanged: (value) {
                  if (!editing && _slug.text.trim().isEmpty) {
                    _slug.text = _slugify(value);
                  }
                },
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _slug,
                decoration: const InputDecoration(labelText: 'Slug'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _sortOrder,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Sort order'),
              ),
              const SizedBox(height: 8),
              SwitchListTile.adaptive(
                contentPadding: EdgeInsets.zero,
                title: const Text('Active'),
                subtitle: const Text(
                    'Active categories can be used by the storefront.'),
                value: _isActive,
                onChanged: _saving
                    ? null
                    : (value) => setState(() => _isActive = value),
              ),
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: _saving ? null : _save,
                icon: _saving
                    ? const SizedBox.square(
                        dimension: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.save_outlined),
                label: Text(_saving ? 'Saving…' : 'Save category'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _save() async {
    final name = _name.text.trim();
    final slug = _slug.text.trim();
    final sortOrder = int.tryParse(_sortOrder.text.trim());
    if (name.isEmpty || slug.isEmpty || sortOrder == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Enter a name, slug and valid sort order.')),
      );
      return;
    }
    setState(() => _saving = true);
    try {
      final repository = ref.read(staffRepositoryProvider);
      final category = widget.category;
      if (category == null) {
        await repository.createCategory(
          name: name,
          slug: slug,
          isActive: _isActive,
          sortOrder: sortOrder,
        );
      } else {
        await repository.updateCategory(
          categoryId: category.id,
          name: name,
          slug: slug,
          isActive: _isActive,
          sortOrder: sortOrder,
        );
      }
      if (mounted) Navigator.pop(context, true);
    } catch (error) {
      if (mounted) {
        setState(() => _saving = false);
        _showError(context, error);
      }
    }
  }

  static String _slugify(String value) => value
      .trim()
      .toLowerCase()
      .replaceAll(RegExp(r'[^a-z0-9]+'), '-')
      .replaceAll(RegExp(r'^-+|-+$'), '');
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.active});
  final bool active;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: active ? StaffUiTheme.accent : StaffUiTheme.canvas,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: StaffUiTheme.border),
      ),
      child: Text(
        active ? 'ACTIVE' : 'INACTIVE',
        style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900),
      ),
    );
  }
}

class _ScrollableState extends StatelessWidget {
  const _ScrollableState({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) => ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(24),
        children: <Widget>[
          SizedBox(
            height: constraints.maxHeight - 48,
            child: Center(child: child),
          ),
        ],
      ),
    );
  }
}

void _showError(BuildContext context, Object error) {
  var message = 'Something went wrong. Please try again.';
  if (error is DioException) {
    final data = error.response?.data;
    if (data is Map<String, dynamic>) {
      final apiMessage = data['message'];
      if (apiMessage is String && apiMessage.trim().isNotEmpty) {
        message = apiMessage;
      } else if (apiMessage is List && apiMessage.isNotEmpty) {
        message = apiMessage.first.toString();
      }
    }
  }
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
}
