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
// The size picked last time. A person has one shoe size, and the system it
// is written in was already remembered — asking them to find the same chip
// again on every visit was the half of that job left undone.
const SIZE_KEY = "landing.size";
const BAG_KEY = "landing.bag";
// Sizes set aside rather than given up on. Kept apart from the bag because
// they are answers to different questions — the bag is what is being bought,
// this is what is still being thought about — and mixing them would make the
// subtotal quote a number nobody agreed to.
const SAVED_KEY = "landing.saved";
const ALERTS_KEY = "landing.restock-alerts";
// The address the alerts go to. Kept apart from the list of sizes because it
// belongs to the person rather than to any one size: watching a second size
// is not a second decision about where to be emailed.
const EMAIL_KEY = "landing.restock-email";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOW_STOCK_AT = 2;
// How long the bag as it was is held before it is really gone. Long enough
// to notice the mistake and reach for the button, short enough that the
// banner is not still sitting there once the page has moved on.
const UNDO_SECONDS = 8;
const PRICE = 189;
const FREE_SHIPPING_AT = 150;

// When the warehouse stops packing for the day, in the shopper's own clock —
// which is a simplification, and the honest one for a page that does not
// know where they are. It is local either way to the only person reading it.
const DISPATCH_HOUR = 16;
// Working days from dispatch, express and standard. Two numbers rather than
// one, because "free express shipping" is offered a few lines above and a
// single estimate would quietly quote the wrong one.
const EXPRESS_DAYS = 2;
const STANDARD_DAYS = 5;
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Whether today's orders still make today's van.
function packsToday(now = new Date()) {
  const day = now.getDay();

  // Nobody packs at the weekend, so a Saturday order is Monday's work
  // however early it is placed.
  if (day === 0 || day === 6) return false;

  return now.getHours() < DISPATCH_HOUR;
}

