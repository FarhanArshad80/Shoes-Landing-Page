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
const BAG_KEY = "landing.bag";
const ALERTS_KEY = "landing.restock-alerts";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOW_STOCK_AT = 2;
const PRICE = 189;
const FREE_SHIPPING_AT = 150;

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

// The bag is stored as US sizes and quantities and nothing else. Prices and
// stock are read from `sizes` at render time, so a bag left in storage over
// a price change or a restock cannot go on quoting the old numbers.
function recallBag() {
  try {
    const stored = JSON.parse(localStorage.getItem(BAG_KEY));

    if (!Array.isArray(stored)) return [];

    return stored
      .map((line) => ({ us: Number(line?.us), qty: Math.floor(Number(line?.qty)) }))
      .filter((line) => {
        const option = sizes.find((size) => size.us === line.us);

        // A size that has since sold out, or been reduced below what is in
        // the bag, is trimmed to what the shelf can actually honour.
        return option && option.left > 0 && line.qty >= 1;
      })
      .map((line) => ({
        ...line,
        qty: Math.min(line.qty, sizes.find((size) => size.us === line.us).left),
      }));
  } catch (error) {
    return [];
  }
}

// Which sold-out sizes this visitor has already asked to hear about. Kept as
// US sizes so the list survives switching between UK, EU and CM.
function recallAlerts() {
  try {
    const stored = JSON.parse(localStorage.getItem(ALERTS_KEY));

    return Array.isArray(stored) ? stored.map(Number).filter(Number.isFinite) : [];
  } catch (error) {
    return [];
  }
}

