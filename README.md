<p align="center">
   <a href="https://shadcndashboard.dev" target="_blank">
      <img src="https://shadcndashboard-demo.vercel.app/images/logos/logoicon.svg" alt="shadcndashboard-logo" width="50px" height="50px">
   </a>
</p>

<h1 align="center">
   <a href="https://shadcndashboard.dev" target="_blank" align="center">
      Shadcn Dashboard - Free Shadcn Admin Dashboard Template (Next.js)
   </a>
</h1>

<p align="start">Shadcn Dashboard is a modern, responsive admin dashboard template built with Next.js (App Router), Shadcn UI, Base UI, and Tailwind CSS v4. It ships with a modern dashboard, Blog, Notes & Tickets apps, authentication pages, form layouts, data tables, user profile, and a rich UI component library - giving you everything you need to build your next admin panel faster.

<kbd>[![Shadcn Dashboard - Demo Screenshot](https://shadcndashboard-demo.vercel.app/OG-Image.png)](https://shadcndashboard.dev)</kbd>

## Introduction 📊

Shadcn Dashboard is built with Next.js (App Router), offering a production-ready admin dashboard starter to kickstart your next project. It features a modern dashboard, Blog, Notes & Tickets apps, authentication flows, form layouts with validation, data tables, user profile pages, and a comprehensive library of Shadcn UI components.

[View Demo](https://shadcndashboard-demo.vercel.app)

[View Documentation](https://shadcndashboard.dev/docs)

<p>
   Crafted with ❤️ by
   <a href="https://shadcndashboard.dev" target="_blank">
      shadcndashboard.dev
   </a>
   , committed to empowering the open-source community.
</p>

## Key Features ✨

- **English / Vietnamese UI** - Use the VI/EN control in the dashboard header. The selected language is saved in browser storage; navigation, profile, and Notes support both languages. Other template pages still contain English copy.
- **Personal profile** - The header and profile page display bin (Vo Dinh Quan), Full-stack Engineer, with a local profile image and portfolio link. This is a static dashboard identity, not an authentication account.

- **Modern Dashboard** - Ready-to-use dashboard layout with statistics, charts, and widgets
- **Apps** - Big Calendar, Blog, Notes, and Tickets apps out of the box
- **Authentication Pages** - Login, Register, Forgot Password, OTP Verification, Reset Password, Two-Factor Auth
- **Forms & Tables** - Vertical & Horizontal form layouts, form validation, and a data table
- **User Profile** - Rich profile page with connections and activity views
- **Built with Next.js 16 / React 19** - Modern, fast, and SEO-friendly
- **Tailwind CSS v4** - Easy theming and utility-based styling
- **Responsive & Mobile-First** - Designed to look great on all devices
- **Dark Mode Support** - Full light/dark theme toggle via `next-themes`
- **Rich Charting** - Recharts integration for beautiful visualizations
- **Rich Text Editor** - TipTap-powered editor for the Blog app

## Big Calendar

Open [http://localhost:3000/apps/calendar](http://localhost:3000/apps/calendar), or **Apps → Big Calendar / Lịch & kế hoạch** in the sidebar.

- Agenda, year, month, week and day views; Monday starts the week.
- Calendar fills the available viewport. Four compact weekly indicators expose explanations on hover/click; week/day default to **Fit**, with **Detail** for a roomier scrollable time grid. Sidebars and dense calendars scroll internally, and mobile filters open in a sheet.
- Create, edit, duplicate, reschedule and delete events or tasks. Details include description, location, attendees, category, priority and planned/confirmed/completed/cancelled status.
- Six event colors; dot, color and mixed badges; all-day and multi-day events.
- Weekly task checklist and progress, scheduled hours, overlap counts and conflict warnings. Statistics follow the selected week; search and filters apply to the calendar.
- Working days/hours, displayed hours and weekend visibility are saved through the API. Times use **Asia/Ho_Chi_Minh (GMT+7)**.
- Search title/description/location/attendees, filter categories/status, and export the visible period and active filters to `.ics`.
- VI/EN and the existing light/dark theme; mobile filters and horizontally scrollable week/month grids. Click a slot to create, or open an event to edit its dates on touch devices. Desktop drag/drop preserves event duration.
- Keyboard shortcuts outside inputs and dialogs: **N** new plan, **T** today, **← / →** navigate, **1–5** agenda/year/month/week/day.

Data flows through `app/api/calendar/route.ts` → `app/context/calendar-context/` → `app/components/apps/calendar/`. The first request creates editable sample plans for the current week. Events and preferences persist in `.data/calendar.json` (gitignored), with serialized atomic writes within one Node process. Set `CALENDAR_DATA_DIR` to choose another writable directory.

This storage targets a personal, single-process Node deployment with a persistent disk. Serverless, multiple instances and per-user calendars need a database and authentication; the template currently has no account isolation. Attendee names/emails are notes only; external calendar synchronization, invitations, recurrence and background reminders are not implemented.

```bash
pnpm test:calendar  # Date boundaries, overlaps, rescheduling, validation, ICS
pnpm build         # Production bundle and TypeScript 7 type-check
pnpm lint
```

Lint tooling uses ESLint 9 and a scoped TypeScript 6 compiler API dependency through `.pnpmfile.cjs`; application builds retain TypeScript 7. Existing lint errors elsewhere in the template remain separate from Calendar validation.

## Personal Finance UI

Open [http://localhost:3000/finance](http://localhost:3000/finance), or **Tài chính cá nhân → Quản lý tài chính** in the sidebar.

- Six pages: overview, transactions, monthly budgets, savings goals, cash-flow forecast, and purchase/moving simulator.
- Interactive demonstration dataset, explicitly dated **15 October 2026**. This is fictional data, not inferred personal balances or verified income.
- `/api/finance` supplies the read-only demo through the shared SWR fetcher. The server layout provides the same initial dataset so all page segments render during instant-navigation validation. The Finance layout owns session edits: add/edit/delete transactions, adjust monthly budgets, allocate/release goals, and preview/confirm standardized CSV imports. Edits survive navigation within Finance; a full reload resets the session. No real bank connection or persistent financial records.
- Internal transfers preserve total cash and stay out of income/expense reports. Refunds reduce category expenses. Goal allocations reserve existing funds without creating money or consumption expenses.
- Forecast income, costs and upcoming bills with editable assumptions. Compare acting now with waiting for a purchase or moving out; amounts are editable examples.
- CSV accepts the downloaded seven-column template (UTF-8, up to 1 MB / 1,000 rows), previews validation and skips exact-key duplicates before confirmation. It is not a universal bank statement importer. Export the filtered ledger to CSV.
- UI is Vietnamese-first and inherits the app's light/dark theme. Navigate using the dashboard sidebar; wide tables scroll within their containers.

Validation: `pnpm test:finance`, scoped ESLint and `pnpm build`. Current scope: [concise product context](docs/personal-finance-context.md). Implementation: [docs/personal-finance-ui.md](docs/personal-finance-ui.md).

Hướng dẫn nhanh tiếng Việt: [docs/huong-dan-su-dung-finance.md](docs/huong-dan-su-dung-finance.md).

## Developer Workspace

Open [http://localhost:3000/developer](http://localhost:3000/developer), or **Developer → Developer Workspace** in the sidebar.

Two UI pages: **Overview** and **AI Usage**, using the Modern home dashboard's 12-column layout, shared DashboardCard, section dividers, chart/summary row and three metric cards. Contributions and a searchable/sortable Inbox are tabs on Overview; reports and source coverage open in dialogs. Old Developer URLs redirect into these views. Local colored Claude, Codex, ChatGPT/OpenAI and GitHub logos work in light and dark themes. The MIT `react-activity-calendar` heatmap, model-level tokens/throughput, filters, export and session-only read actions remain available. VI/EN is supported.

`/api/developer` supplies fictional data dated **16 October 2026, 09:00 GMT+7** through SWR/context. Model names follow the official catalogs checked at that date; token counts and measured output tok/s are illustrative. Quotas remain separate, stale/partial/missing observations stay visible, and no live accounts are connected. Export a rule-based `.txt` report for 1/7/30 days. Browser reload resets frontend session edits.

Details and validation: [docs/personal-developer-ui.md](docs/personal-developer-ui.md). Run `pnpm test:developer`, scoped ESLint and `pnpm build`.

## Folder Structure

Dashboard headings share `HeadingText` (`app/components/shared/heading-text.tsx`) and `animated-text-02`. `CardTitle` and `DialogTitle` apply it automatically; raw page headings compose it explicitly. The theme gradient preserves icons/actions and supports reduced motion.

```
|-- public/                                    # Static assets served from the site root
|-- app/                                       # Next.js App Router routes and layouts
|   |-- globals.css                            # Tailwind CSS, CSS variables, and theme tokens
|   |-- layout.tsx                             # Root layout, fonts, metadata, and providers
|   |-- not-found.tsx                          # Custom 404 page
|   |-- api/                                   # Route handlers (blog, notes, tickets)
|   |-- auth/                                  # Auth routes (outside dashboard shell)
|   |   |-- auth2/                             # Two-factor authentication pages
|   |   |-- authforms/                         # Login, Register, Forgot Password, etc.
|   |   |-- error/                             # Error pages
|   |   |-- maintenance/                       # Maintenance page
|   |-- (dashboard-layout)/                    # Routes with sidebar + header shell
|   |   |-- layout.tsx                         # Dashboard shell layout (Sidebar + Header)
|   |   |-- page.tsx                           # Main dashboard page
|   |   |-- apps/                              # App routes (blog, notes, tickets)
|   |   |-- pages/                             # Inner page routes (form, tables, user-profile)
|   |   |-- layout/                            # Dashboard layout components (header, sidebar, footer)
|   |   |-- icons/                             # Icon pages
|   |   |-- types/                             # Route-level TypeScript types
|   |-- components/                            # App-scoped React components
|   |   |-- animated-components/               # Motion/animation-driven components
|   |   |-- apps/                              # Components for Blog, Notes, Tickets apps
|   |   |-- dashboards/                        # Dashboard widgets, stats, and charts
|   |   |-- icons/                             # Icon showcase components
|   |   |-- shared/                            # Shared cards, dialogs, and wrappers
|   |   |-- tables/                            # Data table components
|   |   |-- user-profile/                      # User profile components
|   |-- context/                               # React context providers (blog, notes, tickets)
|   |-- css/                                   # Page and style-specific CSS
|-- components/                                # Shared, non-app-scoped React components
|   |-- ui/                                    # shadcn/ui primitives
|   |-- Themeprovider.tsx                      # Theme provider wrapper
|-- hooks/                                     # Reusable client hooks
|-- lib/                                       # General utilities and shared helpers
|-- components.json                            # shadcn/ui aliases and registry config
|-- eslint.config.mjs                          # ESLint configuration
|-- next.config.ts                             # Next.js configuration
|-- package.json                               # Scripts and dependencies
|-- postcss.config.mjs                         # Tailwind CSS v4 PostCSS setup
|-- tsconfig.json                              # TypeScript compiler and path aliases
```

**Key UI Sections**

- **Dashboard** - Modern overview with statistics, charts, and widgets
- **Apps** - Blog, Notes, and Tickets management
- **Authentication** - Login, Register, and account recovery flows
- **Forms & Tables** - Layouts, validation, and data table views
- **User Pages** - Profile page with connections and activity

---

## What's Included 📦

- Dashboard
  - Modern Dashboard
- Apps
  - Blog
  - Notes
  - Tickets
- Pages
  - User Profile
  - Form Layouts
  - Form Validation
  - Data Table
- Authentication
  - Login Page
  - Register Page
  - Forgot Password Page
  - OTP Verification Page
  - Reset Password Page
  - Two Steps Verification Page
  - Error Page
  - Maintenance Page
- Components
  - Shadcn UI Primitives
  - Recharts
  - TipTap Rich Text Editor
  - Data Tables
  - Date Pickers & Calendar
  - File Dropzone
  - OTP Input
- Miscellaneous
  - Icons Showcase
  - Dark / Light Mode 
  

## 🚀 Quick Start

### Prerequisites

- Node.js 18, 20, or 22+
- pnpm (recommended) or npm

### Getting Started

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Start the development server:**

   ```bash
   pnpm dev
   ```

   The site will be available at `http://localhost:3000`

3. **Build for production:**

   ```bash
   pnpm build
   ```

4. **Preview the production build:**

   ```bash
   pnpm start
   ```

## 🧞 Available Commands

All scripts can be run using your package manager of choice (npm, pnpm, yarn, or bun).

| Command | Action                                                                           |
| :------ | :------------------------------------------------------------------------------- |
| `dev`   | Starts the Next.js development server with hot-reload at `http://localhost:3000` |
| `build` | Creates an optimized production build of your application                        |
| `start` | Serves the production build locally for testing before deployment                |
| `lint`  | Runs ESLint to check for potential errors and code quality issues                |

## Documentation 📚

For comprehensive documentation, please visit [shadcndashboard.dev/docs](https://shadcndashboard.dev/docs).

## Changelog 📆

Please refer to the [CHANGELOG file](CHANGELOG.md). We add detailed release notes to each new release.

## License ©

- Copyright © [shadcndashboard.dev](https://shadcndashboard.dev/)
- Licensed under [MIT](LICENSE)
- All our free items are Open Source and licensed under MIT. You can use our free items for personal as well as commercial purposes. We just need attribution from your end. Copy the link below and paste it in the footer of your web application or project.
  ```html
  <a href="https://shadcndashboard.dev/">Shadcn Dashboard</a>
  ```

---

<br />

<a href="https://shadcndashboard.dev" target="_blank">
  <img src="https://shadcndashboard.dev/images/og-image/homepage.webp" alt="shadcndashboard banner" width="1200">
</a>

<p>
   <a href="https://shadcndashboard.dev" target="_blank">
      shadcndashboard.dev
   </a>
   is a free and open-source admin dashboard template built with Shadcn UI, Base UI, Tailwind CSS v4, and Next.js - designed to help developers ship beautiful admin panels faster. 🚀
</p>

## Overview 🌏

Shadcn Dashboard is a production-ready admin dashboard kit built with Next.js, TypeScript, Tailwind CSS v4, Shadcn UI, and Base UI. It ships with reusable UI blocks, a full component library, pre-built app pages, and authentication flows - so you can go from zero to a fully functional admin panel in minutes.

- Production-ready blocks: dashboards, charts, tables, forms, and full apps
- Built on Base UI primitives for full design control

### Backed by WrapPixel 🏆

Shadcn Dashboard is proudly backed by [WrapPixel](https://wrappixel.com) - a trusted name in the admin dashboard space with over **15+ years** of experience building production-grade UI templates and component systems. WrapPixel's products are used by **600k+ developers and agencies** worldwide, consistently rated **4.9/5** for quality, consistency, and developer experience.

## Community 🤝

Join the Shadcn Dashboard community to ask questions, share ideas, and get help:

- 🐦 [Follow us on Twitter](https://x.com/shadcndashboard)
- 🎮 [Join us on Discord](https://discord.com/invite/eMzE8F6Wqs)

## Credits 🤘

We are grateful for the contributions of the open-source community, particularly:

- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Next.js](https://nextjs.org/)
- [Base UI](https://mui.com/base-ui/)

These projects form the backbone of Shadcn Dashboard.

## Useful Links 🎁

- [Shadcn Dashboard Website](https://shadcndashboard.dev)
- [Documentation](https://shadcndashboard.dev/docs)
- [Demo](https://shadcndashboard-demo.vercel.app/)
- [Changelog](CHANGELOG.md)
- [License](LICENSE)
- [GitHub](https://github.com/shadcndashboard/next-shadcn-dashboard)

## Social Media 🌐:

- [Twitter / X](https://x.com/shadcndashboard)
- [Discord](https://discord.com/invite/eMzE8F6Wqs)
- [GitHub](https://github.com/shadcndashboard/next-shadcn-dashboard)
