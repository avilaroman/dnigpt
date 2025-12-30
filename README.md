# Argent Search Minima

[cloudflarebutton]

A modern full-stack application template powered by Cloudflare Workers. Features a React frontend with shadcn/ui components, Tailwind CSS, and a robust backend using Hono routing and Durable Objects for persistent state management.

## Features

- **Full-Stack Serverless**: Cloudflare Workers backend with Hono API framework.
- **Global State Management**: Durable Objects for counters, demo items, and persistent data storage.
- **Modern React Frontend**: Vite-powered, TypeScript, React Router, TanStack Query.
- **Beautiful UI**: shadcn/ui components, Tailwind CSS with custom gradients and animations.
- **Dark/Light Theme**: Automatic system preference with local storage persistence.
- **Responsive Design**: Mobile-first layout with sidebar support.
- **Demo API Endpoints**: Built-in counter, CRUD for demo items.
- **Error Handling**: Client and server-side error reporting.
- **Production-Ready**: Type-safe, optimized builds, CORS, logging.

## Tech Stack

| Category | Technologies |
|----------|--------------|
| **Backend** | Cloudflare Workers, Hono, Durable Objects |
| **Frontend** | React 18, Vite, TypeScript, React Router, TanStack Query |
| **UI/UX** | shadcn/ui (Radix UI), Tailwind CSS, Lucide React Icons, Framer Motion |
| **State** | Zustand, Immer, Durable Objects |
| **Forms/Data** | React Hook Form, Zod |
| **Utils** | clsx, Tailwind Merge, date-fns, UUID |
| **Dev Tools** | Bun, ESLint, TypeScript, Wrangler |

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) (package manager)
- [Cloudflare Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (for deployment)
- Node.js compatible environment (Bun handles most deps)

### Installation

1. Clone the repository:
   ```
   git clone <your-repo-url>
   cd argent-search-minima-odfhae6rpfocaswk08mwk
   ```

2. Install dependencies:
   ```
   bun install
   ```

### Development

1. Start the development server (frontend + mocked backend):
   ```
   bun run dev
   ```
   - Opens at `http://localhost:3000` (or `${PORT:-3000}`).
   - Backend APIs available at `/api/*`.

2. Type generation (for Worker bindings):
   ```
   bun run cf-typegen
   ```

3. Lint the codebase:
   ```
   bun run lint
   ```

### Build for Production

```
bun run build
```
- Outputs static assets to `dist/`.
- Worker bundle ready for deployment.

## Usage Examples

### Frontend Pages
- **Home (`/`)**: Demo landing page with theme toggle and interactions.
- Extend with React Router in `src/main.tsx`.

### API Endpoints (via `/api/*`)
All responses follow `{ success: boolean, data?: T, error?: string }`.

| Endpoint | Method | Description | Example |
|----------|--------|-------------|---------|
| `/api/health` | GET | Health check | `{ success: true, data: { status: 'healthy' } }` |
| `/api/test` | GET | Simple test | `{ success: true, data: { name: 'CF Workers Demo' } }` |
| `/api/counter` | GET | Get global counter | `{ success: true, data: 5 }` |
| `/api/counter/increment` | POST | Increment counter | `{ success: true, data: 6 }` |
| `/api/demo` | GET | List demo items | `{ success: true, data: DemoItem[] }` |
| `/api/demo` | POST | Add demo item | Body: `{ name: 'Item', value: 42 }` |
| `/api/demo/:id` | PUT | Update demo item | Body: `{ name: 'Updated' }` |
| `/api/demo/:id` | DELETE | Delete demo item | - |

**DemoItem**: `{ id: string, name: string, value: number }`

Test with `curl` or fetch:
```bash
curl -X POST http://localhost:3000/api/counter/increment
```

## Deployment

Deploy to Cloudflare Workers with Pages integration:

1. Login to Cloudflare:
   ```
   wrangler login
   ```

2. Deploy:
   ```
   bun run deploy
   ```
   - Builds frontend assets.
   - Deploys Worker (handles `/api/*` and serves static files).

3. Custom domain (optional):
   - Update `wrangler.jsonc` with your settings.
   - Run `wrangler deploy`.

[cloudflarebutton]

**Note**: Durable Objects require migrations (pre-configured). Preview deployments auto-handle bindings.

## Project Structure

```
├── src/              # React frontend
├── worker/           # Cloudflare Worker backend
├── shared/           # Shared types/mock data
├── dist/             # Build output
└── wrangler.jsonc    # Deployment config
```

## Customization

- **Add Routes**: Edit `worker/userRoutes.ts`.
- **UI Components**: Use shadcn/ui (`@/components/ui/*`).
- **Pages**: Add to `src/pages/` and update `src/main.tsx`.
- **Sidebar**: Customize `src/components/app-sidebar.tsx`.
- **Layout**: Wrap pages in `AppLayout` for sidebar.

## Contributing

1. Fork the repo.
2. Create a feature branch (`bun run dev`).
3. Commit changes (`bun run lint`).
4. Open a Pull Request.

## License

MIT License. See [LICENSE](LICENSE) for details.

## Support

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [shadcn/ui](https://ui.shadcn.com/)
- Issues: Open a GitHub issue.