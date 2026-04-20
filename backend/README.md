# Quilt Block Planner - Backend

Node.js + Express backend for the Quilt Block Planner application. Provides REST API for managing quilt block designs and persistence.

## Features

- **Block Management**: Create, read, update, and delete quilt block designs
- **SVG Import/Export**: Convert between block formats and SVG
- **Local Storage**: Persistent storage using SQLite
- **RESTful API**: Standard HTTP REST endpoints
- **Extensible**: Ready for authentication, user accounts, and public block sharing

## Project Structure

```
backend/
├── db/                    # Database initialization
│   └── init.js           # SQLite setup and migrations
├── models/               # Data models
│   └── Block.js          # Block database model
├── controllers/          # Business logic
│   └── blockController.js
├── routes/              # API route definitions
│   └── blocks.js
├── public/              # Frontend files (served by Express)
│   ├── index.html
│   ├── style.css
│   └── js/
│       ├── app.js                # Main app controller
│       ├── blockEditor.js        # Block editing logic
│       ├── apiClient.js          # API communication
│       ├── undoRedo.js           # History management
│       ├── svgExporter.js        # SVG export
│       └── svgImporter.js        # SVG import
├── package.json
├── server.js            # Express app entry point
└── .gitignore
```

## Setup

### Prerequisites

- Node.js 14+ 
- npm or yarn

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

### Running the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Blocks

- `GET /api/blocks` - List all blocks
- `POST /api/blocks` - Create a new block
- `GET /api/blocks/:id` - Get specific block
- `PUT /api/blocks/:id` - Update block (coming soon)
- `DELETE /api/blocks/:id` - Delete block

### Block Operations

- `GET /api/blocks/:id/export` - Export block as SVG
- `POST /api/blocks/import/svg` - Import SVG as block
- `PUT /api/blocks/:id/public` - Set block visibility

## Data Format

### Block State Object

```javascript
{
  id: number,                          // Database ID
  name: string,                        // Block name
  description: string,                 // Optional description
  gridRows: number,                    // Grid height (number of rows)
  gridCols: number,                    // Grid width (number of columns)
  data: {
    primaryColor: string,              // Square color (hex)
    secondaryColor: string,            // Triangle color (hex)
    squares: [
      {
        row: number,
        col: number,
        color: string (hex)
      },
      // ... more squares
    ],
    triangles: [
      {
        points: [[x, y], [x, y], [x, y]],  // 3 vertices
        color: string (hex)
      },
      // ... more triangles
    ]
  },
  created_at: datetime,
  updated_at: datetime
}
```

## Database Schema

### blocks table

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PRIMARY KEY | Auto-increment |
| name | TEXT NOT NULL | Block name |
| description | TEXT | Optional description |
| grid_rows | INTEGER NOT NULL | Grid height |
| grid_cols | INTEGER NOT NULL | Grid width |
| data | TEXT NOT NULL | Block data as JSON |
| is_public | INTEGER | 1=public, 0=private (future) |
| user_id | TEXT | For user accounts (future) |
| created_at | DATETIME | Auto-set |
| updated_at | DATETIME | Auto-updated |

## Future Enhancements

- User authentication and accounts
- User profiles and personal block libraries
- Public block share (marketplace)
- Quilt planner for designing full quilts
- Collaborative editing
- Block templates and library
- Export to different formats (PDF, PNG, etc.)

## Environment Variables

- `PORT` - Server port (default: 3000)
- `DB_PATH` - SQLite database file path (default: ./db/blocks.sqlite)
- `NODE_ENV` - Environment (development/production)

## Troubleshooting

**Port already in use:**
```bash
# Use a different port
PORT=3001 npm start
```

**Database locked error:**
This can happen if multiple instances are accessing the database. Close other instances and try again.

**Import issues:**
- Ensure SVG file has proper formatting
- SVG must contain rect elements for squares and polygon elements for triangles

## Development Notes

- SQLite database is stored in `backend/db/blocks.sqlite`
- All state changes trigger a history entry for undo/redo
- SVG parsing is best-effort; complex SVGs may not import perfectly
- The frontend is served from the `public/` directory via Express

## License

MIT
