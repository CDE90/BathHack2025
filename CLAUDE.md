# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands
- `pnpm dev`: Run development server with Turbo
- `pnpm build`: Build the Next.js application
- `pnpm start`: Start the production server
- `pnpm preview`: Build and preview the production app
- `pnpm lint`: Run ESLint checks
- `pnpm lint:fix`: Run ESLint and fix issues
- `pnpm typecheck`: Run TypeScript type checking
- `pnpm check`: Run both lint and typecheck
- `pnpm format:check`: Check formatting with Prettier
- `pnpm format:write`: Format code with Prettier

## Code Style Guidelines
- **Formatting**: Use 4 spaces for indentation with Prettier
- **Imports**: Use `import type` for type imports, prefer inline type imports
- **Types**: Use strict TypeScript typing, avoid type assertions when possible
- **Naming**: Use PascalCase for components, camelCase for variables and functions
- **Error Handling**: Use try/catch blocks with proper error logging
- **Components**: Follow React best practices with Next.js App Router conventions
- **CSS**: Use Tailwind CSS utilities with shadcn/ui components
- **API Calls**: Use structured error handling with proper status codes in responses
- **Unused Variables**: Prefix unused variables with underscore (_)