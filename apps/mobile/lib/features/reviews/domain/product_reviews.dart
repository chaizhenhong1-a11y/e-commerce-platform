class ProductReview {
  const ProductReview({
    required this.id,
    required this.rating,
    required this.authorName,
    required this.verifiedPurchase,
    required this.createdAt,
    this.title,
    this.body,
  });

  factory ProductReview.fromJson(Map<String, dynamic> json) {
    return ProductReview(
      id: json['id'] as String,
      rating: json['rating'] as int,
      title: json['title'] as String?,
      body: json['body'] as String?,
      authorName: json['authorName'] as String,
      verifiedPurchase: json['verifiedPurchase'] as bool? ?? false,
      createdAt: DateTime.parse(json['createdAt'] as String).toLocal(),
    );
  }

  final String id;
  final int rating;
  final String? title;
  final String? body;
  final String authorName;
  final bool verifiedPurchase;
  final DateTime createdAt;
}

class MyProductReview {
  const MyProductReview({
    required this.id,
    required this.rating,
    this.title,
    this.body,
  });

  factory MyProductReview.fromJson(Map<String, dynamic> json) {
    return MyProductReview(
      id: json['id'] as String,
      rating: json['rating'] as int,
      title: json['title'] as String?,
      body: json['body'] as String?,
    );
  }

  final String id;
  final int rating;
  final String? title;
  final String? body;
}

class ProductReviews {
  const ProductReviews({
    required this.averageRating,
    required this.reviewCount,
    required this.reviews,
    required this.signedIn,
    required this.canReview,
    this.myReview,
  });

  factory ProductReviews.fromJson(Map<String, dynamic> json) {
    final summary = json['summary'] as Map<String, dynamic>;
    final viewer = json['viewer'] as Map<String, dynamic>;
    final rawReviews = json['reviews'] as List<dynamic>? ?? const [];

    return ProductReviews(
      averageRating: (summary['averageRating'] as num).toDouble(),
      reviewCount: summary['reviewCount'] as int,
      reviews: rawReviews
          .map(
            (item) => ProductReview.fromJson(
              item as Map<String, dynamic>,
            ),
          )
          .toList(growable: false),
      signedIn: viewer['signedIn'] as bool? ?? false,
      canReview: viewer['canReview'] as bool? ?? false,
      myReview: viewer['myReview'] == null
          ? null
          : MyProductReview.fromJson(
              viewer['myReview'] as Map<String, dynamic>,
            ),
    );
  }

  final double averageRating;
  final int reviewCount;
  final List<ProductReview> reviews;
  final bool signedIn;
  final bool canReview;
  final MyProductReview? myReview;
}
