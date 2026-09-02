# CAPPTURE – Mobile App Build Prompt (for Google AI / Gemini)

You are a senior cross-platform app developer. Build a production-quality **mobile app** for **CAPPTURE**, a South African multi-vendor fashion marketplace ("shop local"). The web marketplace already exists and is live — this app must feel like the same brand, offer the same features, and speak to the same Supabase backend.

Read every rule below. Do not invent features that conflict with these rules, especially the pricing rules — they are non-negotiable.

---

## 1. The brand & design language (follow this aesthetic exactly)

CAPPTURE is an **edgy, premium, editorial, monochrome** fashion marketplace — think high-end streetwear editorial, not a generic beige shop.

- **Palette:** white/paper backgrounds (`#FFFFFF`, `#F2F2F2`), pitch-black "ink" sections (`#000000`, soft ink `#1C1917`), and monochrome stone neutrals. **No colourful accents** — the "brand" colour is literally black/white. Use black-on-white and white-on-black contrast as the hero.
- **Typography:** Display/headings in **Space Grotesk**; body in **Inter**.
- **Editorial styling:**
  - Large, uppercase display headings with tight leading; keep them statement-like.
  - Tiny uppercase labels with **wide letter-spacing** (≈0.12em–0.18em), e.g. "CHECKOUT", "THE EDIT".
  - Thin 1px rules/dividers, generous whitespace, minimal shadows (soft card shadow ≈ `0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06)`).
- **Iconography:** thin-stroke line icons (lucide-style), 1.5–2px stroke.
- Components should feel sharp, editorial and tactile; avoid rounded-radius, gradients and drop-shadow "pretty" effects.

## 2. Product overview (who this is)

- Multi-vendor marketplace where **independent SA sellers** open boutiques and sell fashion on CAPPTURE.
- Customers browse the marketplace, buy from multiple sellers in one checkout, and pay once.
- There are **three audiences**: customers, sellers (with a dashboard), and platform admins. There is also a **B2B "Supplies"** module for approved sellers.
- Base currency is **South African Rand (ZAR)**. All money recorded, charged, and paid out is ZAR. Forever.

## 3. Core features to build

### A. Storefront (public, no login)
- **Home:** editorial hero, "The Edit" auto-scrolling product carousel, category rail, featured stores.
- **Shop:** product grid with filters (category, price sort) and search. Product cards show image, name, seller, and price **in the customer's selected currency**.
- **Product detail:** image gallery, name, seller link, price in selected currency, size/colour options with stock, quantity, **Add to bag**, **Buy now**, seller info, delivery info.
- **Store page:** seller profile (banner, bio, followers count), their product catalogue, follow/unfollow button.
- **Stores directory:** browse all sellers.

### B. Country & currency selector (critical)
- A modal/selector letting the customer choose their **country + language**. Default: South Africa, ZAR, English. Persist the choice on-device.
- ~170 countries supported, each mapped to a currency; a supported currency list (ZAR, USD, GBP, EUR, CAD, AUD, NZD, CZK, ILS, MXN, NOK, PLN, QAR, SGD, SEK, CHF, AED, …).
- The selector must be reachable from the header/announcement bar and the footer.

### C. Pricing rules (NON-NEGOTIABLE — implement exactly)
1. **Sellers only ever set a base price in ZAR.** The app must never ask a seller for a price in any other currency, and must never store a converted price for a product.
2. **Display prices** convert ZAR → customer's currency **using a full-precision exchange rate that is internally available and never rounded**.
3. **Whole-number retail rounding for foreign currencies:** the customer sees the converted price **rounded to a whole number** with two decimals shown, e.g. base **R300** → raw **$18.68** → customer sees **$19.00**. In South Africa (ZAR), show the seller's exact price (e.g. **R200.00** — never round ZAR).
4. Always display exactly 2 decimals ("…,00") everywhere — **no visible fractional prices like $12.42**.
5. Expose these values internally as a pricing breakdown: `seller_base_price_zar`, `exchange_rate` (full precision), `raw_converted_price`, `customer_display_price`, `selected_currency`, `exchange_rate_timestamp`.
6. **Keep conversions additive:** round the single-unit price first, then multiply by quantity (**2 × $19.00 = $38.00**), and sum rounded lines so cart/checkout totals always add up exactly. Never mix raw and rounded numbers in displayed totals.
7. On every checkout/payment screen show the **exact ZAR amount the customer will be charged** clearly (e.g. "You'll be charged R200.00 via PayFast"), because payment is ZAR-only. The foreign-currency figure is a conversion estimate.
8. **Exchange rates:** static, full-precision rates stored as constants, with a clean seam to swap in a live FX API (Frankfurter.app is the approved free provider) later. Rate source and timestamp should be recorded in the pricing breakdown.

