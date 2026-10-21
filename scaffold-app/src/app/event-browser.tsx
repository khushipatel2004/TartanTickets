"use client";

import { useMemo, useState } from "react";
import type { Event } from "@/lib/events";

type Category = "All events" | "Music" | "Community" | "Arts" | "Career";

const categories: Category[] = ["All events", "Music", "Community", "Arts", "Career"];

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path d="M4.167 10h11.666M10 4.167 15.833 10 10 15.833" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <circle cx="8.75" cy="8.75" r="5.75" />
      <path d="m13 13 4 4" />
    </svg>
  );
}

export default function EventBrowser({ events }: { events: Event[] }) {
  const [activeCategory, setActiveCategory] = useState<Category>("All events");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [checkoutEvent, setCheckoutEvent] = useState<Event | null>(null);
  const [name, setName] = useState("");

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return events.filter((event) => {
      const matchesCategory =
        activeCategory === "All events" || event.category === activeCategory;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        `${event.title} ${event.club} ${event.location} ${event.category}`
          .toLowerCase()
          .includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query]);

  function showDemoNotice(action: "waitlist" | "signin") {
    const messages = {
      waitlist:
        "Waitlist is a preview only. No place has been reserved and no information was saved.",
      signin:
        "This preview does not use a sign-in provider. Enter your name in the demo checkout instead.",
    };
    setNotice(messages[action]);
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#" aria-label="Tartan Tickets home">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </span>
          <span className="brand-name">
            tartan<span>tickets</span>
          </span>
        </a>

        <nav className="desktop-nav" aria-label="Main navigation">
          <a className="nav-link nav-link-active" href="#events">
            Find events
          </a>
          <a className="nav-link" href="#for-clubs">
            For clubs
          </a>
          <a className="nav-link" href="/check-in">
            Door check-in (demo)
          </a>
        </nav>

        <button
          className="signin-button"
          type="button"
          onClick={() => showDemoNotice("signin")}
        >
          Sign in <ArrowIcon />
        </button>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            YOUR CAMPUS, YOUR CALENDAR
          </div>
          <h1 id="hero-title">
            Good things
            <br />
            happen <span>here.</span>
          </h1>
          <p className="hero-description">
            Find your people, try something new, and make this semester one to
            remember.
          </p>
          <a className="hero-cta" href="#events">
            Find your next thing <ArrowIcon />
          </a>
          <p className="hero-footnote">
            Events made by CMU students, for CMU students.
          </p>
        </div>
        <div className="hero-art" aria-label="Illustration of a campus concert">
          <div className="hero-art-sun" />
          <div className="hero-art-ring hero-art-ring-one" />
          <div className="hero-art-ring hero-art-ring-two" />
          <div className="hero-art-copy">
            <span>THE SEMESTER SOUNDS BETTER</span>
            <strong>OUT<br />THERE.</strong>
            <i>DISCOVER WHAT&apos;S ON</i>
          </div>
          <div className="hero-art-star">✳</div>
          <div className="hero-art-ticket">
            <span>CMU</span>
            <strong>26</strong>
            <small>LET&apos;S GO</small>
          </div>
          <div className="hero-art-caption">
            <span className="caption-line" />
            <span>MAKE ROOM FOR A LITTLE MAGIC</span>
          </div>
        </div>
      </section>

      <section className="events-section" id="events" aria-labelledby="events-title">
        <div className="section-heading">
          <div>
            <div className="eyebrow section-eyebrow">THE CAMPUS BUZZ</div>
            <h2 id="events-title">What&apos;s happening</h2>
            <p className="section-description">
              The best plans are the ones you haven&apos;t made yet.
            </p>
          </div>
          <span className="event-count">
            {filteredEvents.length.toString().padStart(2, "0")}{" "}
            <span>events</span>
          </span>
        </div>

        <div className="event-controls">
          <div className="category-list" aria-label="Filter by event category">
            {categories.map((category) => (
              <button
                className={`category-button${activeCategory === category ? " category-button-active" : ""}`}
                key={category}
                type="button"
                aria-pressed={activeCategory === category}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
          <label className="search-field">
            <SearchIcon />
            <span className="visually-hidden">Search events</span>
            <input
              aria-label="Search events"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search events"
            />
            <kbd>⌘ K</kbd>
          </label>
        </div>

        {filteredEvents.length > 0 ? (
          <div className="event-grid">
            {filteredEvents.map((event) => {
              const soldOut = event.remaining === 0;
              return (
                <article
                  aria-labelledby={`event-title-${event.id}`}
                  className="event-card"
                  key={event.id}
                >
                  <div className={`event-art ${event.art}`}>
                    {event.featured && (
                      <span className="featured-label">
                        <span /> JUST ADDED
                      </span>
                    )}
                    <span className="art-motif">
                      {event.motif.split("\n").map((line) => (
                        <span key={line}>{line}</span>
                      ))}
                    </span>
                    <span className="art-edition">CMU · FALL 26</span>
                    <span className="art-stamp" aria-hidden="true">
                      {event.category === "Music"
                        ? "♫"
                        : event.category === "Arts"
                          ? "✳"
                          : event.category === "Career"
                            ? "✦"
                            : "✳"}
                    </span>
                  </div>
                  <div className="event-content">
                    <div className="event-meta">
                      <span className="event-category">{event.category}</span>
                      <span className="event-club">{event.club}</span>
                    </div>
                    <h3 id={`event-title-${event.id}`}>{event.title}</h3>
                    <div className="event-details">
                      <span>
                        <span className="detail-icon" aria-hidden="true">◷</span>
                        {event.date} · {event.time}
                      </span>
                      <span>
                        <span className="detail-icon detail-pin" aria-hidden="true">⌖</span>
                        {event.location}
                      </span>
                    </div>
                    <div className="event-footer">
                      <div className="event-price">
                        <strong>{event.price === 0 ? "Free" : `$${event.price}`}</strong>
                        <span>
                          {soldOut
                            ? "Sold out"
                            : `${event.remaining} of ${event.capacity} left`}
                        </span>
                      </div>
                      <button
                        className={`event-action${soldOut ? " event-action-waitlist" : ""}`}
                        type="button"
                        onClick={() => {
                          if (soldOut) {
                            showDemoNotice("waitlist");
                          } else {
                            setName("");
                            setCheckoutEvent(event);
                          }
                        }}
                      >
                        {soldOut ? "Join waitlist" : "Get tickets"}
                        <ArrowIcon />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state" role="status">
            <span className="empty-state-icon" aria-hidden="true">✳</span>
            <h3>No events found</h3>
            <p>Try another search or category to find your next campus plan.</p>
            <button
              className="reset-button"
              type="button"
              onClick={() => {
                setQuery("");
                setActiveCategory("All events");
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      <section className="clubs-banner" id="for-clubs">
        <div className="clubs-banner-mark" aria-hidden="true">T</div>
        <div>
          <div className="eyebrow">MADE FOR THE PEOPLE WHO MAKE IT HAPPEN</div>
          <h2>Your club brings the energy.</h2>
          <p>We&apos;re building a better way to bring your campus together.</p>
        </div>
        <button
          className="clubs-link"
          type="button"
          onClick={() => setNotice("Club tools are coming soon. Event publishing is not connected yet.")}
        >
          Get updates <ArrowIcon />
        </button>
      </section>

      <footer className="site-footer">
        <a className="brand footer-brand" href="#" aria-label="Tartan Tickets home">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </span>
          <span className="brand-name">
            tartan<span>tickets</span>
          </span>
        </a>
        <p>Made for campus life. Built with care.</p>
        <span className="footer-semester">PITTSBURGH, PA · FALL 2026</span>
      </footer>

      {notice && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setNotice(null);
        }}>
          <section
            aria-labelledby="notice-title"
            aria-modal="true"
            className="notice-dialog"
            role="dialog"
          >
            <button
              aria-label="Close message"
              className="notice-close"
              type="button"
              onClick={() => setNotice(null)}
            >
              ×
            </button>
            <span className="notice-icon" aria-hidden="true">✳</span>
            <p className="eyebrow">TARTAN TICKETS PREVIEW</p>
            <h2 id="notice-title">Not quite ready yet</h2>
            <p className="notice-copy">{notice}</p>
            <button
              className="notice-confirm"
              type="button"
              onClick={() => setNotice(null)}
            >
              Got it
            </button>
          </section>
        </div>
      )}
      {checkoutEvent && (
        <div className="dialog-backdrop">
          <section
            aria-labelledby="checkout-title"
            aria-modal="true"
            className="notice-dialog"
            role="dialog"
          >
            <button
              aria-label="Close checkout"
              className="notice-close"
              type="button"
              onClick={() => setCheckoutEvent(null)}
            >
              ×
            </button>
            <span className="notice-icon" aria-hidden="true">✳</span>
            <p className="eyebrow">DEMO CHECKOUT</p>
            <h2 id="checkout-title">{checkoutEvent.title}</h2>
            <p className="notice-copy">
              Enter a name to preview checkout. No account, payment, or ticket
              will be created.
            </p>
            <form
              className="checkout-form"
              onSubmit={(event) => {
                event.preventDefault();
                setCheckoutEvent(null);
                setNotice(
                  `Payment simulated for ${name}. No payment was collected and no ticket was created.`,
                );
              }}
            >
              <label htmlFor="checkout-name">Your name</label>
              <input
                autoComplete="name"
                id="checkout-name"
                onChange={(event) => setName(event.target.value)}
                required
                value={name}
              />
              <button className="notice-confirm" type="submit">
                Simulated payment
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
