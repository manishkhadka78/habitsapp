# Habit & Home: e-commerce storefront

A small, dependency-free online store built with plain HTML, CSS and JavaScript.

## Features

- **Product catalog** with category filters, live search and sorting (price, rating, name)
- **Product pages** with stock status, quantity picker and related products
- **Shopping cart** with quantity controls, saved in `localStorage` and synced across tabs
- **Pricing**: subtotal, 8% tax, and $5.99 shipping (free over $50)
- **Checkout form** with validation (email, Luhn card check, expiry, CVC)
- **Order confirmation** page; orders are saved locally
- Responsive layout and automatic dark mode

> This is a front-end demo: **no real payments are processed**. Use test card `4242 4242 4242 4242`.

## Run it

No build step. Serve the folder with any static server:

```bash
python3 -m http.server 8000
# or: npx serve .
```

Then open http://localhost:8000.

## Project structure

```
index.html        Page shell (header, footer, app mount point)
css/styles.css    All styles
js/products.js    Product catalog data, edit this to change products
js/app.js         Router, cart, checkout and views
```

## Editing products

Add or change entries in `js/products.js`. Each product has an `id`, `name`,
`category`, `price`, `emoji`, `color` (thumbnail background), `rating`, `stock`
and `description`. To use real photos, add an `image` URL and render it in the
`thumb()` helper in `js/app.js`.

## Next steps for production

- Move products and orders to a backend (e.g. Node/Express + a database)
- Take payments through a provider such as Stripe Checkout, never handle raw card numbers
- Add user accounts, order history and an admin panel for inventory
