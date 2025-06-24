# Shabbat Times Multi-Location App

## Overview

A web application that displays Shabbat start and end times across multiple locations, designed to help users coordinate meetings and travel while observing Shabbat. Users can input up to three locations (home, secondary, and tertiary) and view synchronized timing information to plan calls and activities that don't conflict with Shabbat observance.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript throughout the application
- **API Design**: RESTful endpoints with JSON responses
- **External APIs**: Hebcal API for Shabbat times with OpenStreetMap Nominatim fallback for geocoding
- **Data Validation**: Zod schemas shared between frontend and backend

### Key Components

#### Shared Schema (`/shared/schema.ts`)
- Type-safe data structures using Zod
- Location input validation
- Shabbat times response format
- Ensures consistency between frontend and backend

#### Frontend Components
- **LocationForm**: Input form for up to 3 locations with validation
- **ShabbatTimesDisplay**: Visual display of Shabbat times for each location
- **SummaryCard**: Planning summary with earliest start and latest end times
- **Custom UI Components**: Complete shadcn/ui component library

#### Backend Services
- **Route Handlers**: Location-based Shabbat time fetching
- **External API Integration**: Hebcal API with fallback geocoding
- **Error Handling**: Comprehensive error responses and validation

## Data Flow

1. **User Input**: User enters locations through the LocationForm component
2. **Validation**: Client-side validation using Zod schemas
3. **API Request**: POST request to `/api/shabbat-times` with location data
4. **External API Calls**: Server fetches data from Hebcal API for each location
5. **Data Processing**: Server calculates time zone conversions and summary information
6. **Response**: Structured response with Shabbat times and planning summary
7. **UI Update**: React Query manages cache and updates UI components

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Database connectivity (PostgreSQL prepared)
- **drizzle-orm & drizzle-kit**: Type-safe database ORM and migrations
- **@tanstack/react-query**: Server state management
- **react-hook-form & @hookform/resolvers**: Form handling with validation
- **wouter**: Lightweight routing
- **zod**: Runtime type validation and schema definition

### UI Dependencies
- **@radix-ui/***: Headless UI primitives for accessibility
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe CSS class variants
- **lucide-react**: Icon library

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type safety throughout the application
- **tsx**: TypeScript execution for development

## Deployment Strategy

### Environment Configuration
- **Development**: Local development with Vite dev server and hot reload
- **Production**: Static frontend build served by Express with API routes
- **Database**: PostgreSQL integration configured via Drizzle ORM
- **Environment Variables**: `DATABASE_URL` for database connection

### Build Process
1. **Frontend Build**: Vite builds React app to `dist/public`
2. **Backend Build**: esbuild bundles server code to `dist/index.js`
3. **Static Serving**: Express serves built frontend and handles API routes

### Deployment Target
- **Platform**: Replit autoscale deployment
- **Port Configuration**: Internal port 5000, external port 80
- **Process Management**: npm scripts for development and production

## Recent Changes

- June 24, 2025: Initial Shabbat times app setup with React frontend and Express backend
- June 24, 2025: Fixed location processing to handle both city names and zip codes correctly
- June 24, 2025: Implemented proper Hebcal API integration with zip code detection
- June 24, 2025: Added timezone conversion logic for multi-location coordination
- June 24, 2025: App now successfully displays different Shabbat times for different locations
- June 24, 2025: Added support for international locations with proper geoname ID mapping
- June 24, 2025: Fixed time parsing to handle both 12-hour (US) and 24-hour (international) formats
- June 24, 2025: App fully supports both US zip codes and international city names
- June 24, 2025: Added auto-complete functionality for location suggestions
- June 24, 2025: Enhanced location database with major international cities
- June 24, 2025: Improved user experience with keyboard navigation and search suggestions
- June 24, 2025: Disabled browser autocomplete to prevent interference with custom dropdown
- June 24, 2025: Added Portuguese cities (Faro, Evora, Porto, Coimbra, Braga) and Puerto Rican cities (Guaynabo, Caguas, Bayamon, Ponce)
- June 24, 2025: Added date display to "In Your Time Zone" section for clear coordination reference
- June 24, 2025: Fixed timezone conversion logic to properly handle fractional offsets and international locations
- June 24, 2025: Fixed planning summary to correctly identify earliest start and latest end times across all locations
- June 24, 2025: Enhanced schema to support flexible number of locations while maintaining backward compatibility
- June 24, 2025: Created LocationWidget with unlimited location support and auto-complete functionality
- June 24, 2025: Restored auto-complete suggestions in the new flexible location widget
- June 24, 2025: Fixed autocomplete dropdown focus/blur handling to prevent persistent dropdowns
- June 24, 2025: Simplified planning summary to show earliest start and latest end in home timezone with clear date information
- June 24, 2025: Added timezone labels and location sources throughout the UI for better clarity
- June 24, 2025: Added Vercel deployment configuration with proper API routing and static build setup

## User Preferences

Preferred communication style: Simple, everyday language.