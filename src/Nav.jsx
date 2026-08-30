import { useEffect, useRef, useState } from "react";

const links = ["Home", "About", "Services", "Location", "Contact Us"];

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
  const menuBtnRef = useRef(null);

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
          <label className="search-field">
            <SearchIcon />
            <input
              type="search"
              placeholder="Search"
              className="search-input"
              aria-label="Search products"
            />
          </label>

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
