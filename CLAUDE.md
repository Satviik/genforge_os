@AGENTS.md

# GenForge OS

## Project

GenForge OS is an internal business management platform for a 3D-printing
startup.

## Tech Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui Base UI
- MongoDB Atlas
- Mongoose
- Zod
- Recharts
- React Flow
- Framer Motion
- Lucide React
- pnpm

## Important Domain Rules

Team members are internal GenForge marketing/sales employees.

Customers are people who purchase GenForge products.

Never use "customer" when referring to an internal team member.

## UI

Preserve the existing GenForge visual identity:

- Near-black background
- Dark brown surfaces
- GenForge orange accents
- Warm white typography
- Subtle orange glow
- Futuristic industrial aesthetic

Do not replace the existing dashboard with a generic SaaS design.

## Architecture

Keep components modular.

Do not put large amounts of application logic inside page.tsx.

Keep database access on the server.

Never expose MongoDB credentials to the client.

Use Zod for validating user input.

## Development

Before making large changes:

1. Inspect the existing implementation.
2. Reuse existing components.
3. Avoid unnecessary dependencies.
4. Run TypeScript checks.
5. Run lint.
6. Test the affected functionality.

Do not rewrite working parts of the application unnecessarily.