import React, { useState } from "react";
import "./ContactUs.css";

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast("");
    }, 3000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);

    setTimeout(() => {
      setSubmitting(false);
      showToast("Thank you! We'll be in touch soon.");
      setFormData({ name: "", email: "", phone: "", message: "" });
    }, 1200);
  };

  return (
    <div className="contact-page-root" id="contact">
      {toast && <div className="toast">{toast}</div>}


      <div className="contact-wrapper">
        <div className="contact-card">
          {/* Header */}
          <div className="contact-header">
            <h1 className="contact-title">
              <span className="gradient-text">Contact</span> Us
            </h1>
            <p className="contact-subtitle">We'd love to hear from you</p>
          </div>

          {/* Form */}
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="contact-grid">
              {/* Name */}
              <div className="form-group">
                <label className="field-label" htmlFor="name">
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
                  <span>Your Name</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="Enter your name"
                  className="input-field"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="field-label" htmlFor="email">
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
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Email Address</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="your.email@example.com"
                  className="input-field"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Phone */}
            <div className="form-group">
              <label className="field-label" htmlFor="phone">
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
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span>Phone Number (Optional)</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                className="input-field"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            {/* Message */}
            <div className="form-group">
              <label className="field-label" htmlFor="message">
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
                <span>Your Message</span>
              </label>
              <textarea
                id="message"
                name="message"
                rows="5"
                required
                placeholder="Tell us how we can help you..."
                className="input-field textarea-field"
                value={formData.message}
                onChange={handleChange}
              />
            </div>

            {/* Submit */}
            <div className="submit-row">
              <button
                type="submit"
                className="gradient-button"
                disabled={submitting}
              >
                <span>{submitting ? "Sending..." : "Send Message"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
