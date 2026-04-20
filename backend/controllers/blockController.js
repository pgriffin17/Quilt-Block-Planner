const Block = require('../models/Block');

// Save or update a block
async function saveBlock(req, res) {
  try {
    const { id, name, description, gridRows, gridCols, data } = req.body;

    if (!name || !gridRows || !gridCols || !data) {
      return res.status(400).json({ error: 'Missing required fields: name, gridRows, gridCols, data' });
    }

    if (id) {
      // Update existing block
      const result = await Block.update(id, name, description, gridRows, gridCols, data);
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Block not found' });
      }
      res.json({ id, message: 'Block updated successfully' });
    } else {
      // Create new block
      const result = await Block.create(name, description, gridRows, gridCols, data);
      res.status(201).json({ id: result.id, message: 'Block created successfully' });
    }
  } catch (err) {
    console.error('Error saving block:', err);
    res.status(500).json({ error: 'Failed to save block', message: err.message });
  }
}

// Get a specific block
async function getBlock(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Block ID is required' });
    }

    const block = await Block.getById(id);
    if (!block) {
      return res.status(404).json({ error: 'Block not found' });
    }

    res.json(block);
  } catch (err) {
    console.error('Error getting block:', err);
    res.status(500).json({ error: 'Failed to get block', message: err.message });
  }
}

// List all blocks
async function listBlocks(req, res) {
  try {
    const userId = req.query.userId || null;
    const blocks = await Block.getAll(userId);
    res.json(blocks);
  } catch (err) {
    console.error('Error listing blocks:', err);
    res.status(500).json({ error: 'Failed to list blocks', message: err.message });
  }
}

// Delete a block
async function deleteBlock(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Block ID is required' });
    }

    const result = await Block.delete(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Block not found' });
    }

    res.json({ message: 'Block deleted successfully' });
  } catch (err) {
    console.error('Error deleting block:', err);
    res.status(500).json({ error: 'Failed to delete block', message: err.message });
  }
}

// Set block as public/private
async function setBlockPublic(req, res) {
  try {
    const { id } = req.params;
    const { isPublic } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Block ID is required' });
    }

    if (isPublic === undefined) {
      return res.status(400).json({ error: 'isPublic is required' });
    }

    const result = await Block.setPublic(id, isPublic);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Block not found' });
    }

    res.json({ message: `Block is now ${isPublic ? 'public' : 'private'}` });
  } catch (err) {
    console.error('Error updating block visibility:', err);
    res.status(500).json({ error: 'Failed to update block visibility', message: err.message });
  }
}

// Import SVG and convert to block format
async function importSvg(req, res) {
  try {
    const { svgContent, name, gridRows, gridCols } = req.body;

    if (!svgContent) {
      return res.status(400).json({ error: 'SVG content is required' });
    }

    // Parse SVG to extract blocks
    const blockData = parseSvgToBlock(svgContent);

    res.json({
      ...blockData,
      name: name || 'Imported Block',
      gridRows: gridRows || blockData.gridRows || 10,
      gridCols: gridCols || blockData.gridCols || 10
    });
  } catch (err) {
    console.error('Error importing SVG:', err);
    res.status(500).json({ error: 'Failed to import SVG', message: err.message });
  }
}

// Export block as SVG
async function exportSvg(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'Block ID is required' });
    }

    const block = await Block.getById(id);
    if (!block) {
      return res.status(404).json({ error: 'Block not found' });
    }

    const svgContent = generateSvgFromBlock(block);
    res.set('Content-Type', 'image/svg+xml');
    res.set('Content-Disposition', `attachment; filename="${block.name}.svg"`);
    res.send(svgContent);
  } catch (err) {
    console.error('Error exporting SVG:', err);
    res.status(500).json({ error: 'Failed to export SVG', message: err.message });
  }
}

// Helper: Parse SVG content to block data
function parseSvgToBlock(svgContent) {
  const data = {
    squares: [],
    triangles: [],
    primaryColor: '#ff0000',
    secondaryColor: '#00ff00',
    gridRows: 10,
    gridCols: 10
  };

  try {
    // Extract rectangles (grid squares)
    const rectRegex = /<rect[^>]*?x="([^"]*)"[^>]*?y="([^"]*)"[^>]*?fill="([^"]*)"[^>]*?\/>/g;
    let match;
    while ((match = rectRegex.exec(svgContent)) !== null) {
      const x = parseInt(match[1]) / 50; // Assuming 50px squares
      const y = parseInt(match[2]) / 50;
      const color = match[3];

      if (color && color !== '#ffffff') {
        data.squares.push({ row: y, col: x, color });
        data.primaryColor = color;
      }
    }

    // Extract polygons (triangles)
    const polyRegex = /<polygon[^>]*?points="([^"]*)"[^>]*?fill="([^"]*)"[^>]*?\/>/g;
    while ((match = polyRegex.exec(svgContent)) !== null) {
      const points = match[1];
      const color = match[2];

      data.triangles.push({ points, color });
      data.secondaryColor = color;
    }
  } catch (err) {
    console.warn('Warning: Could not fully parse SVG:', err.message);
  }

  return data;
}

// Helper: Generate SVG from block data
function generateSvgFromBlock(block) {
  const data = block.data;
  const gridSize = 50;
  const width = block.grid_cols * gridSize;
  const height = block.grid_rows * gridSize;

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<!-- ${block.name} -->
<!-- Created: ${block.created_at} -->
<!-- Grid: ${block.grid_rows}x${block.grid_cols} -->
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
`;

  // Draw white background squares
  for (let row = 0; row < block.grid_rows; row++) {
    for (let col = 0; col < block.grid_cols; col++) {
      const x = col * gridSize;
      const y = row * gridSize;
      svg += `  <rect x="${x}" y="${y}" width="${gridSize}" height="${gridSize}" fill="#ffffff" stroke="none"/>\n`;
    }
  }

  // Draw colored squares
  if (data.squares && Array.isArray(data.squares)) {
    for (const square of data.squares) {
      const x = square.col * gridSize;
      const y = square.row * gridSize;
      const color = square.color || data.primaryColor || '#ff0000';
      svg += `  <rect x="${x}" y="${y}" width="${gridSize}" height="${gridSize}" fill="${color}" stroke="none"/>\n`;
    }
  }

  // Draw triangles
  if (data.triangles && Array.isArray(data.triangles)) {
    for (const triangle of data.triangles) {
      const color = triangle.color || data.secondaryColor || '#00ff00';
      svg += `  <polygon points="${triangle.points}" fill="${color}" stroke="none"/>\n`;
    }
  }

  svg += `</svg>`;
  return svg;
}

module.exports = {
  saveBlock,
  getBlock,
  listBlocks,
  deleteBlock,
  setBlockPublic,
  importSvg,
  exportSvg
};
