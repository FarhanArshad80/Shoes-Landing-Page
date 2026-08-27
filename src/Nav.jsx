import { useState } from "react";

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

  return (
    <header className="site-header">
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
