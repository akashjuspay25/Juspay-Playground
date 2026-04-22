# Juspay Playground

Interactive playground for Juspay HyperCheckout SDK integration. Built with React + TypeScript + Vite.

![Juspay Playground](https://github.com/user-attachments/assets/placeholder.png)

## Features

- **AI Assistant** - Smart assistant for Juspay integration queries
- **App Integrator** - Real-time SDK integration wizard with:
  - Merchant credential configuration
  - Codebase folder upload and analysis
  - Automatic SDK code generation
  - Live preview with simulated HyperCheckout flow
- **Debugger** - API testing and debugging tools

## Tech Stack

- React 19
- TypeScript
- Vite 6
- Tailwind CSS 4
- Framer Motion
- shadcn/ui components
- Juspay HyperCheckout SDK

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

### Netlify (Recommended)

1. Push to GitHub
2. Connect repo at [netlify.com](https://netlify.com)
3. Build settings auto-detected from `netlify.toml`

Or deploy via CLI:
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

## Environment Variables

Copy `.env.example` to `.env` and configure:
- `GEMINI_API_KEY` - For AI features (optional)
- `ANTHROPIC_API_KEY` - For Claude integration (optional)

## License

MIT © Juspay
