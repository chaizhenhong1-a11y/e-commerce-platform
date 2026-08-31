import '../../../core/network/api_client.dart';
import '../domain/product_reviews.dart';

class ReviewsRepository {
  ReviewsRepository(this._apiClient);

  final ApiClient _apiClient;

  Future<ProductReviews> getProductReviews(String productId) async {
    final response = await _apiClient.dio.get<Map<String, dynamic>>(
      '/reviews/product/$productId',
    );
    final data = response.data;
    if (data == null) {
      throw StateError('Reviews response was empty.');
    }
    return ProductReviews.fromJson(data);
  }

  Future<void> saveReview({
    required String productId,
    required int rating,
    required String title,
    required String body,
  }) async {
    await _apiClient.dio.post<void>(
      '/reviews/product/$productId',
      data: <String, dynamic>{
        'rating': rating,
        'title': title.trim(),
        'body': body.trim(),
      },
    );
  }

  Future<void> deleteReview(String reviewId) async {
    await _apiClient.dio.delete<void>('/reviews/$reviewId');
  }
}
