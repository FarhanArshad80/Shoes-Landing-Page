import { useEffect, useState } from "react";

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

// The featured pair, in the sizes it actually exists in. `left` is what the
// warehouse says: 0 means the row is unbuyable rather than merely dimmed,
// and a low number is worth saying out loud.
//
// The UK, EU and CM columns are written out rather than derived. They are
// roughly a half-size apart from US, but only roughly — EU jumps 40, 40.5,
// 41, 42 with no 41.5 — so a formula would quietly invent sizes that no
// shelf actually holds.
const sizes = [
  { us: 7, uk: 6.5, eu: 40, cm: 25, left: 4 },
  { us: 7.5, uk: 7, eu: 40.5, cm: 25.4, left: 0 },
  { us: 8, uk: 7.5, eu: 41, cm: 26, left: 6 },
  { us: 8.5, uk: 8, eu: 42, cm: 26.7, left: 2 },
  { us: 9, uk: 8.5, eu: 42.5, cm: 27, left: 9 },
  { us: 9.5, uk: 9, eu: 43, cm: 27.5, left: 1 },
  { us: 10, uk: 9.5, eu: 44, cm: 28, left: 0 },
  { us: 10.5, uk: 10, eu: 44.5, cm: 28.5, left: 5 },
  { us: 11, uk: 10.5, eu: 45, cm: 29, left: 3 },
  { us: 12, uk: 11.5, eu: 46, cm: 30, left: 0 },
];

const systems = ["US", "UK", "EU", "CM"];
const SYSTEM_KEY = "landing.size-system";
const LOW_STOCK_AT = 2;

// Someone shopping from Berlin should not have to convert in their head, and
// should not have to convert again on their next visit either.
function recallSystem() {
  try {
    const stored = localStorage.getItem(SYSTEM_KEY);

    return systems.includes(stored) ? stored : "US";
  } catch (error) {
    return "US";
  }
}

// Centimetres are the one system people read to a decimal — 26.7 is a real
// distinction there, where "US 8.50" would just look wrong.
function sizeValue(option, system) {
  const value = option[system.toLowerCase()];

  return system === "CM" ? value.toFixed(1) : String(value);
}

function sizeName(option, system) {
  return `${system} ${sizeValue(option, system)}`;
}

const assurances = [
  "Free express shipping over $150",
  "30-day no-questions returns",
  "2-year craftsmanship warranty",
  "Verified authentic — every pair",
  "Members get early drop access",
];

const Hero = () => {
  const [size, setSize] = useState(null);
  const [added, setAdded] = useState(false);
  const [system, setSystem] = useState(recallSystem);

  const selected = sizes.find((option) => option.us === size);
  const lowStock = selected && selected.left <= LOW_STOCK_AT;

  // The selection is always held as a US size and only translated on the way
  // out, so switching systems relabels the row without losing the pick.
  const chooseSystem = (next) => {
    setSystem(next);

    try {
      localStorage.setItem(SYSTEM_KEY, next);
    } catch (error) {
      /* storage unavailable — the choice just will not survive a reload */
    }
  };

  // Picking a different size means the previous confirmation is about a bag
  // that no longer reflects what is selected.
  useEffect(() => {
    setAdded(false);
  }, [size]);

  // Nothing is really added to anything yet — but the button should at
  // least stop pretending the size question was never asked.
  const handleShop = () => {
    if (!selected) return;

    setAdded(true);
  };

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

          <fieldset className="size-picker">
            <legend>
              Select size
              <span className="size-guide" role="group" aria-label="Size system">
                {systems.map((id) => (
                  <button
                    key={id}
                    type="button"
                    className={
                      id === system ? "system-btn is-active" : "system-btn"
                    }
                    onClick={() => chooseSystem(id)}
                    aria-pressed={id === system}
                  >
                    {id}
                  </button>
                ))}
              </span>
            </legend>

            <div className="size-row">
              {sizes.map((option) => {
                const { us, left } = option;
                const soldOut = left === 0;
                const name = sizeName(option, system);

                return (
                  <button
                    key={us}
                    type="button"
                    className={`size-chip${us === size ? " is-selected" : ""}${
                      soldOut ? " is-gone" : ""
                    }`}
                    onClick={() => setSize(us)}
                    disabled={soldOut}
                    aria-pressed={us === size}
                    aria-label={
                      soldOut ? `${name} — sold out` : `${name} — ${left} left`
                    }
                  >
                    {sizeValue(option, system)}
                  </button>
                );
              })}
            </div>

            <p className="size-note" aria-live="polite">
              {!selected
                ? "Runs true to size — pick yours to continue."
                : lowStock
                ? `Only ${selected.left} left in ${sizeName(selected, system)}.`
                : `${sizeName(selected, system)} in stock, ships today.`}
            </p>
          </fieldset>

          <div className="btn">
            <button
              className="primary"
              onClick={handleShop}
              disabled={!selected}
              title={selected ? undefined : "Select a size first"}
            >
              {added ? `Added — ${sizeName(selected, system)}` : "Shop Now"}
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