// How long is left to get in today's van, said the way somebody would say it
// out loud. Under an hour it becomes minutes, because "in 0 hours" is not a
// deadline and the last hour is the one that actually hurries anybody.
function timeLeftToPack(now = new Date()) {
  const minutes = (DISPATCH_HOUR - now.getHours()) * 60 - now.getMinutes();

  if (minutes <= 0) return '';
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`;
}

// A date that many working days after dispatch. Weekends are skipped rather
// than counted, which is what "working days" means and what nobody wants to
// work out from a delivery promise themselves.
function workingDaysFrom(start, count) {
  const date = new Date(start);
  let left = count;

  while (left > 0) {
    date.setDate(date.getDate() + 1);

    if (date.getDay() !== 0 && date.getDay() !== 6) left -= 1;
  }

  return date;
}

// "Thursday 24 Sep". No year: nothing here is ever more than a fortnight
// out, and a year on a delivery date reads like a warning.
function deliveryText(now, days) {
  const from = new Date(now);

  // Missed today's van, so the clock starts on the next day anything is
  // packed at all.
  if (!packsToday(now)) {
    do {
      from.setDate(from.getDate() + 1);
    } while (from.getDay() === 0 || from.getDay() === 6);
  }

  const date = workingDaysFrom(from, days);

  return `${DAY_NAMES[date.getDay()]} ${date.getDate()} ${
    ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()]
  }`;
}

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

// The size named in the address, if there is one this shelf actually holds.
//
// "Have a look at these" is the most natural thing anybody sends from a
// product page, and until now the link carried the shoe but not the size —
// so the recipient landed on whichever size the sender's own browser
// happened to remember about them, which is a strange thing for a link to
// say.
//
// Always US, whatever the sender was reading in. It is the system the bag
// and the alerts are already keyed on, and it means a link sent from Berlin
// opens correctly for somebody who reads in UK.
const SIZE_PARAM = "size";

function sizeFromUrl() {
  try {
    const asked = Number(new URLSearchParams(window.location.search).get(SIZE_PARAM));

    return sizes.some((option) => option.us === asked) ? asked : null;
  } catch (error) {
    return null;
  }
}

// Writes the selected size into the address so the link in the bar is always
// the link worth sending. replaceState rather than pushState: trying on four
// sizes is one visit to one page, not four entries to press Back through.
function rememberSizeInUrl(us) {
  try {
    const url = new URL(window.location.href);

    if (us) url.searchParams.set(SIZE_PARAM, String(us));
    else url.searchParams.delete(SIZE_PARAM);

    window.history.replaceState(null, "", url.toString());
  } catch (error) {
    /* history unavailable — the page still works, the link is just plainer */
  }
}

// A bag written by another tab, read back the same way the stored one is.
//
// Two tabs open on the same shop is not an unusual way to shop — one for the
// pair, one for the review somebody was reading about it — and until now the
// second tab was quietly destructive. Each holds its own copy of the bag in
// memory and writes the whole thing out on every change, so adding US 9 in
// one tab and then US 10 in the other left a bag holding only US 10: the
// second tab never knew about the first one's pair and overwrote it.
//
// Ids and quantities only, like everything else stored here. Prices and
// stock are read from the shelf at render time, so a bag arriving from
// another tab cannot bring old numbers with it.
function readStoredBag(raw) {
  try {
    const stored = JSON.parse(raw);

    if (!Array.isArray(stored)) return [];

    const lines = [];

    for (const entry of stored) {
      const us = Number(entry?.us);
      const qty = Math.floor(Number(entry?.qty));
      const option = sizes.find((size) => size.us === us);

      // A size that has sold out since the other tab wrote it drops out
      // rather than becoming a line of nothing. The reconciliation on load
      // says so out loud because it is news about a bag left overnight;
      // here it is the shelf agreeing with itself between two windows open
      // at the same moment, and there is nothing to announce.
      if (!option || option.left === 0 || !(qty >= 1)) continue;

      lines.push({ us, qty: Math.min(qty, option.left) });
    }

    return lines;
  } catch (error) {
    return [];
  }
}

// Whether two bags say the same thing. Compared rather than simply adopted,
// so a tab that hears its own change echoed back does not re-render and
// re-write it — which is what turns two synchronised tabs into two tabs
// writing to each other for ever.
function sameBag(left, right) {
  return (
    left.length === right.length &&
    left.every((line, index) => line.us === right[index].us && line.qty === right[index].qty)
  );
}

// The sizes set aside for later, read back the same way the bag is: ids and
// quantities, with prices and stock left to the shelf.
//
// Unlike the bag, a size that has sold out stays on this list. The bag is a
// promise the shop cannot keep for a pair it does not have, so the line has
// to go and be accounted for. Setting something aside is not a promise — it
// is a note that this was interesting — and a note about a size that has
// since gone is worth more than one about a size still sitting there, because
// it is the one that now needs a restock alert rather than a decision.
function recallSaved() {
  try {
    const stored = JSON.parse(localStorage.getItem(SAVED_KEY));

    if (!Array.isArray(stored)) return [];

    const lines = [];

    for (const entry of stored) {
      const us = Number(entry?.us);
      const qty = Math.floor(Number(entry?.qty));
      const option = sizes.find((size) => size.us === us);

      // A size the catalogue no longer lists at all has nothing to point at.
      if (!option || !(qty >= 1)) continue;

      lines.push({ us, qty });
    }

    return lines;
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

// Only a size that is still on the shelf comes back selected. Preselecting a
// sold-out size would open the page on a disabled Add button, which reads as
// the page being broken rather than the size being gone.
function recallSize() {
  // A link naming a size outranks the one this browser remembers, and is
  // honoured even when the shelf has since emptied.
  //
  // The rule below — never preselect a sold-out size — is about a guess the
  // page is making about you, where opening on a disabled Add button reads
  // as the page being broken. A link is not a guess: somebody asked for that
  // size specifically, and the page has a real answer for it, which is that
  // it is gone and here is where to be told when it is back. Quietly opening
  // on a different size would tell the recipient that the other one was what
  // was sent.
  const asked = sizeFromUrl();

  if (asked !== null) return asked;

  try {
    const stored = Number(localStorage.getItem(SIZE_KEY));
    const option = sizes.find((item) => item.us === stored);

    return option && option.left > 0 ? option.us : null;
  } catch (error) {
    return null;
  }
}

// Where those alerts should go. Validated on the way back out: a value left
// by an older build, or edited by hand, should leave the field empty rather
// than prefilling something that will be rejected the moment it is sent.
function recallEmail() {
  try {
    const stored = localStorage.getItem(EMAIL_KEY);

    return typeof stored === "string" && EMAIL_RE.test(stored) ? stored : "";
  } catch (error) {
    return "";
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
  const [size, setSize] = useState(recallSize);
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
  const [saved, setSaved] = useState(recallSaved);
  const [alerts, setAlerts] = useState(recallAlerts);
  const [asking, setAsking] = useState(null);
  // The bag as it was, plus what was done to it. One record rather than one
  // per kind of removal: whichever way a size left the bag, putting it back
  // means the same thing, and two banners that can both be on screen at once
  // would only disagree about which mistake is being offered back.
  const [undo, setUndo] = useState(null);
  // "Copied" is a confirmation, not a state worth keeping — it clears itself
  // a moment later.
  const [copiedLink, setCopiedLink] = useState(false);
  const [foot, setFoot] = useState("");
  // Optional, and second. Asking for two numbers up front makes the simple
  // case look like paperwork; the field is there for the people who know
  // their feet differ and want it accounted for.
  const [otherFoot, setOtherFoot] = useState("");
  // Prefilled from the last request. Asking a shopper to type the same
  // address again for every sold-out size is the kind of friction that makes
  // the second alert not worth the trouble of asking for.
  const [email, setEmail] = useState(recallEmail);
  const [emailError, setEmailError] = useState("");
  // The address the standing alerts are actually filed against, as opposed to
  // whatever is currently in the box. They are the same thing until somebody
  // starts editing, and the note has to keep naming the real one while they
  // do.
  const [alertEmail, setAlertEmail] = useState(recallEmail);
  // Open when the shopper is changing where the alerts go, rather than asking
  // for a new one. Same form, same validation, different question.
  const [editingEmail, setEditingEmail] = useState(false);

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

  // The header is a sibling of this component and has no way to ask what is
  // in the bag, so the bag says so instead. An event rather than lifted
  // state or a context: the count is the only thing outside this component
  // has any business knowing, and everything that decides it — the shelf,
  // the reconciliation, the undo — stays here where it already is.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("bag:count", { detail: bagCount }));
  }, [bagCount]);

  useEffect(() => {
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
    } catch (error) {
      /* storage unavailable — the shortlist just will not survive a reload */
    }
  }, [saved]);

  useEffect(() => {
    try {
      localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
    } catch (error) {
      /* storage unavailable — the request just will not be remembered here */
    }
  }, [alerts]);

  // Out of the bag and onto the list. The quantity travels with it, because
  // somebody who put two in the bag was thinking about two.
  const saveForLater = (us) => {
    const line = bag.find((entry) => entry.us === us);

    if (!line) return;

    setSaved((current) => {
      const already = current.find((entry) => entry.us === us);

      // Setting the same size aside twice is one decision, not two lines.
      return already
        ? current.map((entry) =>
            entry.us === us ? { ...entry, qty: entry.qty + line.qty } : entry
          )
        : [...current, { us, qty: line.qty }];
    });

    // Dropped straight rather than through setQuantity, which now treats
    // reaching nothing as something to offer back. Nothing was lost here —
    // the size is on the page, one section down — and a banner saying it
    // could be undone would be describing a mistake nobody made.
    changeBag((current) => current.filter((entry) => entry.us !== us));
  };

  const forgetSaved = (us) => {
    setSaved((current) => current.filter((entry) => entry.us !== us));
  };

  // And back again, against the shelf as it stands now rather than as it
  // stood when the size was set aside. A pair saved last week may have three
  // left today and two of them already in the bag.
  const moveToBag = (us) => {
    const option = sizes.find((item) => item.us === us);
    const line = saved.find((entry) => entry.us === us);

    if (!option || !line || option.left === 0) return;

    changeBag((current) => {
      const already = current.find((entry) => entry.us === us);
      const wanted = (already?.qty || 0) + line.qty;
      const capped = Math.min(wanted, option.left);

      return already
        ? current.map((entry) => (entry.us === us ? { ...entry, qty: capped } : entry))
        : [...current, { us, qty: capped }];
    });

    forgetSaved(us);
  };

  // Emptying the bag was one click and final. The lines are kept aside for a
  // few seconds instead, so a mis-click costs a click back rather than
  // picking every size over again.
  const emptyBag = () => {
    if (bag.length === 0) return;

    setUndo({ lines: bag, text: "Bag emptied." });
    setBag([]);
  };

  const undoRemoval = () => {
    if (!undo) return;

    setBag(undo.lines);
    setUndo(null);
  };

  useEffect(() => {
    if (!undo) return;

    const timer = setTimeout(() => setUndo(null), UNDO_SECONDS * 1000);

    return () => clearTimeout(timer);
  }, [undo]);

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
    setEditingEmail(false);
    setEmailError("");
  };

  const rememberEmail = (address) => {
    setAlertEmail(address);

    try {
      localStorage.setItem(EMAIL_KEY, address);
    } catch (error) {
      /* storage unavailable — it just has to be typed again next visit */
    }
  };

  const submitAlert = (event) => {
    event.preventDefault();

    const address = email.trim();

    if (!EMAIL_RE.test(address)) {
      setEmailError("That doesn't look like an email address.");
      return;
    }

    rememberEmail(address);
    setEmail(address);

    // Nothing is posted anywhere yet — this is the shape the request takes
    // once there is a backend to take it.
    //
    // Changing the address is not a request for another size: every alert
    // already standing moves to the new one, which is the whole reason the
    // address is held apart from the list.
    if (!editingEmail) {
      setAlerts((current) =>
        current.includes(asking) ? current : [...current, asking]
      );
    }

    setAsking(null);
    setEditingEmail(false);
    setEmailError("");
  };

  const startEditingEmail = () => {
    setAsking(null);
    setEmail(alertEmail);
    setEmailError("");
    setEditingEmail(true);
  };

  // Every change to the bag that is not itself a removal goes through here.
  // A pending undo describes the bag as it stood before one particular
  // mistake; the moment anything else is added, moved or counted, putting
  // that bag back would throw away the newer work instead of the mistake.
  const changeBag = (update) => {
    setUndo(null);
    setBag(update);
  };

  const setQuantity = (us, next) => {
    const option = sizes.find((item) => item.us === us);
    const capped = Math.min(Math.max(next, 0), option ? option.left : 0);

    // Dropping to nothing is a removal however it was reached — the cross,
    // or the minus pressed once more than intended — and both lose a size
    // that took a decision to pick. The bag is kept as it stood, so the line
    // comes back where it was rather than on the end.
    if (capped === 0) {
      setUndo({ lines: bag, text: `${sizeName(option, system)} removed.` });
    }

    if (capped === 0) {
      setBag((current) => current.filter((line) => line.us !== us));
      return;
    }

    changeBag((current) =>
      current.map((line) => (line.us === us ? { ...line, qty: capped } : line))
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

  // Ten sizes is ten Tab presses to get past, and twenty to get from the
  // first to the last and back. Arrow keys move along the row the way they
  // do in any toolbar, with Home and End for the ends.
  //
  // Focus moves; selection does not. Landing on a size is not choosing it -
  // somebody reading the row by keyboard should be able to hear "US 9, 1
  // left" without that becoming what goes in the bag.
  const moveAlongSizes = (event) => {
    const chips = Array.from(event.currentTarget.querySelectorAll(".size-chip"));
    const at = chips.indexOf(document.activeElement);

    if (at === -1) return;

    const next = {
      ArrowRight: Math.min(at + 1, chips.length - 1),
      ArrowDown: Math.min(at + 1, chips.length - 1),
      ArrowLeft: Math.max(at - 1, 0),
      ArrowUp: Math.max(at - 1, 0),
      Home: 0,
      End: chips.length - 1,
    }[event.key];

    if (next === undefined) return;

    // The page would otherwise scroll on the up and down arrows.
    event.preventDefault();
    chips[next].focus();
  };

  useEffect(() => {
    if (!copiedLink) return undefined;

    const timer = setTimeout(() => setCopiedLink(false), 2000);

    return () => clearTimeout(timer);
  }, [copiedLink]);

  // The clipboard can be refused outright — an insecure context, a denied
  // permission. The link is in the address bar either way, so that case hands
  // it over to be copied by hand rather than reporting a failure.
  const copySizeLink = async () => {
    const link = window.location.href;

    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(true);
    } catch (error) {
      window.prompt("Copy this link:", link);
    }
  };

  // Written whenever a size is chosen and never cleared: stepping away from
  // the row is not a change of foot.
  useEffect(() => {
    if (size === null) return;

    try {
      localStorage.setItem(SIZE_KEY, String(size));
    } catch (error) {
      /* storage unavailable — the size just has to be picked again next time */
    }
  }, [size]);

  // What the other tabs are doing.
  //
  // `storage` only fires in the tabs that did not write, which is exactly
  // the set that needs telling. Adopting the stored value rather than
  // merging it is right because the tab that wrote it had already adopted
  // everything before it — the last write is the whole bag as it stood a
  // moment ago, not one tab's half of it.
  //
  // Nothing is announced. The change came from the same person seconds ago
  // in a window they can see, and the bag panel shows its own contents; a
  // banner explaining somebody's own click back to them is noise.
  useEffect(() => {
    const onStorage = (event) => {
      // A null key means storage was cleared wholesale, which is not
      // something this page asked for and not something it should act on.
      if (event.key === null) return;

      if (event.key === BAG_KEY) {
        // A removed key is an empty bag, not a reason to keep the old one.
        const next = event.newValue === null ? [] : readStoredBag(event.newValue);

        setBag((current) => (sameBag(current, next) ? current : next));
        // Not through changeBag, which is for this tab's own edits. The
        // pending undo describes a bag another tab has since replaced, and
        // restoring it would put this window's older idea of the bag back
        // over their work.
        setUndo(null);
        return;
      }

      // The set-aside list has exactly the bag's problem — one list, two
      // tabs, each writing it out whole — so it takes the same fix. Read
      // back through its own loader rather than the bag's, because this list
      // is allowed to hold sold-out sizes and the bag's is not.
      if (event.key === SAVED_KEY) {
        const next =
          event.newValue === null
            ? []
            : (() => {
                try {
                  const stored = JSON.parse(event.newValue);

                  if (!Array.isArray(stored)) return [];

                  return stored
                    .map((entry) => ({
                      us: Number(entry?.us),
                      qty: Math.floor(Number(entry?.qty)),
                    }))
                    .filter(
                      (entry) =>
                        entry.qty >= 1 &&
                        sizes.some((size) => size.us === entry.us)
                    );
                } catch (error) {
                  return [];
                }
              })();

        // Same structural check the bag uses — these lists are the same
        // shape — so a tab hearing its own write echoed back does not
        // re-render and write it out again.
        setSaved((current) => (sameBag(current, next) ? current : next));
        return;
      }

      // The standing restock requests have the same problem and the same
      // fix: one list, held in two places, written out whole.
      if (event.key === ALERTS_KEY) {
        const next =
          event.newValue === null
            ? []
            : (() => {
                try {
                  const stored = JSON.parse(event.newValue);

                  return Array.isArray(stored)
                    ? stored.map(Number).filter(Number.isFinite)
                    : [];
                } catch (error) {
                  return [];
                }
              })();

        setAlerts((current) =>
          current.length === next.length && current.every((us, i) => us === next[i])
            ? current
            : next
        );
      }
    };

    window.addEventListener("storage", onStorage);

    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // And into the address, so the link in the bar is always the link worth
  // sending. Runs on the opening size too, which is what makes a page opened
  // from a remembered size shareable without touching anything.
  useEffect(() => {
    rememberSizeInUrl(size);
  }, [size]);

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

    changeBag((current) =>
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

              {/* Beside the systems rather than down by the bag: what is
                  being sent is this pair in this size, and this is the row
                  where the size is chosen. Only once one is picked — a link
                  to no size in particular is the page's own address, which
                  anybody can already copy from the bar. */}
              {size !== null && (
                <button
                  type="button"
                  className="size-share"
                  onClick={copySizeLink}
                  title={`Copy a link to ${sizeName(selected, system)}`}
                >
                  {copiedLink ? "Copied" : "Share"}
                </button>
              )}
            </legend>

            <div className="size-row" onKeyDown={moveAlongSizes}>
              {sizes.map((option) => {
                const { us, left } = option;
                const soldOut = left === 0;
                const watching = alerts.includes(us);
                const name = sizeName(option, system);
                // How many of this size are already in the bag. The row is
                // where sizes are chosen and the bag is further down the
                // page, so picking a second size used to mean scrolling down
                // to check which one was already in there — or, more often,
                // not checking and adding the same pair twice.
                const bagged = bag.find((line) => line.us === us)?.qty || 0;

                return (
                  <button
                    key={us}
                    type="button"
                    className={`size-chip${us === size ? " is-selected" : ""}${
                      soldOut ? " is-gone" : ""
                    }${watching ? " is-watched" : ""}${
                      bagged > 0 ? " is-bagged" : ""
                    }${
                      asking === us ? " is-asking" : ""
                    }`}
                    onClick={() => (soldOut ? handleGone(us) : setSize(us))}
                    aria-pressed={soldOut ? asking === us : us === size}
                    aria-label={
                      soldOut
                        ? watching
                          ? `${name} — sold out, you'll be emailed when it's back. Tap to cancel`
                          : `${name} — sold out, ask to be told when it's back`
                        : bagged > 0
                        ? `${name} — ${left} left, ${bagged} in your bag`
                        : `${name} — ${left} left`
                    }
                  >
                    {sizeValue(option, system)}
                    {bagged > 0 && (
                      <span className="size-chip-bagged" aria-hidden="true">
                        {bagged}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {(askedSize || editingEmail) && (
              <form className="restock" onSubmit={submitAlert}>
                <label htmlFor="restock-email">
                  {editingEmail
                    ? "Where should we send it?"
                    : `${sizeName(askedSize, system)} is gone. Tell you when it's back?`}
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
                  <button type="submit">
                    {editingEmail ? "Use this address" : "Notify me"}
                  </button>
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

            {/* Every system at once, which is the one thing the row of chips
                above cannot show: it speaks whichever was last chosen, so
                somebody who knows their size in EU and is buying from a page
                set to US had to flip the toggle and compare chips one at a
                time to read across.

                The columns already exist — each size carries its UK, EU and
                CM equivalents, written out rather than derived, because the
                jumps are not even. This lays them side by side. */}
            <details className="size-chart">
              <summary>Size chart · read across the systems</summary>

              <table>
                <thead>
                  <tr>
                    {systems.map((id) => (
                      <th key={id} scope="col">{id}</th>
                    ))}
                    <th scope="col">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {sizes.map((option) => {
                    const soldOut = option.left === 0;
                    const name = sizeName(option, system);

                    return (
                      <tr
                        key={option.us}
                        className={`${option.us === size ? "is-selected" : ""}${
                          soldOut ? " is-gone" : ""
                        }`}
                      >
                        {systems.map((id) => (
                          <td key={id}>{sizeValue(option, id)}</td>
                        ))}
                        <td>
                          {/* The same two answers the chips give, in the
                              same words — a row that could be tapped to
                              watch a sold-out size would be a second place
                              to manage alerts, and one of them would end up
                              disagreeing with the other. */}
                          {soldOut ? (
                            <span className="chart-gone">Sold out</span>
                          ) : (
                            <button
                              type="button"
                              className="chart-take"
                              onClick={() => setSize(option.us)}
                              disabled={option.us === size}
                              aria-label={
                                option.us === size
                                  ? `${name} is selected`
                                  : `Select ${name}`
                              }
                            >
                              {option.us === size ? "Selected" : "Select"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </details>

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
                {alerts.length > 1 ? "are" : "is"} back
                {alertEmail ? (
                  <>
                    {" at "}
                    <button
                      type="button"
                      className="restock-address"
                      onClick={startEditingEmail}
                      title="Send these somewhere else"
                    >
                      {alertEmail}
                    </button>
                  </>
                ) : (
                  ""
                )}
                .
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
            <section className="bag" id="bag" aria-label="Your bag">
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

                      {/* Between keeping it and losing it. Taking a size out
                          of the bag was the only way to stop it counting
                          toward the total, and it threw the decision away
                          with the line. */}
                      <button
                        type="button"
                        className="bag-save"
                        onClick={() => saveForLater(line.us)}
                        aria-label={`Save ${name} for later`}
                      >
                        Save
                      </button>

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

                {/* What the line above is actually promising. "Free express
                    shipping" is a price, not a date, and the date is the half
                    anybody buying shoes for an occasion needs. It follows the
                    subtotal, so crossing the threshold changes the day it
                    names rather than only the words. */}
                <span className="bag-delivery">
                  {(() => {
                    // Read as the bag renders rather than held in state and
                    // ticked down. It only has to be right at the moment
                    // somebody is reading it, and a live countdown in a
                    // shopping bag is a pressure tactic, not information.
                    const now = new Date();
                    const express = subtotal >= FREE_SHIPPING_AT;
                    const arrives = deliveryText(now, express ? EXPRESS_DAYS : STANDARD_DAYS);
                    const left = packsToday(now) ? timeLeftToPack(now) : '';

                    return left
                      ? `Order in the next ${left} and it arrives by ${arrives}`
                      : `Arrives by ${arrives}`;
                  })()}
                </span>
              </footer>
            </section>
          )}

          {/* Outside the bag on purpose. An emptied bag leaves nothing to
              hang this off, and a removed line leaves a bag that is about to
              be rearranged under it. Below both, it stays in one place. */}
          {undo && (
            <p className="bag-undo" role="status">
              {undo.text}
              <button type="button" onClick={undoRemoval}>
                Undo
              </button>
            </p>
          )}

          {/* Below the bag, and outside it: these are not being bought. The
              subtotal above must go on meaning what it says. */}
          {saved.length > 0 && (
            <section className="saved" aria-label="Saved for later">
              <header className="saved-head">
                <h2>
                  Saved for later
                  <span className="saved-count">{saved.length}</span>
                </h2>
              </header>

              <ul className="saved-lines">
                {saved.map((line) => {
                  const option = sizes.find((item) => item.us === line.us);
                  const name = sizeName(option, system);
                  const soldOut = option.left === 0;
                  const watching = alerts.includes(line.us);

                  return (
                    <li className="saved-line" key={line.us}>
                      <span className="saved-size">
                        {name}
                        {line.qty > 1 && (
                          <span className="saved-qty">&times;{line.qty}</span>
                        )}
                      </span>

                      {/* A size that went while it was set aside is the whole
                          reason this list keeps sold-out pairs. There is
                          nothing to move to the bag, but there is still the
                          one thing worth doing with it. */}
                      {soldOut ? (
                        <button
                          type="button"
                          className="saved-watch"
                          onClick={() => handleGone(line.us)}
                          aria-label={
                            watching
                              ? `Stop watching ${name}`
                              : `Email me when ${name} is back`
                          }
                        >
                          {watching ? "Watching" : "Sold out — tell me"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="saved-restore"
                          onClick={() => moveToBag(line.us)}
                          aria-label={`Move ${name} back to your bag`}
                        >
                          Move to bag
                        </button>
                      )}

                      <button
                        type="button"
                        className="saved-remove"
                        onClick={() => forgetSaved(line.us)}
                        aria-label={`Remove ${name} from saved`}
                      >
                        &times;
                      </button>
                    </li>
                  );
                })}
              </ul>
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
