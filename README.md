# Flyknit Racer: Shoes Landing Page

A product landing page for a running shoe, built with React and Vite.

## Features

- **Size picker in US, UK, EU and CM**, using real size charts instead of
  a formula. It remembers your size between visits.
- **Foot measurer**: enter the length of each foot and it suggests the
  size that fits the longer one.
- **Live stock**: sold-out sizes can't be bought, and low stock is called
  out.
- **Bag with undo**: the bag is saved between visits and reports any size
  that sold out while you were away.
- **Saved sizes and restock alerts**: set a size aside for later, or ask
  for an email when a sold-out size comes back.
- **Delivery estimate**: shows today's dispatch cut-off and the express
  and standard delivery dates, skipping weekends.
- **Shareable links** that carry the chosen size.
- **Search with history** in the navigation bar. Press `/` to jump to it.
- **Responsive layout** with a mobile menu.

## Getting started

```bash
git clone https://github.com/FarhanArshad80/Shoes-Landing-Page.git
cd Shoes-Landing-Page
npm install
npm run dev
```

## Scripts

| Command           | What it does                         |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the dev server with hot reload |
| `npm run build`   | Build for production into `dist/`    |
| `npm run preview` | Serve the production build locally   |
| `npm run lint`    | Run ESLint                           |
| `npm run deploy`  | Build and publish to GitHub Pages    |

## Tech stack

- React
- Vite
- ESLint
