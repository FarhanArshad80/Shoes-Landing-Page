import { useEffect, useMemo, useState } from "react";

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
// How long an emptied bag is held before it is really gone. Long enough to
// notice the mistake and reach for the button, short enough that the banner
// is not still sitting there once the page has moved on.
const UNDO_SECONDS = 8;
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
//
// Bringing one back is also a reckoning with the shelf, and the shelf moves
// while people are away. A pair that sold out in the meantime cannot be
// honoured — but taking it out in silence means someone comes back to a bag
// they did not leave, and the likeliest reading of that is that the site
// lost it. So what changed is reported alongside what survived.
function reconcileBag() {
  const empty = { lines: [], gone: [], reduced: [] };

  try {
    const stored = JSON.parse(localStorage.getItem(BAG_KEY));

    if (!Array.isArray(stored)) return empty;

    const lines = [];
    const gone = [];
    const reduced = [];

    for (const entry of stored) {
      const us = Number(entry?.us);
      const qty = Math.floor(Number(entry?.qty));
      const option = sizes.find((size) => size.us === us);

      // A size the catalogue no longer lists at all is not news anybody can
      // act on — there is nothing to point at and nothing to offer instead.
      if (!option || !(qty >= 1)) continue;

      if (option.left === 0) {
        gone.push(us);
        continue;
      }

      const kept = Math.min(qty, option.left);

      if (kept < qty) reduced.push({ us, from: qty, to: kept });

      lines.push({ us, qty: kept });
    }

    return { lines, gone, reduced };
  } catch (error) {
    return empty;
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

// One sentence about what the shelf did to the bag, or nothing at all. Sizes
// are named in whichever system is on screen, because a shopper reading in EU
// should not have to translate a warning about their own bag.
function joinList(items) {
  if (items.length <= 1) return items[0] || '';

  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function bagChangeText({ gone, reduced }, system) {
  const named = (us) => sizeName(sizes.find((size) => size.us === us), system);
  const parts = [];

  // Sold-out sizes share their verb. Two of them spelled out separately
  // reads as "US 10 sold out and US 12 sold out", which is a list pretending
  // to be a sentence.
  if (gone.length > 0) {
    parts.push(`${joinList(gone.map(named))} sold out`);
  }

  for (const { us, to } of reduced) {
    parts.push(`${named(us)} is down to ${to} pair${to === 1 ? '' : 's'}`);
  }

  if (parts.length === 0) return '';

  return `While you were away, ${joinList(parts)}. Your bag has been updated.`;
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

// A foot shorter or longer than this is a mistyped number rather than a
// foot — 18cm is a small child's and 34cm is past the end of the range
// anything on this page is cut for.
const MIN_FOOT_CM = 18;
const MAX_FOOT_CM = 34;

// The CM column is the length of foot each size is cut for, so a measured
// foot can be matched straight against it with no conversion in between.
//
// The first size at or above the measurement wins rather than the nearest
// one: a foot sitting between two sizes wants the larger. Half a size of
// room is a shoe that fits; half a size short is a shoe that is returned.
function recommendSize(centimetres) {
  if (!Number.isFinite(centimetres)) return null;
  if (centimetres < MIN_FOOT_CM || centimetres > MAX_FOOT_CM) return null;

  return sizes.find((option) => option.cm >= centimetres) || null;
}

// Most people's feet are not the same length, and the difference is commonly
// a half size or more. A shoe fitted to the shorter one is a shoe that hurts
// on the other foot, so where two measurements are given the longer is the
// one that decides — which is what a fitter in a shop does with a Brannock
// device and what nobody thinks to do at home with a ruler.
function plausibleFoot(centimetres) {
  return (
    Number.isFinite(centimetres) &&
    centimetres >= MIN_FOOT_CM &&
    centimetres <= MAX_FOOT_CM
  );
}

function longerFoot(left, right) {
  const measurements = [left, right].filter(Number.isFinite);

  return measurements.length > 0 ? Math.max(...measurements) : NaN;
}

// How much room is left over inside the recommended size. A foot 26.9cm long
// in a size cut for 27cm has a millimetre to play with; the same size on a
// 26.2cm foot is most of a size too big, and that is the pair that comes
// back. Neither is wrong - the shelf holds what it holds - but only one of
// them should be handed over without a word.
//
// Below this much slack the fit is simply the fit and there is nothing worth
// saying. Above it, the size below is worth naming so the choice is a choice.
const SNUG_CM = 0.2;
const ROOMY_CM = 0.45;

function fitNote(centimetres, option) {
  if (!option || !Number.isFinite(centimetres)) return null;

  const slack = option.cm - centimetres;

  if (slack <= SNUG_CM) return "snug";
  if (slack >= ROOMY_CM) return "roomy";

  return null;
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
  // Read once, on the first render, because it is a snapshot of how the bag
  // met the shelf at the moment this page opened — not something to redo
  // every time the component re-renders.
  const restored = useMemo(reconcileBag, []);
  const [bag, setBag] = useState(restored.lines);
  // Dismissible, and gone for good once dismissed: it describes something
  // that happened before the visit started, so it should not outlive being
  // read.
  const [bagNotice, setBagNotice] = useState(
    () => restored.gone.length > 0 || restored.reduced.length > 0
  );
  const [alerts, setAlerts] = useState(recallAlerts);
  const [asking, setAsking] = useState(null);
  const [emptied, setEmptied] = useState(null);
  const [foot, setFoot] = useState("");
  // Optional, and second. Asking for two numbers up front makes the simple
  // case look like paperwork; the field is there for the people who know
  // their feet differ and want it accounted for.
  const [otherFoot, setOtherFoot] = useState("");
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

  // Emptying the bag was one click and final. The lines are kept aside for a
  // few seconds instead, so a mis-click costs a click back rather than
  // picking every size over again.
  const emptyBag = () => {
    if (bag.length === 0) return;

    setEmptied(bag);
    setBag([]);
  };

  const undoEmpty = () => {
    if (!emptied) return;

    setBag(emptied);
    setEmptied(null);
  };

  useEffect(() => {
    if (!emptied) return;

    const timer = setTimeout(() => setEmptied(null), UNDO_SECONDS * 1000);

    return () => clearTimeout(timer);
  }, [emptied]);

  const askedSize = sizes.find((option) => option.us === asking);

  // A half-typed "2" is not a wrong answer yet, so nothing is said until the
  // number is at least plausibly a foot.
  const leftMeasured = Number(foot.replace(",", "."));
  const rightMeasured = otherFoot.trim() ? Number(otherFoot.replace(",", ".")) : NaN;
  const measured = longerFoot(
    foot.trim() ? leftMeasured : NaN,
    otherFoot.trim() ? rightMeasured : NaN
  );
  const suggestion = recommendSize(measured);
  const footTooBig = Number.isFinite(measured) && measured > MAX_FOOT_CM;
  // Only worth mentioning once both numbers are real. One field filled and
  // the other half-typed is not a pair of feet yet.
  // Both have to be plausible feet before they can be compared. Halfway
  // through typing the second number it reads as 2, and "your feet differ by
  // 24.5 cm" is not something to say to somebody mid-keystroke.
  const mismatched =
    plausibleFoot(leftMeasured) &&
    plausibleFoot(rightMeasured) &&
    Math.abs(leftMeasured - rightMeasured) >= 0.1;
  const fit = fitNote(measured, suggestion);

  // Signing up was a one-way door: once a size was being watched, tapping it
  // again only reopened a form that could not say "actually, don't".
  const dropAlert = (us) => {
    setAlerts((current) => current.filter((watched) => watched !== us));
    setAsking(null);
    setEmailError("");
  };

  // Tapping a sold-out size opens the request; tapping it again closes it,
  // so the same chip both asks and takes it back. A size already being
  // watched skips the form — there is nothing left to ask for, so the tap
  // goes straight to the one thing still worth doing with it.
  const handleGone = (us) => {
    if (alerts.includes(us)) {
      dropAlert(us);
      return;
    }

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

    // Starting a new bag is a decision about the old one: restoring it now
    // would silently swallow the pair just added.
    setEmptied(null);

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
                          ? `${name} — sold out, you'll be emailed when it's back. Tap to cancel`
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

            {/* Folded away by default. Most people know their size, and the
                ones who do not are the ones who go looking. */}
            <details className="fitter">
              <summary>Not sure? Measure your foot</summary>

              <p className="fitter-how">
                Stand on paper with your heel to a wall and mark your longest
                toe. Measure heel to mark, in centimetres.
              </p>

              <div className="fitter-fields">
                <label className="fitter-field">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min={MIN_FOOT_CM}
                    max={MAX_FOOT_CM}
                    placeholder="26.5"
                    value={foot}
                    onChange={(event) => setFoot(event.target.value)}
                    aria-label="Left foot length in centimetres"
                  />
                  <span>cm left</span>
                </label>

                {/* Left blank by anyone who does not care, and the answer is
                    the same as it ever was for them. */}
                <label className="fitter-field">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min={MIN_FOOT_CM}
                    max={MAX_FOOT_CM}
                    placeholder="optional"
                    value={otherFoot}
                    onChange={(event) => setOtherFoot(event.target.value)}
                    aria-label="Right foot length in centimetres, optional"
                  />
                  <span>cm right</span>
                </label>
              </div>

              <p className="fitter-result" aria-live="polite">
                {!foot.trim() && !otherFoot.trim()
                  ? "We'll match it to the closest size we cut."
                  : footTooBig
                  ? `We stop at ${sizes[sizes.length - 1].cm} cm — that's past our largest pair.`
                  : !suggestion
                  ? "That doesn't look like a foot measurement."
                  : suggestion.left === 0
                  ? `${sizeName(suggestion, system)} is your size — and it's sold out. Tap it to be told when it's back.`
                  : `${sizeName(suggestion, system)} is your size.`}
              </p>

              {/* Two feet of different lengths is the ordinary case, not a
                  problem to be flagged — so this says what was done about it
                  rather than warning anyone about their own body. */}
              {suggestion && mismatched && (
                <p className="fitter-aside">
                  Your feet differ by{" "}
                  {Math.abs(leftMeasured - rightMeasured).toFixed(1)} cm. We
                  have sized the longer one — a shoe fitted to the shorter foot
                  is the one that hurts.
                </p>
              )}

              {/* How the pair will actually sit, which the size number alone
                  does not say. Only at the edges: in the middle of a size the
                  fit is simply the fit. */}
              {suggestion && suggestion.left > 0 && fit === "snug" && (
                <p className="fitter-aside">
                  That is the tighter end of {sizeName(suggestion, system)}. If
                  you like room to move, take the next size up.
                </p>
              )}

              {suggestion && suggestion.left > 0 && fit === "roomy" && (
                <p className="fitter-aside">
                  {sizeName(suggestion, system)} will sit loose on you — it is
                  the smallest we cut that your foot fits into.
                </p>
              )}

              {suggestion && suggestion.left > 0 && (
                <button
                  type="button"
                  className="fitter-take"
                  onClick={() => setSize(suggestion.us)}
                  disabled={suggestion.us === size}
                >
                  {suggestion.us === size
                    ? "Selected"
                    : `Select ${sizeName(suggestion, system)}`}
                </button>
              )}
            </details>

            {/* Its own line rather than sharing the stock note — what is in
                stock now and what you are waiting on are two separate
                answers, and one should not hide the other. */}
            {alerts.length > 0 && (
              <p className="restock-note">
                We'll email you when{" "}
                {alerts.map((us, index) => {
                  const option = sizes.find((item) => item.us === us);

                  return (
                    <span key={us}>
                      {index > 0 && (index === alerts.length - 1 ? " and " : ", ")}
                      <button
                        type="button"
                        className="restock-drop"
                        onClick={() => dropAlert(us)}
                        title={`Stop watching ${sizeName(option, system)}`}
                        aria-label={`Stop watching ${sizeName(option, system)}`}
                      >
                        {sizeName(option, system)}
                      </button>
                    </span>
                  );
                })}{" "}
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

          {/* Above the bag rather than inside it. A bag whose every line sold
              out does not render at all, and that is exactly the case where
              somebody most needs telling what happened to it. */}
          {bagNotice && (
            <p className="bag-notice" role="status">
              {bagChangeText(restored, system)}
              <button
                type="button"
                className="bag-notice-dismiss"
                onClick={() => setBagNotice(false)}
                aria-label="Dismiss"
              >
                ×
              </button>
            </p>
          )}

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
                  onClick={emptyBag}
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

          {/* Outside the bag on purpose — by the time this shows there is no
              bag left to hang it off. */}
          {emptied && (
            <p className="bag-undo" role="status">
              Bag emptied.
              <button type="button" onClick={undoEmpty}>
                Undo
              </button>
            </p>
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
