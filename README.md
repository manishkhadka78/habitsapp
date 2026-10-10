# Austral Labs: research peptide storefront

A dependency-free e-commerce storefront (plain HTML, CSS and JavaScript) styled
after Australian research-peptide suppliers: a clinical navy/blue look, purity and
COA badges, mg size variants, AUD pricing with GST included, and research-use-only messaging.

"Austral Labs" is a **placeholder brand**. Change it in `js/products.js` (`STORE.name`)
and the page title in `index.html`.

## Features

- **Home page**: announcement bar, hero, trust strip, categories, best sellers,
  lab-testing / sample COA section, how ordering works, and an FAQ
- **Research-use-only gate** on first visit (18+ and research confirmation)
- **Shop**: category filters, live search, sorting
- **Product pages**: size variants with per-size price and stock, purity badge, spec table
- **Cart**: per-variant lines, quantity controls, free-shipping progress bar, GST shown;
  saved in `localStorage` and synced across tabs
- **Checkout**: AU address (state + 4-digit postcode), AU mobile validation, Standard/Express
  shipping, card **or** PayID/bank transfer, and a required RUO acknowledgement
- **Order confirmation**, with payment instructions for bank transfer orders
- Responsive, with automatic dark mode

> Front-end demo only: **no real payments are processed**. Test card: `4242 4242 4242 4242`.

## Run it

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Project structure

```
index.html        Page shell: announcement bar, header, footer, RUO gate
css/styles.css    All styles (colour tokens at the top)
js/products.js    Store settings (name, shipping, GST) and the product catalog
js/app.js         Router, cart, checkout and all views
```

## Editing products

Each product in `js/products.js` has an `id`, `name`, optional short vial `label`, `category`,
`cap` (vial cap colour), `purity`, `rating`/`reviews`, `bestseller`, `description`, and
`variants` (each with its own `size`, `price` and `stock`).

The ratings, review counts, purity figures and sample COA are **placeholder data**.
Replace them with your real figures and your lab's real certificates before going live.

## Before going live

- Replace placeholder bank/PayID details, the support email and the sample data
- Move products, stock and orders to a backend, and take card payments through a
  payment provider rather than handling card numbers yourself. Many card processors
  restrict research-chemical merchants, so check their terms first
- Get advice on the regulations for your products. In Australia, many peptides are
  prescription-only medicines under the TGA's Poisons Standard, and a
  "research use only" label does not by itself make retail supply lawful
