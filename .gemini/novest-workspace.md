---
name: novest-workspace
description: Complete workspace context for Novest - Vietnamese Web Novel Platform. Use this as the primary reference for development guidelines, architecture decisions, and code style.
---

# Novest - Vietnamese Web Novel Platform

## Project Overview
Novest là nền tảng đọc truyện chữ Việt Nam, tập trung vào trải nghiệm đọc cao cấp với hệ thống premium content, translation groups, và community features.

---

## Tech Stack

### Core
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.0.7 | Framework (App Router) |
| **React** | 19.2.0 | UI Library |
| **TypeScript** | 5.x | Type Safety |
| **TailwindCSS** | 4.x | Styling |
| **PostgreSQL** | - | Database |
| **Prisma** | 5.22.0 | ORM |
| **NextAuth.js** | 5.0.0-beta.30 | Authentication |

### Key Libraries
- **Framer Motion** - Animations
- **TipTap** - Rich text editor
- **Recharts** - Dashboard charts
- **Lucide React** - Icons
- **Sonner** - Toast notifications
- **date-fns** - Date utilities

---

## Architecture Pattern

### API-First Approach
```
/api/[resource]/route.ts     → REST endpoints
/services/[resource].ts      → Client-side API calls
/actions/[resource].ts       → Server actions (simple mutations only)
```

**Rules:**
1. **GET requests** → Dùng API routes, gọi qua services
2. **Complex mutations** → API routes với proper error handling
3. **Simple form submissions** → Server actions acceptable
4. **Client components** → Luôn gọi qua services, không import trực tiếp từ actions

### Directory Structure
```
app/
├── (main)/           # Public pages (novel detail, reading, browse)
├── (auth)/           # Auth pages (login, register)
├── studio/           # Creator dashboard
├── admin/            # Admin panel
├── api/              # API routes
│   ├── novels/
│   ├── chapters/
│   ├── comments/
│   └── ...
components/
├── ui/               # Reusable UI primitives (buttons, inputs, etc.)
├── novel/            # Novel-specific components
├── chapter/          # Chapter-specific components
├── comment/          # Comment system components
└── ...
services/             # Client-side API wrappers
actions/              # Server actions
lib/
├── db.ts             # Prisma client
├── pricing.ts        # Economy system utilities
├── utils.ts          # General utilities
└── ...
```

---

## Database Schema Highlights

### Core Models
- **Novel** - Truyện, có approval workflow, translation group
- **Volume** - Tập truyện
- **Chapter** - Chương, hỗ trợ draft/scheduled/published, versioning 7 ngày
- **Comment** - Hỗ trợ paragraph-level comments (via `paragraphId`)
- **Rating** - Reviews với RatingComment cho discussions
- **TranslationGroup** - Nhóm dịch có thể cộng tác

### Economy System
- **Wallet** - Ví tiền user
- **Transaction** - Lịch sử giao dịch
- **UserPurchase** - Chapters đã mua

### Pricing Formula (lib/pricing.ts)
```typescript
price = (wordCount / 1000) * 5 vé * formatMultiplier * (1 - discount%)
// WN: x1.0, LN: x1.2
// Min 50k words (novel) và 1k words (chapter) để premium
```

---

## Design System

### Philosophy: "Ink & Luminescence" (Thủy Mặc & Dạ Quang)
Immersive dark theme cho Asian fantasy novels. Không phải dashboard, mà là **digital library**.

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#0B0C10` | Main background |
| `--bg-secondary` | `#1A1C23` | Cards, surfaces |
| `--accent-amber` | `#F59E0B` | Primary CTA, highlights |
| `--accent-jade` | `#10B981` | Success states |
| `--text-primary` | `#F3F4F6` | Headings |
| `--text-secondary` | `#9CA3AF` | Body text |

**AVOID:** Generic "startup blue", "AI purple", pure black backgrounds.

### Typography
- **Headings:** `Be Vietnam Pro` (Sans-serif, optimized for Vietnamese)
- **Body:** `Be Vietnam Pro` with `line-height: 1.7` for diacritics
- **NO SERIF fonts** unless explicitly requested
- **NO** Inter, Roboto, Arial, system fonts

### Motion Principles
1. **High-impact moments** - Page load stagger animations
2. **Subtle micro-interactions** - Hover states, focus rings
3. **Scroll-triggered reveals** - Content sections
4. Use **Framer Motion** for complex animations

### Component Patterns
- **Novel Cards** - Cover art as portal, expand on hover, metadata slides in
- **Buttons** - Sharp edges, underlines, editorial feel. NO pill-shaped gradients
- **Backgrounds** - Subtle noise, gradient glows, NOT solid colors

---

## Key Features

### Chapter System
- **Draft/Scheduled/Published** workflow
- **Versioning** - 7-day history for reverting
- **Paragraph comments** - Inline discussions

### Approval Workflow
- `PENDING` → `APPROVED` / `REJECTED`
- 3 rejections = permanent delete
- Admin logs for all actions

### Content Restrictions
- **R18 content** - Age verification via birthday
- **isLicensedDrop** - Only visible to logged-in users

---

## Known Issues & TODOs

### View Tracking (Cần redesign)
Current: Per-novel, cookie-based, không accurate
Planned: Per-chapter với analytics integration (Plausible/Umami/PostHog)

### Library Notifications
- Thiếu nút "Mark as read"
- Số notification cũ bị lưu lại sau khi đã clear

### Pricing Auto-calculation
`lib/pricing.ts` đã có nhưng chưa wire vào chapter creation

---

## Development Commands

```bash
# Development
npm run dev

# Build
npm run build

# Database
npx prisma migrate dev --name <migration_name>
npx prisma db push        # Schema sync
npx prisma studio         # Visual DB editor
npx prisma db seed        # Run seeds

# Testing
npm run test
npm run test:watch
npm run test:coverage

# Linting
npm run lint
```

---

## Deployment

- **Platform:** Self-hosted (Ubuntu server)
- **Process Manager:** PM2
- **CI/CD:** GitHub Actions → `deploy.yml`
- **Database:** PostgreSQL (production)

---

## Code Style Guidelines

### TypeScript
- Strict mode enabled
- Prefer interfaces over types for objects
- Use Zod for runtime validation

### React
- Prefer Server Components when possible
- Use `"use client"` directive only when needed
- Colocate related components

### API Design
```typescript
// Standard response format
{ data: T } // Success
{ error: string } // Error
```

### Naming Conventions
- **Files:** kebab-case (`novel-card.tsx`)
- **Components:** PascalCase (`NovelCard`)
- **Functions:** camelCase (`getNovelBySlug`)
- **Constants:** SCREAMING_SNAKE_CASE (`BASE_PRICE_PER_1000_WORDS`)
