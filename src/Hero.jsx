const Star = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="m12 2.6 2.9 5.9 6.5.9-4.7 4.6 1.1 6.4-5.8-3-5.8 3 1.1-6.4L2.6 9.4l6.5-.9z" />
  </svg>
);

const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const socials = [
  {
    name: "Facebook",
    path: "M14 8.5V6.8c0-.8.2-1.3 1.4-1.3H17V2.6c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2H8.4v3h2.4v7.9H14V11.5h2.4l.4-3H14z",
  },
  {
    name: "Instagram",
    path: "M12 2.2c3.2 0 3.6 0 4.9.1 3.3.1 4.8 1.7 4.9 4.9.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.9c-.1 3.2-1.6 4.8-4.9 4.9-1.3.1-1.6.1-4.9.1s-3.6 0-4.9-.1c-3.3-.2-4.8-1.7-4.9-4.9-.1-1.3-.1-1.6-.1-4.9s0-3.5.1-4.8C2.3 4 3.8 2.4 7.1 2.3c1.3-.1 1.7-.1 4.9-.1zm0 3.4a6.4 6.4 0 1 0 0 12.8 6.4 6.4 0 0 0 0-12.8zm0 10.6a4.2 4.2 0 1 1 0-8.4 4.2 4.2 0 0 1 0 8.4zm6.6-10.9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z",
  },
  {
    name: "X",
    path: "M17.5 3h3l-6.6 7.5L21.8 21h-6l-4.7-6.1L5.6 21h-3l7-8-6.9-10h6.1l4.3 5.6L17.5 3zm-1 16.2h1.7L7.6 4.7H5.8l10.7 14.5z",
  },
];

const assurances = [
  "Free express shipping over $150",
  "30-day no-questions returns",
  "2-year craftsmanship warranty",
  "Verified authentic — every pair",
  "Members get early drop access",
];

const Hero = () => {
  return (
    <>
      <main className="hero">
        <div className="hero-content">
          <p className="tagline">
            <span className="dot" />
            #1 Trending Shoes of 2025
          </p>

          <h1>
            Your feet deserve
            <span className="serif">
              the best<span className="period">.</span>
            </span>
          </h1>

          <p className="description">
            Engineered for the ones who never sit still. Premium materials,
            obsessive craft, and a fit that disappears the moment you start
            moving. Go out and play.
          </p>

          <div className="btn">
            <button className="primary">
              Shop Now
              <Arrow />
            </button>
            <button className="ghost">Browse Category</button>
          </div>

          <div className="trust-info">
            <div className="item">
              <span className="value">
                4.9/5
                <span className="stars">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} />
                  ))}
                </span>
              </span>
              <span className="label">TrustScore</span>
            </div>
            <div className="item">
              <span className="value">10,000+</span>
              <span className="label">Happy Customers</span>
            </div>
            <div className="item">
              <span className="value">30-Day</span>
              <span className="label">Free Returns</span>
            </div>
          </div>

          <div className="social-icons">
            <span className="label">Follow</span>
            {socials.map(({ name, path }) => (
              <a key={name} href="#" aria-label={name}>
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d={path} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        <div className="hero-image">
          <span className="chip chip-drop">
            <span className="dot" />
            New Drop
          </span>

          <div className="stage">
            <div className="stage-frame">
              <img src="logo1.jpeg" alt="Red knit running shoe" />
            </div>
            <div className="stage-meta">
              <span className="name">Flyknit Racer — Crimson</span>
              <span className="sku">Ref. 2025</span>
            </div>
          </div>

          <span className="chip chip-price">
            <span className="amount">$189</span>
            <span className="note">Free express shipping</span>
          </span>

          <span className="stage-label">Collection 2025</span>
        </div>
      </main>

      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {[0, 1].map((group) => (
            <div className="marquee-group" key={group}>
              {assurances.map((text) => (
                <span key={text}>{text}</span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Hero;
