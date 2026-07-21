# GoldSmith Pro ERP - PRD

## Overview
Production-ready Jewellery Manufacturing ERP mobile app (Expo React Native + FastAPI + MongoDB). Black/Gold/White luxe theme, dark mode.

## Roles
Owner, Manager, Staff, Karigar, Client (JWT auth, role in token).

## Modules Implemented
- **Auth**: JWT login (Argon2), owner seed idempotent.
- **Dashboard**: KPIs (clients, orders, gold/silver/diamond balance, revenue, labour, today's jobs, pending deliveries), 6-month revenue chart, low-stock count.
- **Clients**: CRUD, filter by type (Wholesaler / Retail / Supplier), search, per-client profile with tabs.
- **Client Detail tabs**: Dashboard summary, Orders, Gold Ledger (by karat 9K-24K with fine gold), Silver, Diamond, Gemstone, Cash Ledger, Invoices.
- **Karigars**: List, create, per-karigar orders, gold issued/returned, labour rate, material balance.
- **Orders**: Create with Client, Jewellery type, Karat OR Custom Purity %, weight, labour rate, stone/other charges, karigar, **design photo (camera/gallery, base64)**, description, remarks. List with status/stage filter.
- **Order Detail**: Job Card view, design photo, 12-stage timeline (Order Received → Delivered), advance stage button, karigar assignment, cost summary (labour + stone + other + GST, gold not charged).
- **Ledger Entries**: Add Gold (with karat/purity + fine gold auto-calc, gross/net/received/issued/returned/wastage/recovery), Silver, Diamond, Gemstone, Cash (advance/payment/refund) per client.
- **Invoices**: Global list + per-client, totals, balance, status.
- **Inventory**: List with low-stock warnings across Gold, Silver, Diamond, Gemstone, Finding, Chain, Lock, Packaging.
- **Notifications**: Overdue orders, pending payments, low stock, derived server-side.
- **Global Search**: Clients, Orders, Karigars, Invoices.
- **Reports**: Business overview, material balance, financial summary.

## Calculations (backend)
- `net_weight = gross_weight - stone_weight`
- purity fraction = custom purity % (if provided) else karat/24
- `fine_gold = net_weight × purity_fraction`
- Invoice: labour + stone_setting + other → +GST% → total; Client-supplied gold NOT charged.

## Seed Data
Owner user + 3 karigars + 4 clients (2 Wholesalers, 1 Retail, 1 Supplier) + 4 orders (stages 6-11) + gold/silver/diamond entries + 3 invoices with partial payments + 9 inventory items.

## Screens / Routes
`/login`, `/(tabs)/{index,clients,orders,more}`, `/client/[id]`, `/order/[id]`, `/client-new`, `/order-new`, `/karigars`, `/karigar-new`, `/inventory`, `/invoices`, `/notifications`, `/search`, `/reports`, `/gold-new`, `/silver-new`, `/diamond-new`, `/gemstone-new`, `/cash-new`.

## Deferred (future iterations)
PDF/Excel export, WhatsApp share, QR/Barcode, Multi-language (EN/HI/GU), Offline sync, Audit log, OTP login, Push notifications.
