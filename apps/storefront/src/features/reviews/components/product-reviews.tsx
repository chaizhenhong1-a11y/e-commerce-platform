"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type ReviewPayload = {
  summary: {
    averageRating: number;
    reviewCount: number;
  };
  reviews: Array<{
    id: string;
    rating: number;
    title: string | null;
    body: string | null;
    verifiedPurchase: boolean;
    authorName: string;
    createdAt: string;
    updatedAt: string;
  }>;
  viewer: {
    signedIn: boolean;
    canReview: boolean;
    myReview: {
      id: string;
      rating: number;
      title: string | null;
      body: string | null;
    } | null;
  };
};

function stars(rating: number) {
  return "★★★★★"
    .split("")
    .map((star, index) => (
      <span
        className={index < Math.round(rating) ? "is-filled" : ""}
        key={index}
      >
        {star}
      </span>
    ));
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function ProductReviews({
  productId,
}: {
  productId: string;
}) {
  const [data, setData] = useState<ReviewPayload | null>(null);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const response = await fetch(
      `/api/reviews/product/${encodeURIComponent(productId)}`,
      { cache: "no-store" },
    );
    if (!response.ok) {
      throw new Error("Unable to load reviews.");
    }

    const next = (await response.json()) as ReviewPayload;
    setData(next);
    if (next.viewer.myReview) {
      setRating(next.viewer.myReview.rating);
      setTitle(next.viewer.myReview.title ?? "");
      setBody(next.viewer.myReview.body ?? "");
    }
  }, [productId]);

  useEffect(() => {
    load().catch(() => setError("Unable to load reviews."));
  }, [load]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");

    try {
      const response = await fetch(
        `/api/reviews/product/${encodeURIComponent(productId)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating, title, body }),
        },
      );
      const payload = (await response.json().catch(() => null)) as
        | { message?: string | string[] }
        | null;

      if (!response.ok) {
        const raw = payload?.message;
        throw new Error(
          Array.isArray(raw)
            ? raw.join(" ")
            : raw || "Unable to save review.",
        );
      }

      await load();
      setEditing(false);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to save review.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    const reviewId = data?.viewer.myReview?.id;
    if (!reviewId || busy) return;
    setBusy(true);
    setError("");

    try {
      const response = await fetch(
        `/api/reviews/${encodeURIComponent(reviewId)}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        throw new Error("Unable to delete review.");
      }

      setTitle("");
      setBody("");
      setRating(5);
      await load();
      setEditing(false);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Unable to delete review.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!data) {
    return (
      <section className="reviews-section" id="reviews">
        <span className="section-kicker">REVIEWS</span>
        <h2>Customer reviews</h2>
        <p>{error || "Loading verified customer reviews…"}</p>
      </section>
    );
  }

  return (
    <section className="reviews-section" id="reviews">
      <div className="reviews-heading">
        <div>
          <span className="section-kicker">VERIFIED REVIEWS</span>
          <h2>Customer reviews</h2>
        </div>
        <div className="review-summary">
          <strong>
            {data.summary.reviewCount
              ? data.summary.averageRating.toFixed(1)
              : "—"}
          </strong>
          <div>
            <span className="review-stars">
              {stars(data.summary.averageRating)}
            </span>
            <small>
              {data.summary.reviewCount}{" "}
              {data.summary.reviewCount === 1 ? "review" : "reviews"}
            </small>
          </div>
        </div>
      </div>

      <div className="review-composer-state">
        {!data.viewer.signedIn ? (
          <p>Sign in to review products you have purchased.</p>
        ) : data.viewer.canReview ? (
          <button
            className="button"
            type="button"
            onClick={() => setEditing((value) => !value)}
          >
            {data.viewer.myReview ? "Edit your review" : "Write a review"}
          </button>
        ) : (
          <p>Reviews are available after a paid purchase of this product.</p>
        )}
      </div>

      {editing ? (
        <form className="review-form" onSubmit={submit}>
          <div className="review-rating-picker">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                type="button"
                aria-label={`${value} stars`}
                className={value <= rating ? "is-selected" : ""}
                key={value}
                onClick={() => setRating(value)}
              >
                ★
              </button>
            ))}
          </div>

          <label>
            <span>Title</span>
            <input
              maxLength={80}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="A short summary"
            />
          </label>

          <label>
            <span>Review</span>
            <textarea
              maxLength={1200}
              rows={5}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="What was your experience with this product?"
            />
          </label>

          {error ? <p className="form-error">{error}</p> : null}

          <div className="review-form__actions">
            <button
              className="button button--primary"
              type="submit"
              disabled={busy}
            >
              {busy ? "Saving…" : "Save review"}
            </button>
            {data.viewer.myReview ? (
              <button
                className="button review-delete-button"
                type="button"
                disabled={busy}
                onClick={remove}
              >
                Delete review
              </button>
            ) : null}
          </div>
        </form>
      ) : null}

      {error && !editing ? <p className="form-error">{error}</p> : null}

      <div className="review-list">
        {data.reviews.length === 0 ? (
          <div className="review-empty">
            No verified customer reviews yet.
          </div>
        ) : (
          data.reviews.map((review) => (
            <article className="review-card" key={review.id}>
              <div className="review-card__top">
                <div>
                  <span className="review-stars">
                    {stars(review.rating)}
                  </span>
                  <strong>{review.authorName}</strong>
                </div>
                <span>{dateLabel(review.createdAt)}</span>
              </div>

              {review.verifiedPurchase ? (
                <span className="verified-purchase">
                  ✓ Verified purchase
                </span>
              ) : null}
              {review.title ? <h3>{review.title}</h3> : null}
              {review.body ? <p>{review.body}</p> : null}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
