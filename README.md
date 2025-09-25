# RFI Dashboard

A modern web application for tracking and managing Request for Information (RFI) items. Built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui components.

## Features

- **Data Management**: Loads RFI data from JSON (primary) with CSV fallback
- **Interactive Table**: Sortable, searchable, and paginated data grid
- **Conditional Formatting**: Color-coded days late indicators
- **Actions**: Direct links to Procore and email reminders
- **Real-time Updates**: Refresh button to fetch latest data
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Mode Support**: Toggle between light and dark themes

## Setup

1. **Place your data files** in the `/data` directory:
   - `rfis_final.json` (primary data source)
   - `rfis_final_with_days_late.csv` (fallback data source)

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser** to `http://localhost:3000`

## Data Format

The application expects RFI data with the following fields:

- `number`: RFI number (string)
- `subject`: RFI subject/title (string)
- `status`: RFI status (string, optional)
- `ball_in_court`: Responsible parties (string)
- `due_date`: Due date (YYYY-MM-DD or timestamp)
- `days_late`: Number of days late (number)
- `last_change_of_court`: Last change timestamp (YYYY-MM-DD HH:MM or "N/A")
- `days_in_court`: Days in current court ("N/A" or number as string)
- `mailto_reminder`: Email reminder link (mailto: URL)
- `link`: Procore RFI URL (string)
- `last_reminder_date`: Last reminder date (string, usually empty)
- `notes`: Additional notes (string, usually empty)

## Customization

### Columns
To modify the table columns, edit the `columns` array in `src/components/RfiTable.tsx`.

### Styling
- Days late colors can be adjusted in `src/lib/date.ts`
- Global styles are in `src/app/globals.css`
- Component styles use Tailwind CSS classes

### Data Sources
- Modify the data loading logic in `src/lib/loadRfis.ts`
- Update the API route in `src/app/api/rfis/route.ts`

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **Table**: TanStack Table
- **Validation**: Zod
- **Icons**: Lucide React

## Security

- No secrets are exposed to the client
- API routes only read files from the `/data` directory
- No direct calls to external APIs from the browser
- All data validation is performed server-side