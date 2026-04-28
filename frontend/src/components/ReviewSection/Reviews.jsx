import React, { useState, useEffect } from "react";
import "./Reviews.css";

const STORAGE_KEY = "nexted_ai_reviews";

const defaultConfig = {
  section_label: "User Insights",
  section_title: "Trusted by Students and Educators Nationwide",
  section_description:
    "Real feedback from learners and instructors using NextEd AI's integrated platform for AI-powered study assistance, voice-based tutoring, automated assessments, and intelligent classroom management.",
  form_title: "Share Your Experience",
  name_label: "Full Name",
  review_label: "Your Feedback",
  rating_label: "Rate Your Experience",
  submit_button_text: "Submit Feedback",
  empty_state_text:
    "No feedback submitted yet. Be the first to share your experience with NextEd AI.",
};

function Reviews() {
  // 🔹 Remove config state
  // const [config, setConfig] = useState(defaultConfig);

  const [formData, setFormData] = useState({
    name: "",
    review: "",
    rating: 0,
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const loadReviews = () => {
      try {
        const storedReviews = localStorage.getItem(STORAGE_KEY);
        if (storedReviews) {
          const parsed = JSON.parse(storedReviews);
          const sorted = parsed.sort((a, b) => b.timestamp - a.timestamp);
          setReviews(sorted);
        }
      } catch (error) {
        console.error("Error loading reviews:", error);
      }
    };
    loadReviews();
  }, []);

  const saveReviews = (reviewsList) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reviewsList));
    } catch (error) {
      console.error("Error saving reviews:", error);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.review.trim() || formData.rating === 0) {
      return;
    }

    const newReview = {
      id: Date.now().toString(),
      name: formData.name.trim(),
      text: formData.review.trim(),
      rating: formData.rating,
      timestamp: Date.now(),
    };

    const updatedReviews = [newReview, ...reviews];
    setReviews(updatedReviews);
    saveReviews(updatedReviews);

    setFormData({
      name: "",
      review: "",
      rating: 0,
    });

    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const renderStars = (count) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i}>{i < count ? "★" : "☆"}</span>
    ));
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const options = { year: "numeric", month: "long", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

  // 🔹 You can completely delete this effect if not using elementSdk
  useEffect(() => {
    if (window.elementSdk) {
      window.elementSdk.init({
        defaultConfig,
        onConfigChange: async () => {
          // No-op since config state was removed
        },
        mapToCapabilities: () => ({
          recolorables: [],
          borderables: [],
          fontEditable: undefined,
          fontSizeable: undefined,
        }),
        mapToEditPanelValues: () =>
          new Map([
            ["section_label", defaultConfig.section_label],
            ["section_title", defaultConfig.section_title],
            ["section_description", defaultConfig.section_description],
            ["form_title", defaultConfig.form_title],
            ["name_label", defaultConfig.name_label],
            ["review_label", defaultConfig.review_label],
            ["rating_label", defaultConfig.rating_label],
            ["submit_button_text", defaultConfig.submit_button_text],
            ["empty_state_text", defaultConfig.empty_state_text],
          ]),
      });
    }
  }, []);

  const isFormValid =
    formData.name.trim() && formData.review.trim() && formData.rating > 0;

  return (
    <div className="review-section-wrapper">
      {showToast && (
        <div className="toast-notification">
          <span>✓</span>
          <span>Feedback submitted successfully</span>
        </div>
      )}

      <div className="review-container">
        <header className="section-header">
          <div className="section-label section-label--highlighted">
            {defaultConfig.section_label}
          </div>
          <h1 className="reviews-title">{defaultConfig.section_title}</h1>
          <p className="section-description">
            {defaultConfig.section_description}
          </p>
        </header>

        <div className="form-card">
          <h2 className="form-title">{defaultConfig.form_title}</h2>
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name" className="field-label">
                <svg
                  className="label-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span>{defaultConfig.name_label}</span>
              </label>
              <input
                type="text"
                id="name"
                className="input-field"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="review" className="field-label">
                <svg
                  className="label-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                <span>{defaultConfig.review_label}</span>
              </label>
              <textarea
                id="review"
                className="input-field textarea-field"
                value={formData.review}
                onChange={(e) => handleInputChange("review", e.target.value)}
                placeholder="Share your experience with NextEd AI's learning platform..."
                required
              />
            </div>

            <div className="form-group">
              <label className="field-label">
                <svg
                  className="label-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
                <span>{defaultConfig.rating_label}</span>
              </label>
              <div className="star-rating-container">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`star-button ${star <= (hoverRating || formData.rating) ? "filled" : ""
                      }`}
                    onClick={() => handleInputChange("rating", star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    aria-label={`Rate ${star} stars`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="gradient-button"
              disabled={!isFormValid}
            >
              {defaultConfig.submit_button_text}
            </button>
          </form>
        </div>

        {reviews.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💬</div>
            <h3 className="empty-title">No Feedback Yet</h3>
            <p className="empty-text">{defaultConfig.empty_state_text}</p>
          </div>
        ) : (
          <div className="reviews-grid">
            {reviews.map((review, index) => (
              <article
                key={review.id}
                className="review-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="review-header">
                  <div className="reviewer-info">
                    <h3 className="reviewer-name">{review.name}</h3>
                    <time className="review-date">
                      {formatDate(review.timestamp)}
                    </time>
                  </div>
                  <div
                    className="review-rating"
                    aria-label={`${review.rating} out of 5 stars`}
                  >
                    {renderStars(review.rating)}
                  </div>
                </div>
                <p className="review-text">{review.text}</p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Reviews;
