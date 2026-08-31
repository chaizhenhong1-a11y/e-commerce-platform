import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/product_reviews.dart';
import 'review_providers.dart';

class ProductReviewsSection extends ConsumerWidget {
  const ProductReviewsSection({
    required this.productId,
    super.key,
  });

  final String productId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final reviews = ref.watch(productReviewsProvider(productId));

    return reviews.when(
      loading: () => const Padding(
        padding: EdgeInsets.symmetric(vertical: 18),
        child: Center(child: CircularProgressIndicator()),
      ),
      error: (error, stackTrace) => Card(
        child: ListTile(
          title: const Text('Customer reviews'),
          subtitle: const Text('Unable to load reviews.'),
          trailing: IconButton(
            onPressed: () => ref.invalidate(
              productReviewsProvider(productId),
            ),
            icon: const Icon(Icons.refresh_rounded),
          ),
        ),
      ),
      data: (data) => _ReviewsContent(
        productId: productId,
        data: data,
      ),
    );
  }
}

class _ReviewsContent extends ConsumerWidget {
  const _ReviewsContent({
    required this.productId,
    required this.data,
  });

  final String productId;
  final ProductReviews data;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Row(
              children: <Widget>[
                Expanded(
                  child: Text(
                    'Customer reviews',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w900,
                        ),
                  ),
                ),
                if (data.reviewCount > 0)
                  Text(
                    '${data.averageRating.toStringAsFixed(1)} ★ · '
                    '${data.reviewCount}',
                    style: const TextStyle(fontWeight: FontWeight.w900),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            if (!data.signedIn)
              Text(
                'Sign in to review products you have purchased.',
                style: TextStyle(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              )
            else if (data.canReview)
              Align(
                alignment: Alignment.centerLeft,
                child: TextButton.icon(
                  onPressed: () => _openEditor(context, ref),
                  icon: const Icon(Icons.rate_review_outlined),
                  label: Text(
                    data.myReview == null
                        ? 'Write a review'
                        : 'Edit your review',
                  ),
                ),
              )
            else
              Text(
                'Reviews unlock after a paid purchase of this product.',
                style: TextStyle(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
            const SizedBox(height: 10),
            if (data.reviews.isEmpty)
              Text(
                'No verified customer reviews yet.',
                style: TextStyle(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              )
            else
              ...data.reviews.take(5).map(
                    (review) => _ReviewTile(review: review),
                  ),
          ],
        ),
      ),
    );
  }

  Future<void> _openEditor(
    BuildContext context,
    WidgetRef ref,
  ) async {
    final existing = data.myReview;
    var rating = existing?.rating ?? 5;
    final titleController = TextEditingController(
      text: existing?.title ?? '',
    );
    final bodyController = TextEditingController(
      text: existing?.body ?? '',
    );

    final saved = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: Text(
            existing == null ? 'Write a review' : 'Edit your review',
          ),
          content: SizedBox(
            width: 520,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: <Widget>[
                  Wrap(
                    children: List<Widget>.generate(5, (index) {
                      final value = index + 1;
                      return IconButton(
                        onPressed: () => setDialogState(() => rating = value),
                        icon: Icon(
                          value <= rating
                              ? Icons.star_rounded
                              : Icons.star_border_rounded,
                        ),
                      );
                    }),
                  ),
                  TextField(
                    controller: titleController,
                    maxLength: 80,
                    decoration: const InputDecoration(
                      labelText: 'Title',
                    ),
                  ),
                  TextField(
                    controller: bodyController,
                    maxLength: 1200,
                    maxLines: 5,
                    decoration: const InputDecoration(
                      labelText: 'Review',
                    ),
                  ),
                ],
              ),
            ),
          ),
          actions: <Widget>[
            if (existing != null)
              TextButton(
                onPressed: () async {
                  try {
                    await ref
                        .read(reviewsRepositoryProvider)
                        .deleteReview(existing.id);
                    if (dialogContext.mounted) {
                      Navigator.of(dialogContext).pop(true);
                    }
                  } on DioException {
                    // Keep the dialog open so the user can retry.
                  }
                },
                child: const Text('Delete'),
              ),
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () async {
                try {
                  await ref.read(reviewsRepositoryProvider).saveReview(
                        productId: productId,
                        rating: rating,
                        title: titleController.text,
                        body: bodyController.text,
                      );
                  if (dialogContext.mounted) {
                    Navigator.of(dialogContext).pop(true);
                  }
                } on DioException catch (error) {
                  if (!dialogContext.mounted) return;
                  final raw = error.response?.data;
                  final message =
                      raw is Map<String, dynamic> && raw['message'] is String
                          ? raw['message'] as String
                          : 'Unable to save review.';
                  ScaffoldMessenger.of(dialogContext).showSnackBar(
                    SnackBar(content: Text(message)),
                  );
                }
              },
              child: const Text('Save'),
            ),
          ],
        ),
      ),
    );

    titleController.dispose();
    bodyController.dispose();

    if (saved == true) {
      ref.invalidate(productReviewsProvider(productId));
    }
  }
}

class _ReviewTile extends StatelessWidget {
  const _ReviewTile({required this.review});

  final ProductReview review;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 14),
      child: DecoratedBox(
        decoration: BoxDecoration(
          border: Border(
            top: BorderSide(
              color: Theme.of(context).colorScheme.outlineVariant,
            ),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.only(top: 14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                children: <Widget>[
                  Text(
                    '${review.rating} ★',
                    style: const TextStyle(fontWeight: FontWeight.w900),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      review.authorName,
                      style: const TextStyle(fontWeight: FontWeight.w800),
                    ),
                  ),
                  if (review.verifiedPurchase)
                    const Text(
                      '✓ Verified',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                ],
              ),
              if (review.title?.isNotEmpty == true) ...<Widget>[
                const SizedBox(height: 6),
                Text(
                  review.title!,
                  style: const TextStyle(fontWeight: FontWeight.w800),
                ),
              ],
              if (review.body?.isNotEmpty == true) ...<Widget>[
                const SizedBox(height: 5),
                Text(review.body!),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
