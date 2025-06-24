# Shabbat Times Multi-Location App

A web application that displays Shabbat start and end times across multiple locations, designed to help users coordinate meetings and travel while observing Shabbat.

## Features

- **Multi-Location Support**: Add unlimited locations to track Shabbat times
- **Smart Auto-Complete**: Location suggestions with support for cities and zip codes
- **Timezone Coordination**: All times displayed in both local and home timezones
- **Planning Summary**: Shows earliest start and latest end times for easy scheduling
- **International Support**: Works with cities worldwide and US zip codes

## Technology Stack

- **Frontend**: React 18 with TypeScript, Vite, TailwindCSS, shadcn/ui
- **Backend**: Node.js with Express, TypeScript
- **Data**: Hebcal API for accurate Jewish calendar times
- **State Management**: TanStack Query for server state
- **Validation**: Zod schemas for type-safe data handling

## Getting Started

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5000`

### Building for Production

```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Deployment

#### Replit (Recommended)
The app is configured for Replit autoscale deployment:
- Build command: `npm run build`
- Start command: `npm run start`
- Port: 5000 → 80

#### Vercel
The app includes Vercel configuration:
```bash
# Deploy to Vercel
vercel --prod
```

## Project Structure

```
├── client/               # React frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Route pages
│   │   └── lib/          # Utilities
├── server/               # Express backend
│   ├── index.ts          # Server entry point
│   └── routes.ts         # API routes
├── shared/               # Shared types and schemas
├── api/                  # Vercel serverless functions
└── dist/                 # Build output
```

## API Endpoints

- `GET /api/locations/suggest?q={query}` - Location autocomplete
- `POST /api/shabbat-times` - Get Shabbat times for locations

### Request Format

```json
{
  "homeLocation": "New York, NY",
  "locations": ["London, UK", "Jerusalem, Israel"]
}
```

## Usage

1. **Set Home Location**: Enter your primary location (home timezone)
2. **Add Locations**: Add additional locations you want to track
3. **View Times**: See Shabbat times in both local and home timezones
4. **Plan Coordination**: Use the summary to schedule calls and meetings

## Environment Variables

- `NODE_ENV` - Environment (development/production)
- `DATABASE_URL` - PostgreSQL connection (optional, uses memory storage by default)

## Contributing

This app uses modern web development practices:
- TypeScript for type safety
- Zod for runtime validation
- TailwindCSS for styling
- React Query for data fetching

## License

MIT License - see package.json for details