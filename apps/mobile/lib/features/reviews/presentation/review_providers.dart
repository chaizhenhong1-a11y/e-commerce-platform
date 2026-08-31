import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/presentation/auth_providers.dart';
import '../data/reviews_repository.dart';
import '../domain/product_reviews.dart';

final reviewsRepositoryProvider = Provider<ReviewsRepository>((ref) {
  return ReviewsRepository(ref.watch(apiClientProvider));
});

final productReviewsProvider =
    FutureProvider.family<ProductReviews, String>((ref, productId) {
  ref.watch(authControllerProvider);
  return ref.watch(reviewsRepositoryProvider).getProductReviews(productId);
});
