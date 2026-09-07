import { useEffect, useRef, useState } from "react";

const links = ["Home", "About", "Services", "Location", "Contact Us"];

// The catalogue the search box looks through. Kept here alongside the nav
// until there is a real product API to ask.
const catalogue = [
  { name: "Flyknit Racer — Crimson", category: "Running", price: "$189" },
  { name: "Flyknit Racer — Onyx", category: "Running", price: "$189" },
  { name: "Trailbreak GTX", category: "Trail", price: "$215" },
  { name: "Court Classic Low", category: "Lifestyle", price: "$129" },
  { name: "Court Classic High", category: "Lifestyle", price: "$139" },
  { name: "Cloudstep Recovery Slide", category: "Recovery", price: "$65" },
  { name: "Marathon Elite Carbon", category: "Racing", price: "$249" },
  { name: "Studio Trainer", category: "Training", price: "$149" },
];

const MAX_RESULTS = 5;

// What was searched for last time. A shop gets visited more than once, and
// the pair someone looked at on Tuesday is very often the pair they came
// back for on Thursday - so an empty box is a question already answered.
const RECENT_KEY = "landing.recent-searches";
const MAX_RECENT = 4;

// Storage is refused in private windows and when site data is blocked, so
// every read stands on its own and an unusable one simply means no history.
function recallSearches() {
  try {
    const stored = JSON.parse(localStorage.getItem(RECENT_KEY));

    if (!Array.isArray(stored)) return [];

    return stored
      .filter((term) => typeof term === "string" && term.trim() !== "")
      .slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

function storeSearches(terms) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(terms));
  } catch {
    /* storage unavailable - the list still works, it just forgets */
  }
}

function searchCatalogue(term) {
  const query = term.trim().toLowerCase();

  if (!query) return [];

  return catalogue
    .filter(({ name, category }) =>
      `${name} ${category}`.toLowerCase().includes(query)
    )
    .slice(0, MAX_RESULTS);
}

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.4-3.4" />
  </svg>
);

const MenuIcon = ({ open }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" aria-hidden="true">
    {open ? (
      <path d="M6 6l12 12M18 6L6 18" />
    ) : (
      <path d="M4 8h16M4 16h16" />
    )}
  </svg>
);