### D. Bag (cart) & checkout
- **Bag** groups items **per seller** ("orders ship per seller").
- Free shipping above **R1,000** subtotal, otherwise **R60** shipping per seller's portion.
- **Checkout** per seller, but a single PayFast payment action covers placed orders.
- **Delivery options:**
  - **Courier (domestic ZA):** shipping address with province required.
  - **PEP collection (domestic):** choose a click-and-collect store — pick province → city → store; tiers **Standard (7–9 days, R60)** and **Express (3–5 days, R100)**.
  - **International:** show "International courier to {country}" as an estimate only (no live international rates configured yet; never invent a rate). Country is captured from the country selector; province is not required internationally.
- **Coupons:** code-based, percentage or fixed-amount, optionally limited to one seller, with minimum-order, active window, and usage-limit checks.
- **Order notes** field.
- **Totals** computed per seller; subtotal − discount + shipping. Grand total sums sellers.
- **Payment: PayFast, ZAR-only.** Retail cart → PayFast redirect → return page confirms payment. Orders are only confirmed once PayFast confirms.

### E. Customer accounts
- Email + Google sign-in/up, password reset, email confirmation.
- Profile, saved address book, notifications.
- **My orders:** list + detail with per-item price, line totals, order statuses, delivery/tracking info.
- **Wishlist.**

### F. Seller dashboard
- Seller application/onboarding flow.
- **Products CRUD:** name, description, images, category, sizes, colours, **price in ZAR only**, stock. List + edit + stock/status management.
- **Orders:** fulfilment statuses, ship/collect marking.
- **Analytics:** revenue and sales charts.
- **Earnings:** available/pending balance, marketplace commission, payout history; **withdrawals** flow.
- Followers, promotions, notifications, inbox/messages, settings.
- **All seller-facing prices are ZAR-only. Sellers never see converted prices.**

### G. Admin panel
- Overview, products, sellers, orders, withdrawals, coupons, messages, hero management, collections/categories, settings, team.

### H. Supplies (B2B wholesale for approved sellers)
- Approved sellers can shop a **Supplies** catalogue (business/handmade supplies): supplies shop, product pages, cart, checkout charged against the seller's **wallet balance**, supplies orders, categories management, and an admin overview.

## 4. Non-negotiable technical rules
- **Money of record is always ZAR.** Order totals, costs, commissions, balances, payouts are stored and settled in ZAR. Currency conversion exists **only in the display layer**.
- **Never store per-product converted prices** and never let a seller set a price in a foreign currency.
- The PayFast amount is always the ZAR amount; surfaced clearly at checkout.
- Rounding must be deterministic and additive across cart/checkout/order-confirmation.

## 5. Suggested tech stack (justify any deviation)
- **React Native + Expo** (iOS + Android) or Flutter — pick one and be consistent.
- **Backend: Supabase** (Postgres, Auth, Storage, Realtime, RLS) — it already exists for this product; target it directly. Provide the SQL schema/migrations mirroring the marketplace domain (users, stores, products, product variants, orders, order items, coupons, payments, wallet/withdrawals, addresses, follow relationships, notifications, supplies).
- **State:** a lightweight store (Zustand-style).
- **Push notifications** for order/product/seller events.
- **Monorepo-friendly** structure: `src/app`, `src/features`, `src/components`, `src/services`, `src/theme`.

## 6. Deliverables
1. Complete design-system token file (colours, typography, spacing, shadows) matching section 1.
2. Navigation map + full list of screens.
3. Supabase schema + RLS policies + any Edge Functions (e.g. order placement computing totals in ZAR server-side, commission calculation, PayFast webhook handling, wallet debits for Supplies).
4. The working app code with a README, environment setup (Supabase URL + keys, PayFast merchant ID), and a test plan.
5. Point out (in a short "pricing.md") exactly where the pricing breakdown lives, how rounding works, and how the ZAR charge is surfaced at checkout.

## 7. Deliver with these snapshots in mind
- Make it feel premium and editorial, like a curated fashion drop — not a generic e-commerce clone.
- Assume a reviewer will check: clean "…,00" prices in every currency, additive totals, ZAR-only seller pricing, and ZAR charge display at payment.