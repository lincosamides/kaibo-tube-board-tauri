# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and Typescript in Vite.

## Setup

### Prerequisites

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Set up TFL API access:
   - Get your API key from [TFL API Portal](https://api-portal.tfl.gov.uk/)
   - Copy `.env.local.example` to `.env.local`
   - Add your API key to `.env.local`:
     ```
     NEXT_PUBLIC_TFL_APP_KEY=your_tfl_api_key_here
     ```

### Development

```bash
# Start the development server
pnpm dev

# Or run the Tauri app
pnpm tauri dev
```

### Production Build

```bash
# Build for static export
pnpm build

# Build Tauri app
pnpm tauri build
```

## Architecture Notes

This application uses Next.js with static export (`output: 'export'`) for compatibility with Tauri. All TFL API calls are made client-side and cached in localStorage instead of using server actions.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