const Nav = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeResult, setActiveResult] = useState(-1);
  const [recent, setRecent] = useState(recallSearches);
  const menuBtnRef = useRef(null);
  const searchRef = useRef(null);

  const trimmed = query.trim();
  const results = searchCatalogue(query);

  // An empty box used to open onto nothing. It now offers what was searched
  // for before, and the arrow keys walk that list exactly as they walk the
  // results - one panel, one set of keys, whichever of the two is showing.
  const showingRecent = trimmed === "" && recent.length > 0;
  const options = showingRecent ? recent : results;
  const panelOpen = searchOpen && (showingRecent || trimmed !== "");

  // Tighten the header once the page moves away from the top
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Escape closes the open menu and hands focus back to the toggle, so
  // keyboard users are not left stranded inside a panel they cannot dismiss.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;

      setOpen(false);
      menuBtnRef.current?.focus();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // A results panel that stays open after the pointer has moved on reads as
  // a stuck overlay, so a click anywhere else dismisses it.
  useEffect(() => {
    if (!searchOpen) return;

    const onPointerDown = (event) => {
      if (!searchRef.current?.contains(event.target)) {
        setSearchOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);

    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [searchOpen]);

  const handleSearchChange = (event) => {
    setQuery(event.target.value);
    setSearchOpen(true);
    setActiveResult(-1);
  };

  // Newest first and no duplicates: searching the same pair twice should
  // move it up the list rather than take a second slot in a list of four.
  const rememberSearch = (term) => {
    setRecent((current) => {
      const next = [
        term,
        ...current.filter((seen) => seen.toLowerCase() !== term.toLowerCase()),
      ].slice(0, MAX_RECENT);

      storeSearches(next);

      return next;
    });
  };

  const forgetSearch = (term) => {
    setRecent((current) => {
      const next = current.filter((seen) => seen !== term);

      storeSearches(next);

      return next;
    });
  };

  const selectResult = (product) => {
    if (!product) return;

    rememberSearch(product.name);
    setQuery(product.name);
    setSearchOpen(false);
    setActiveResult(-1);
  };

  // Picking a past search puts the term back in the box and leaves the panel
  // up, because the point of choosing it is to see what it matches.
  const applyRecent = (term) => {
    if (!term) return;

    setQuery(term);
    setSearchOpen(true);
    setActiveResult(-1);
  };

  // Arrow keys walk the list, Enter takes the highlighted pair, Escape backs
  // out one step at a time — panel first, then the term itself.
  const handleSearchKeyDown = (event) => {
    if (event.key === "Escape") {
      event.stopPropagation();

      if (searchOpen) {
        setSearchOpen(false);
      } else {
        setQuery("");
      }

      return;
    }

    if (!options.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSearchOpen(true);
      setActiveResult((i) => (i + 1) % options.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSearchOpen(true);
      setActiveResult((i) => (i <= 0 ? options.length - 1 : i - 1));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      const chosen = options[activeResult] || options[0];

      if (showingRecent) applyRecent(chosen);
      else selectResult(chosen);
    }
  };

  return (
    <header className={scrolled ? "site-header is-scrolled" : "site-header"}>
      <nav className="navbar">
        <a className="logo" href="#" aria-label="Home">
          <img src="/logo-mark.png" alt="Logo" />
        </a>

        <ul
          className={open ? "nav-links is-open" : "nav-links"}
          onClick={() => setOpen(false)}
        >
          {links.map((label) => (
            <li key={label}>
              <a href="#">{label}</a>
            </li>
          ))}
        </ul>

        <div className="nav-actions">
          <div className="search-wrap" ref={searchRef}>
            <label className="search-field">
              <SearchIcon />
              <input
                type="search"
                placeholder="Search"
                className="search-input"
                aria-label="Search products"
                role="combobox"
                aria-expanded={panelOpen}
                aria-controls="search-results"
                aria-autocomplete="list"
                aria-activedescendant={
                  activeResult >= 0 ? `search-result-${activeResult}` : undefined
                }
                value={query}
                onChange={handleSearchChange}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={handleSearchKeyDown}
              />
            </label>

            {panelOpen && (
              <ul className="search-results" id="search-results" role="listbox">
                {showingRecent ? (
                  <>
                    <li className="search-recent-head" role="presentation">
                      Recent searches
                    </li>

                    {recent.map((term, i) => (
                      <li key={term} className="search-recent-row">
                        <button
                          type="button"
                          id={`search-result-${i}`}
                          role="option"
                          aria-selected={i === activeResult}
                          className={
                            i === activeResult
                              ? "search-result is-active"
                              : "search-result"
                          }
                          onMouseEnter={() => setActiveResult(i)}
                          onClick={() => applyRecent(term)}
                        >
                          <span className="search-result-name">{term}</span>
                        </button>

                        {/* Its own button rather than a handler on the row,
                            so it can be tabbed to, it says which term it
                            drops, and a click on it never falls through to
                            the search underneath. */}
                        <button
                          type="button"
                          className="search-recent-remove"
                          onClick={() => forgetSearch(term)}
                          aria-label={`Remove ${term} from recent searches`}
                          title={`Remove ${term}`}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </>
                ) : results.length === 0 ? (
                  <li className="search-empty">
                    No pairs match “{query.trim()}”
                  </li>
                ) : (
                  results.map((product, i) => (
                    <li key={product.name}>
                      <button
                        type="button"
                        id={`search-result-${i}`}
                        role="option"
                        aria-selected={i === activeResult}
                        className={
                          i === activeResult
                            ? "search-result is-active"
                            : "search-result"
                        }
                        onMouseEnter={() => setActiveResult(i)}
                        onClick={() => selectResult(product)}
                      >
                        <span className="search-result-name">{product.name}</span>
                        <span className="search-result-meta">
                          {product.category} · {product.price}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>

          <button className="login-btn">Login</button>

          <button
            className="menu-btn"
            ref={menuBtnRef}
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            <MenuIcon open={open} />
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Nav;
