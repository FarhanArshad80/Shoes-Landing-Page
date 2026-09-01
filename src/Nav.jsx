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
  const menuBtnRef = useRef(null);
  const searchRef = useRef(null);

  const results = searchCatalogue(query);

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

  const selectResult = (product) => {
    if (!product) return;

    setQuery(product.name);
    setSearchOpen(false);
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

    if (!results.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSearchOpen(true);
      setActiveResult((i) => (i + 1) % results.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setSearchOpen(true);
      setActiveResult((i) => (i <= 0 ? results.length - 1 : i - 1));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      selectResult(results[activeResult] || results[0]);
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
                aria-expanded={searchOpen && query.trim() !== ""}
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

            {searchOpen && query.trim() !== "" && (
              <ul className="search-results" id="search-results" role="listbox">
                {results.length === 0 ? (
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
