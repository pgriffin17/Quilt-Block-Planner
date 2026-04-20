/**
 * SVG Importer module
 * Handles importing SVG files and converting to block format
 */

const SVGImporter = (() => {
  const gridSize = 50;

  /**
   * Parse SVG content to block data
   */
  function parseSvgToBlock(svgContent) {
    const data = {
      squares: [],
      triangles: [],
      primaryColor: '#ff0000',
      secondaryColor: '#00ff00',
      gridRows: 10,
      gridCols: 10,
    };

    try {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');

      // Check for parse errors
      if (svgDoc.documentElement.nodeName === 'parsererror') {
        throw new Error('Invalid SVG format');
      }

      // Extract SVG dimensions to determine grid size
      const svgElement = svgDoc.documentElement;
      const viewBox = svgElement.getAttribute('viewBox');
      const width = svgElement.getAttribute('width');
      const height = svgElement.getAttribute('height');

      // Try to determine grid dimensions from viewBox or width/height
      if (viewBox) {
        const parts = viewBox.split(/[\s,]+/);
        const vbWidth = parseInt(parts[2]);
        const vbHeight = parseInt(parts[3]);
        data.gridCols = Math.ceil(vbWidth / gridSize);
        data.gridRows = Math.ceil(vbHeight / gridSize);
      } else if (width && height) {
        data.gridCols = Math.ceil(parseInt(width) / gridSize);
        data.gridRows = Math.ceil(parseInt(height) / gridSize);
      }

      // Extract rectangles (grid squares)
      const rects = svgDoc.querySelectorAll('rect');
      rects.forEach(rect => {
        const x = parseInt(rect.getAttribute('x')) || 0;
        const y = parseInt(rect.getAttribute('y')) || 0;
        const fill = rect.getAttribute('fill') || '#ffffff';
        const width = parseInt(rect.getAttribute('width')) || gridSize;
        const height = parseInt(rect.getAttribute('height')) || gridSize;

        // Only add colored squares (not white background)
        if (fill && fill !== '#ffffff' && fill !== 'white') {
          const col = Math.round(x / gridSize);
          const row = Math.round(y / gridSize);
          data.squares.push({ row, col, color: fill });
          data.primaryColor = fill;
        }
      });

      // Extract polygons (triangles)
      const polygons = svgDoc.querySelectorAll('polygon');
      polygons.forEach(poly => {
        const points = poly.getAttribute('points');
        const fill = poly.getAttribute('fill') || '#00ff00';

        if (points) {
          // Parse points string "x1,y1 x2,y2 x3,y3" into array
          const parsedPoints = points
            .trim()
            .split(/[\s]+/)
            .map(point => {
              const [x, y] = point.split(',').map(parseFloat);
              return [x, y];
            });

          if (parsedPoints.length >= 3) {
            data.triangles.push({
              points: parsedPoints,
              color: fill,
            });
            data.secondaryColor = fill;
          }
        }
      });
    } catch (err) {
      console.warn('Warning: Could not fully parse SVG:', err.message);
    }

    return data;
  }

  /**
   * Import SVG from file
   */
  function importFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const svgContent = event.target.result;
          const blockData = parseSvgToBlock(svgContent);
          resolve(blockData);
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      if (file.type !== 'image/svg+xml' && !file.name.endsWith('.svg')) {
        reject(new Error('Invalid file type. Please select an SVG file.'));
      } else {
        reader.readAsText(file);
      }
    });
  }

  return {
    parseSvgToBlock,
    importFromFile,
  };
})();
