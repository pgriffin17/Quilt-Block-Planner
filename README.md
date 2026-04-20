# Quilt Block Planner

A web-based quilt block design tool that lets you create custom quilt block patterns, save them locally, and export as SVG files for use in Inkscape.

**Live Demo:** https://pgriffin17.github.io/Quilt-Block-Planner/

## Features

✅ **Design Quilt Blocks** — Draw patterns on an interactive grid  
✅ **Undo/Redo** — Full state history for your edits  
✅ **Save & Load** — Persist your blocks locally (browser storage on GitHub Pages, database on backend)  
✅ **SVG Export** — Download blocks as SVG files  
✅ **SVG Import** — Load and edit existing SVG patterns  
✅ **Color Customization** — Independent colors for squares and triangles  
✅ **Adjustable Grid** — Grid sizes from 2×2 to 20×20  

## Project Structure

```
Quilt-Block-Planner/
├── backend/                    # Node.js + Express + SQLite backend
│   ├── server.js              # Express server entry point
│   ├── package.json           # Backend dependencies
│   ├── db/
│   │   └── init.js            # SQLite setup
│   ├── routes/
│   │   └── blocks.js          # API endpoints
│   ├── controllers/
│   │   └── blockController.js # Business logic
│   ├── models/
│   │   └── Block.js           # Database queries
│   └── public/                # Frontend files (single source of truth)
│       ├── index.html
│       ├── style.css
│       └── js/
│           ├── app.js
│           ├── apiClient.js   # Auto-detects environment
│           ├── blockEditor.js
│           ├── undoRedo.js
│           ├── svgExporter.js
│           ├── svgImporter.js
│           └── ... (other modules)
├── deploy-to-gh-pages.sh      # Deployment script (macOS/Linux)
├── deploy-to-gh-pages.bat     # Deployment script (Windows)
└── README.md

```

## Quick Start

### Option 1: Local Backend (Full Functionality)

```bash
cd backend
npm install
npm start
```

Then open http://localhost:3000 in your browser.

**Features:**
- Server-side persistence (SQLite database)
- Blocks saved permanently
- All CRUD operations available

### Option 2: GitHub Pages (Temporary, No Backend)

The GitHub Pages version uses browser localStorage instead of a database.

**Available at:** https://pgriffin17.github.io/Quilt-Block-Planner/

**Features:**
- All design tools work
- Blocks saved in browser storage only (~5MB limit)
- Clears if you delete browser data or use incognito mode
- Not synced across devices

## Development

**Tech Stack:**
- **Frontend:** Vanilla JavaScript + SVG.js + HTML5
- **Backend:** Node.js + Express + SQLite
- **Styling:** CSS3 with responsive design

**Key Libraries:**
- [svg.js](https://svgjs.dev/) — Vector graphics library
- [express](https://expressjs.com/) — Web framework
- [sqlite3](https://www.sqlite.org/) — Lightweight database

## Deployment to GitHub Pages

The app automatically detects its environment:
- **Running on localhost** → Uses Express API backend
- **Running on GitHub Pages** → Uses localStorage

### Setup GitHub Pages

1. Go to your GitHub repository settings
2. Navigate to **Pages** section
3. Set source to **Deploy from a branch**
4. Select **gh-pages** branch and **/root** folder
5. Save

### Deploy Your Changes

When you want to update GitHub Pages:

**On macOS/Linux:**
```bash
./deploy-to-gh-pages.sh
```

**On Windows:**
```bash
deploy-to-gh-pages.bat
```

This script will:
1. Create the `gh-pages` branch if it doesn't exist
2. Copy files from `backend/public/` to `gh-pages`
3. Commit and push to GitHub
4. Return to your current branch

### Manual Deployment

If you prefer to deploy manually:

```bash
# Switch to gh-pages branch
git checkout gh-pages

# Copy files from backend/public
cp -r backend/public/* .

# Commit and push
git add -A
git commit -m "Deploy: Update GitHub Pages"
git push origin gh-pages

# Return to main branch
git checkout main
```

## How It Works

### Edit Mode
1. Click grid squares to toggle colors
2. Select 3 vertices to draw triangles
3. Adjust colors with the color pickers
4. Use Undo/Redo to manage changes

### Save/Load
- **Save Block** → Stores block data (localStorage on GitHub Pages, database on backend)
- **Load Block** → Browse and restore previous designs
- **New Block** → Clear canvas and start fresh

### Import/Export
- **Export SVG** → Download as `.svg` file for use in Inkscape
- **Import SVG** → Upload and edit existing SVG patterns

## Block Data Format

Blocks are stored as JSON internally:

```json
{
  "id": "unique_id",
  "name": "My Block",
  "description": "Block description",
  "gridRows": 6,
  "gridCols": 6,
  "data": {
    "primaryColor": "#ff0000",
    "secondaryColor": "#00ff00",
    "squares": [
      { "row": 0, "col": 1, "color": "#ff0000" },
      { "row": 1, "col": 0, "color": "#ff0000" }
    ],
    "triangles": [
      { "points": [[50,50], [100,50], [75,100]], "color": "#00ff00" }
    ]
  }
}
```

## Storage Comparison

| Feature | GitHub Pages | Backend Server |
|---------|-------------|----------------|
| Storage | Browser localStorage (~5MB) | SQLite database (unlimited) |
| Persistence | Session/Browser only | Permanent |
| Sync Devices | ❌ No | ✅ Yes (with auth) |
| Data Loss Risk | ⚠️ High (cache clear, incognito) | ✅ Low |
| Setup | ✅ None (goes live immediately) | Requires Node.js + hosting |

## Future Roadmap

- [ ] User authentication & accounts
- [ ] Block library & templates
- [ ] Quilt planner (compose blocks into full quilts)
- [ ] Public block exchange website
- [ ] Mobile app
- [ ] Collaborative editing
- [ ] More shape types (squares, hexagons, custom)

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

## Troubleshooting

### Buttons not working?
- Check browser console (F12) for errors
- Verify all JS files loaded successfully
- Clear browser cache

### Blocks not saving?
- **GitHub Pages:** Check browser storage limit (localStorage quota)
- **Backend:** Ensure Node.js server is running
- Try exporting as SVG as backup

### SVG Import not working?
- Verify SVG file is valid and contains rectangles/polygons
- Complex SVGs may not parse correctly
- Try exporting a block and re-importing it

## Contributing

This is a personal project. Feel free to fork and modify for your own use!

## License

MIT

## Credits

Built with [svg.js](https://svgjs.dev/) for vector graphics manipulation.