function money(amount) {
  return `$${amount.toLocaleString("en-US")}`;
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
  const [bag, setBag] = useState(recallBag);
  const [alerts, setAlerts] = useState(recallAlerts);
  const [asking, setAsking] = useState(null);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const selected = sizes.find((option) => option.us === size);
  const lowStock = selected && selected.left <= LOW_STOCK_AT;

  const bagCount = bag.reduce((total, line) => total + line.qty, 0);
  const subtotal = bagCount * PRICE;

  // How many of the selected size are already spoken for, so the button can
  // stop offering an eleventh pair of a size with nine on the shelf.
  const inBag = bag.find((line) => line.us === size)?.qty || 0;
  const atLimit = Boolean(selected) && inBag >= selected.left;

  useEffect(() => {
    try {
      localStorage.setItem(BAG_KEY, JSON.stringify(bag));
    } catch (error) {
      /* storage unavailable — the bag just will not survive a reload */
    }
  }, [bag]);

  useEffect(() => {
    try {
      localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
    } catch (error) {
      /* storage unavailable — the request just will not be remembered here */
    }
  }, [alerts]);

  const askedSize = sizes.find((option) => option.us === asking);

  // Tapping a sold-out size opens the request; tapping it again closes it,
  // so the same chip both asks and takes it back.
  const handleGone = (us) => {
    setAsking((current) => (current === us ? null : us));
    setEmailError("");
  };

  const submitAlert = (event) => {
    event.preventDefault();

    if (!EMAIL_RE.test(email.trim())) {
      setEmailError("That doesn't look like an email address.");
      return;
    }

    // Nothing is posted anywhere yet — this is the shape the request takes
    // once there is a backend to take it.
    setAlerts((current) =>
      current.includes(asking) ? current : [...current, asking]
    );
    setAsking(null);
    setEmailError("");
  };

  const setQuantity = (us, next) => {
    const option = sizes.find((item) => item.us === us);
    const capped = Math.min(Math.max(next, 0), option ? option.left : 0);

    setBag((current) =>
      capped === 0
        ? current.filter((line) => line.us !== us)
        : current.map((line) => (line.us === us ? { ...line, qty: capped } : line))
    );
  };

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

  // Adds the selected size, or one more of it. The warehouse count is the
  // ceiling: offering a pair that cannot be shipped only moves the
  // disappointment further down the checkout.
  const handleShop = () => {
    if (!selected || atLimit) return;

    setBag((current) =>
      current.some((line) => line.us === selected.us)
        ? current.map((line) =>
            line.us === selected.us ? { ...line, qty: line.qty + 1 } : line
          )
        : [...current, { us: selected.us, qty: 1 }]
    );

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
                const watching = alerts.includes(us);
                const name = sizeName(option, system);

                return (
                  <button
                    key={us}
                    type="button"
                    className={`size-chip${us === size ? " is-selected" : ""}${
                      soldOut ? " is-gone" : ""
                    }${watching ? " is-watched" : ""}${
                      asking === us ? " is-asking" : ""
                    }`}
                    onClick={() => (soldOut ? handleGone(us) : setSize(us))}
                    aria-pressed={soldOut ? asking === us : us === size}
                    aria-label={
                      soldOut
                        ? watching
                          ? `${name} — sold out, you'll be emailed when it's back`
                          : `${name} — sold out, ask to be told when it's back`
                        : `${name} — ${left} left`
                    }
                  >
                    {sizeValue(option, system)}
                  </button>
                );
              })}
            </div>

            {askedSize && (
              <form className="restock" onSubmit={submitAlert}>
                <label htmlFor="restock-email">
                  {sizeName(askedSize, system)} is gone. Tell you when it's back?
                </label>

                <div className="restock-row">
                  <input
                    id="restock-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setEmailError("");
                    }}
                    aria-invalid={Boolean(emailError)}
                    aria-describedby={emailError ? "restock-error" : undefined}
                  />
                  <button type="submit">Notify me</button>
                </div>

                {emailError && (
                  <p className="restock-error" id="restock-error">{emailError}</p>
                )}
              </form>
            )}

            <p className="size-note" aria-live="polite">
              {!selected
                ? "Runs true to size — pick yours to continue."
                : lowStock
                ? `Only ${selected.left} left in ${sizeName(selected, system)}.`
                : `${sizeName(selected, system)} in stock, ships today.`}
            </p>

            {/* Its own line rather than sharing the stock note — what is in
                stock now and what you are waiting on are two separate
                answers, and one should not hide the other. */}
            {alerts.length > 0 && (
              <p className="restock-note">
                We'll email you when{" "}
                {alerts
                  .map((us) => sizeName(sizes.find((option) => option.us === us), system))
                  .join(" and ")}{" "}
                {alerts.length > 1 ? "are" : "is"} back.
              </p>
            )}
          </fieldset>

          <div className="btn">
            <button
              className="primary"
              onClick={handleShop}
              disabled={!selected || atLimit}
              title={
                !selected
                  ? "Select a size first"
                  : atLimit
                  ? `That's every ${sizeName(selected, system)} we have`
                  : undefined
              }
            >
              {atLimit
                ? `All ${selected.left} in your bag`
                : added
                ? `Added — ${sizeName(selected, system)}`
                : "Shop Now"}
              <Arrow />
            </button>
            <button className="ghost">Browse Category</button>
          </div>

          {bagCount > 0 && (
            <section className="bag" aria-label="Your bag">
              <header className="bag-head">
                <h2>
                  Your bag
                  <span className="bag-count">{bagCount}</span>
                </h2>
                <button
                  type="button"
                  className="bag-clear"
                  onClick={() => setBag([])}
                >
                  Empty
                </button>
              </header>

              <ul className="bag-lines">
                {bag.map((line) => {
                  const option = sizes.find((item) => item.us === line.us);
                  const name = sizeName(option, system);

                  return (
                    <li className="bag-line" key={line.us}>
                      <span className="bag-size">{name}</span>

                      <span className="bag-qty">
                        <button
                          type="button"
                          onClick={() => setQuantity(line.us, line.qty - 1)}
                          aria-label={`Remove one ${name}`}
                        >
                          &minus;
                        </button>
                        <span aria-live="polite">{line.qty}</span>
                        <button
                          type="button"
                          onClick={() => setQuantity(line.us, line.qty + 1)}
                          disabled={line.qty >= option.left}
                          aria-label={`Add one ${name}`}
                        >
                          +
                        </button>
                      </span>

                      <span className="bag-price">{money(line.qty * PRICE)}</span>

                      <button
                        type="button"
                        className="bag-remove"
                        onClick={() => setQuantity(line.us, 0)}
                        aria-label={`Remove ${name} from your bag`}
                      >
                        &times;
                      </button>
                    </li>
                  );
                })}
              </ul>

              <footer className="bag-foot">
                <span className="bag-subtotal">
                  Subtotal
                  <strong>{money(subtotal)}</strong>
                </span>
                <span className="bag-shipping">
                  {subtotal >= FREE_SHIPPING_AT
                    ? "Free express shipping included"
                    : `${money(FREE_SHIPPING_AT - subtotal)} away from free express shipping`}
                </span>
              </footer>
            </section>
          )}

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
