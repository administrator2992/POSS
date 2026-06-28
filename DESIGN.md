---
name: POSS App
colors:
  primary: "#ea580c"
  secondary: "#a18072"
  surface: "#ffffff"
  background: "#f9fafb"
  on-surface: "#111827"
  error: "#ef4444"
typography:
  body-md:
    fontFamily: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif
    fontSize: 16px
    fontWeight: 400
rounded:
  md: 8px
---

# Design System

## Overview
A warm, responsive, landscape-optimized tablet interface for a Point of Sale (POS) system.
Designed for rapid cashier checkouts, high touch-target visibility, and seamless employee switching under typical store lighting conditions.

## Colors
- **Primary** (#ea580c): Primary checkout action buttons ("Bayar"), success alerts, active settings, and core brand elements.
- **Secondary** (#a18072): Warm brown tone representing the cafe/bakery aesthetic, used for supporting actions, subtitle badges, and category labels.
- **Background** (#f9fafb): Structural page layer background (gray-50) to minimize glare.
- **Surface** (#ffffff): Card container layouts, settings forms, popover menus, and product selection grids.
- **On-surface** (#111827): High-contrast dark charcoal (gray-900) for screen headings and readable text fields.
- **Error** (#ef4444): Deletion indicators, transaction cancellation buttons, and system alerts.

## Typography
- **Headlines**: Bold or semi-bold sans-serif stack, sizing from 18px (text-lg) up to 24px (text-2xl) for titles and summaries.
- **Body**: Regular sans-serif stack, 14px (text-sm) to 16px (text-base) for inventory lists, receipts, and cashier names.
- **Labels / Pins**: Medium weight, 12px (text-xs) to 20px (text-xl) for numeric pin text to ensure clarity on touchpads.

## Components
- **Buttons**: Rounded edges (`rounded-lg` / 8px). Filled primary buttons feature smooth hover transitions (`transition-colors hover:bg-orange-700`).
- **Inputs**: Flat 1px border style (`border-gray-300`) with custom orange active highlight rings (`focus:ring-2 focus:ring-orange-500`).
- **Cards**: Product choice items feature light borders (`border-gray-200`) and slight shadow rises on touch hover (`hover:shadow-md hover:border-orange-500 transition-all`).

## Do's and Don'ts
- Do use high-contrast primary orange highlights to direct the cashier's eye straight to checkout buttons and core checkout steps.
- Don't use small click target paddings; maintain comfortable touch areas (`h-16` on login numpad, `py-3` on main options) to reduce cashier entry errors.
- Do enforce viewport control rules and landscape media orientation styles to prevent clipping of action controls on standard tablet screens.
