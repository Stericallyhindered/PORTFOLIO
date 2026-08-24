# Stealth Batteries Commerce/Admin Platform

This project started from a Payload/Next.js base, then grew into a business operations platform for ecommerce, products, dealers, affiliates, sales reps, orders, shipping, warranty, support, admin workflows, and internal visibility.

It is included because it shows full-stack business software: database-backed collections, admin workflows, API routes, hooks, migrations, email/providers, search utilities, and the operational glue that keeps a product business from living in spreadsheets and inboxes.

## What It Shows

- Payload CMS and Next.js application structure
- custom collections for products, customers, orders, dealers, affiliates, sales reps, discounts, shipping config, and admin users
- ecommerce/admin workflows
- shipping and Stripe-related API routes
- hooks, migrations, providers, utilities, search, and generated Payload types
- operational dashboards and order detail UI
- business-specific modeling on top of a template base

## Files And Folders Worth Reviewing

- `src/payload.config.ts`  
  Main Payload configuration.

- `src/collections/Orders.ts`  
  Order model and business workflow structure.

- `src/collections/Products/`  
  Product catalog structure.

- `src/collections/Dealers/`, `src/collections/Affiliates/`, `src/collections/SalesReps/`  
  Business relationship modeling.

- `src/collections/ShippingConfig/`, `src/collections/ShippingRateCache/`, `src/collections/ShippingCarriers/`  
  Shipping configuration and operational support.

- `src/app/api/shipping/create/route.ts`  
  Shipping workflow integration.

- `src/app/api/stripe/webhook/route.ts`  
  Payment/webhook handling.

- `src/app/(customAdmin)/admin/orders/[orderId]/OrderDetailClient.tsx`  
  Admin order workflow UI.

- `src/migrations/`  
  Database/application evolution.

## What Came From The Template

The base app shell, Payload conventions, and some generic website/content pieces came from the Payload website template.

## What Is Custom

The business operations layer is the important part:

- products and product categories
- customers
- dealers
- affiliates
- sales reps
- orders
- discount tiers and codes
- shipping carriers/config/rate cache
- admin workflows
- operational API routes
- custom admin/order UI
- migrations and generated types

## Good Interview Questions

- How do orders, customers, dealers, affiliates, and sales reps relate?
- Where would you enforce access control for admin and customer workflows?
- How would you handle webhook idempotency and retry safety?
- What would you split out first if order volume grew quickly?
- What parts are template base and what parts are business-specific?

## Portfolio Note

This is a sanitized public snapshot. Secrets, production environment files, customer data, payment credentials, generated builds, and private infrastructure details are excluded.

