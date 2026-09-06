# 🪙 PennyTrail

> **Modern, Offline-First Personal Finance & Expense Tracker**  
> Track daily expenses, analyze spending habits, manage category budgets, and generate beautiful exportable reports — all packed into a blazing-fast Progressive Web App (PWA).

---

## 🌟 Highlights

- **⚡ Offline-First Architecture**: Powered by **Dexie.js (IndexedDB)** for instantaneous client-side interactions and offline resilience, backed by **LibSQL / SQLite** for server persistence.
- **📱 Progressive Web App (PWA)**: Installable natively on iOS, Android, macOS, and Windows with custom service worker caching, standalone window mode, and responsive mobile bottom navigation.
- **📊 Rich Visual Analytics**: Interactive expense breakdowns, monthly trend charts, and category distributions powered by **Recharts**.
- **🎯 Dynamic Budgeting**: Set monthly budgets by category with real-time progress indicators, remaining balance alerts, and overspend warnings.
- **📑 Multi-Format Reports & Exports**:
  - 📄 **PDF Reports**: Clean, professional printable statements generated via **jsPDF** & **AutoTable**.
  - 📊 **Excel Workbooks**: Structured multi-sheet spreadsheets (`Transactions`, `Categories`, `Overview`) generated via **ExcelJS**.
  - 📸 **Visual Snapshots**: Social-ready image cards rendered via **html-to-image**.
  - 📋 **Quick Copy**: Fast text summaries formatted for instant clipboard sharing.
- **💳 Versatile Payment Methods**: Native tracking for UPI, Cash, Credit/Debit Cards, Net Banking, and custom modes.
- **🔁 Recurring Expenses**: Automatic scheduling support for Daily, Weekly, Monthly, and Yearly subscriptions & bills.
- **🌍 Multi-Currency & Precision Math**: Integer minor-unit calculations preventing floating-point rounding errors. Supports INR (`₹` with Indian numbering system `Lakhs/Crores`), USD (`$`), EUR (`€`), GBP (`£`), JPY (`¥`), AED (`د.إ`), SGD (`S$`), AUD (`A$`), and CAD (`C$`).
- **🛡️ Admin Console**: Built-in administration portal for managing users, monitoring platform metrics, configuring global categories, and system diagnostics.
- **🎨 Dark / Light Mode**: Smooth theme toggling (Dark, Light, and System preference) with persistent styling.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Server Actions & API Routes) |
| **UI Library** | [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/) |
| **Icons & Design** | [Lucide React](https://lucide.dev/), Custom Responsive Layouts (Desktop Sidebar & Mobile Dock) |
| **Client Database** | [Dexie.js](https://dexie.org/) (IndexedDB wrapper with reactive hooks) |
| **Server Database** | [@libsql/client](https://github.com/tursodatabase/libsql-client-ts) (SQLite / Turso compatible) |
| **Charts & Visuals** | [Recharts](https://recharts.org/), [date-fns](https://date-fns.org/) |
| **Export Engines** | [ExcelJS](https://github.com/exceljs/exceljs), [jsPDF](https://github.com/parallax/jsPDF), [html-to-image](https://github.com/bubkoo/html-to-image) |
| **PWA & Offline** | Web App Manifest, Service Worker (`sw.js`), Offline Network Status detection |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.18.0 or later recommended)
- [npm](https://www.npmjs.com/) (or yarn / pnpm / bun)

### 1. Clone the Repository

```bash
git clone https://github.com/aakashpalariya/PennyTrail.git
cd PennyTrail
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to start tracking expenses.

### 4. Build for Production

```bash
npm run build
npm run start
```

---

## 📂 Project Structure

```text
PennyTrail/
├── data/                    # Local SQLite database files & backups
├── public/                  # Static assets, PWA icons, manifest, service worker
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── logo.png
│   └── sw.js                # PWA Service Worker
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (auth)/          # Authentication (login & register)
│   │   ├── admin/           # Admin dashboard & user management
│   │   ├── analytics/       # Visual charts, category distributions & trends
│   │   ├── api/             # Next.js API endpoints (auth, expenses, budgets, admin)
│   │   ├── budget/          # Category budget limits & monthly trackers
│   │   ├── calendar/        # Interactive daily spending calendar
│   │   ├── categories/      # Custom category creation & color/icon picker
│   │   ├── dashboard/       # Main overview dashboard & recent transactions
│   │   ├── expenses/        # Expense listings, filtering, search & creation
│   │   ├── reports/         # PDF, Excel, and Image export center
│   │   ├── settings/        # User profile, currency, avatar & security settings
│   │   ├── globals.css      # Tailwind CSS v4 design tokens & theme variables
│   │   ├── layout.tsx       # Root layout with Theme, Auth, and Toast providers
│   │   └── manifest.ts      # Web App Manifest definition
│   ├── components/          # Reusable UI & layout components
│   │   ├── layout/          # DesktopSidebar, MobileBottomNav, AppHeader, PWA banners
│   │   └── ui/              # Buttons, Modals, DatePicker, Select, Tables, Avatars
│   ├── context/             # React Contexts (AuthContext, ThemeContext, ToastContext)
│   ├── db/                  # Dexie.js client-side schema & IndexedDB repositories
│   ├── domain/              # Business logic (currencies, formatters, export generators)
│   ├── lib/                 # API client utilities & class merge helpers
│   └── server/              # LibSQL database connection & SQLite repositories
├── eslint.config.mjs        # ESLint configuration
├── next.config.ts           # Next.js configuration
├── package.json             # Project dependencies & scripts
└── tsconfig.json            # TypeScript configuration
```

---

## 🧩 Key Capabilities

### 💸 Smart Expense Tracking
- Log amount, title, date, category, and payment method in seconds.
- Attach notes and store receipt images directly with transactions.
- Filter expenses by keyword, category, date range, or payment type.
- Flag transactions as recurring (Daily, Weekly, Monthly, Yearly).

### 🎯 Monthly Budget Controls
- Configure spending ceilings for individual categories.
- Real-time calculations comparing actual spend against target limits.
- Color-coded progress indicators warn when spending nears or exceeds 100%.

### 📊 Analytics & Insights
- Category distribution pie and bar charts.
- Spending trajectory over time to identify seasonal spikes.
- High-level KPIs: Total Spent, Daily Average, Top Spending Category.

### 📅 Calendar Spend Heatmap
- Day-by-day calendar grid displaying total spending per date.
- Drill down into specific dates to review transactions incurred on that day.

### 📁 Professional Reporting
- **PDF Generation**: Download formatted monthly expense statements with transaction breakdowns.
- **Excel Spreadsheets**: Detailed multi-tab workbooks containing itemized logs, category summaries, and monthly totals.
- **Snapshot Cards**: Generate clean image cards to save or share.

### 🛡️ Administrative Controls
- Accessible under `/admin` for administrators.
- Monitor active registered users, transaction statistics, and database volume.
- Manage default categories across all user accounts.
- Reset credentials and activate/deactivate user accounts.

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts local Next.js development server on port 3000 |
| `npm run build` | Compiles optimized production bundle |
| `npm run start` | Boots the compiled production server |
| `npm run lint` | Runs ESLint checks across the codebase |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) (or proprietary / personal project license as designated).
