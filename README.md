# Services.ReCom

Angular 19 landing page for ReCom lead capture — same design and behavior as the original static HTML page.

## Development

```bash
npm install
npm start
```

Runs at **http://localhost:8080**

## Configuration

Edit `src/environments/environment.ts`:

- `formEndpoint` — API URL for lead submission (default: `http://localhost:5000/api/recom/leads`)
- `videos` — overview and provident fund video URLs

## Build

```bash
npm run build
```

Output: `dist/services-recom`

## Legacy

The original static HTML version is preserved in `legacy/`.
