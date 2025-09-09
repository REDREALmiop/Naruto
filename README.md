# Naruto

Simple Naruto roleplay web app with secure session login, theme toggling, character creation and editing, plus a basic AI chat.

## Development
Open `index.html` in a browser to try the app locally. The API routes run as Vercel serverless functions.

### Environment variables
- `APP_PASSWORD_HASH`: SHA-256 hex of the login password.
- `JWT_SECRET`: secret used to sign session tokens.
- `OPENAI_API_KEY`: required for the chat endpoint.

## Testing
Install dependencies and run the unit tests:

```bash
npm install
npm test
```

## Deploy to Vercel
1. Install the [Vercel CLI](https://vercel.com/docs/cli) and run `vercel` in this directory.
2. The included `vercel.json` handles routing for the SPA and exposes the `/api` endpoints.
