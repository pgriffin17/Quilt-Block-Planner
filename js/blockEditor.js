/**
 * Block Editor module
 * Handles grid creation, square/triangle drawing, and editing
 */

const BlockEditor = (() => {
  const gridSize = 50;
  const vertexRadius = 5;
  const vertexProximity = 15;

  let draw = null;
  let state = null;
  let vertices = [];
  let selectedVertices = [];
  let changeCallback = null;

  /**
   * Initialize the editor
   */
  function initialize(containerId, onChangeCallback) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }

    draw = SVG().addTo(container);
    
    // Get the SVG element and ensure it fills the container
    const svgElement = draw.node;
    svgElement.style.width = '100%';
    svgElement.style.height = '100%';
    svgElement.style.display = 'block';
    
    changeCallback = onChangeCallback;
  }

  /**
   * Set the initial state
   */
  function setState(blockState) {
    state = JSON.parse(JSON.stringify(blockState));
    redraw();
  }

  /**
   * Get current state
   */
  function getState() {
    return JSON.parse(JSON.stringify(state));
  }

  /**
   * Create the grid
   */
  function redraw() {
    if (!draw) return;
    
    draw.clear();
    vertices = [];
    selectedVertices = [];

    // Draw white background squares
    for (let row = 0; row < state.gridRows; row++) {
      for (let col = 0; col < state.gridCols; col++) {
        drawSquare(row, col, '#ffffff');
      }
    }

    // Draw colored squares
    for (const square of state.squares) {
      drawSquare(square.row, square.col, square.color);
    }

    // Draw vertices
    for (let row = 0; row <= state.gridRows; row++) {
      for (let col = 0; col <= state.gridCols; col++) {
        createVertex(col * gridSize, row * gridSize);
      }
    }

    // Draw triangles
    for (const triangle of state.triangles) {
      const points = triangle.points.map(p => [p[0], p[1]]);
      const poly = draw
        .polygon(points)
        .fill(triangle.color || state.secondaryColor)
        .addClass('triangle');
      poly.click(() => handleTriangleClick(poly, triangle));
    }

    updateSVGSize();
  }

  /**
   * Draw a single square
   */
  function drawSquare(row, col, color) {
    const x = col * gridSize;
    const y = row * gridSize;
    const square = draw
      .rect(gridSize, gridSize)
      .attr({ fill: color, stroke: '#000000', 'stroke-width': 1 })
      .move(x, y)
      .addClass('grid-square');

    square.click(() => handleSquareClick(square, row, col));
  }

  /**
   * Create a vertex
   */
  function createVertex(x, y) {
    const group = draw.group().addClass('vertex-group');

    const vertex = group
      .circle(vertexRadius * 2)
      .attr({ fill: '#000000' })
      .center(x, y)
      .addClass('grid-vertex');

    const hitCircle = group
      .circle(vertexProximity * 2)
      .attr({ fill: '#ffffff', opacity: 0 })
      .center(x, y)
      .addClass('grid-vertex-hit');

    hitCircle.mouseover(() => {
      hitCircle.attr({ cursor: 'pointer' });
      vertex.fill('#00cccc');
    });

    hitCircle.mouseout(() => {
      if (vertex.attr('fill') !== '#0000ff') {
        vertex.fill('#000000');
      }
    });

    hitCircle.click(() => handleVertexClick(vertex, x, y));

    vertices.push({ element: vertex, x, y });
  }

  /**
   * Handle square click
   */
  function handleSquareClick(square, row, col) {
    const currentColor = square.attr('fill');
    const newColor = currentColor === '#ffffff' ? state.primaryColor : '#ffffff';

    // Update square in state
    const existingIndex = state.squares.findIndex(s => s.row === row && s.col === col);
    
    if (newColor === '#ffffff') {
      // Remove from colored squares
      if (existingIndex >= 0) {
        state.squares.splice(existingIndex, 1);
      }
    } else {
      // Add or update colored square
      if (existingIndex >= 0) {
        state.squares[existingIndex].color = newColor;
      } else {
        state.squares.push({ row, col, color: newColor });
      }
    }

    // Clear selected vertices
    clearSelectedVertices();

    // Update UI
    square.fill(newColor);
    notifyChange();
  }

  /**
   * Handle vertex click to select for triangle drawing
   */
  function handleVertexClick(vertex, x, y) {
    if (selectedVertices.find(v => v.element === vertex)) {
      // Deselect
      vertex.fill('#000000');
      selectedVertices = selectedVertices.filter(v => v.element !== vertex);
    } else {
      // Select
      vertex.fill('#0000ff');
      selectedVertices.push({ element: vertex, x, y });

      // If 3 vertices selected, draw triangle
      if (selectedVertices.length === 3) {
        drawTriangleFromSelection();
        clearSelectedVertices();
      }
    }
  }

  /**
   * Draw triangle from selected vertices
   */
  function drawTriangleFromSelection() {
    const points = selectedVertices.map(v => [v.x, v.y]);
    const poly = draw
      .polygon(points)
      .fill(state.secondaryColor)
      .addClass('triangle');

    const triangle = { points, color: state.secondaryColor };
    state.triangles.push(triangle);

    poly.click(() => handleTriangleClick(poly, triangle));
    notifyChange();
  }

  /**
   * Handle triangle click
   */
  function handleTriangleClick(poly, triangle) {
    if (document.getElementById('triangleRemoval').checked) {
      // Remove triangle
      const index = state.triangles.indexOf(triangle);
      if (index >= 0) {
        state.triangles.splice(index, 1);
      }
      poly.remove();
      notifyChange();
    }
  }

  /**
   * Clear selected vertices
   */
  function clearSelectedVertices() {
    selectedVertices.forEach(v => v.element.fill('#000000'));
    selectedVertices = [];
  }

  /**
   * Toggle grid visibility
   */
  function toggleGrid() {
    const gridSquares = document.querySelectorAll('.grid-square');
    const gridVertices = document.querySelectorAll('.grid-vertex');

    gridSquares.forEach(square => {
      const currentStroke = window.getComputedStyle(square).stroke;
      const newStroke = currentStroke === 'none' ? '#000000' : 'none';
      square.style.stroke = newStroke;
    });

    gridVertices.forEach(vertex => {
      const currentOpacity = window.getComputedStyle(vertex).opacity;
      vertex.style.opacity = currentOpacity === '0' || currentOpacity === '0.0' ? '1' : '0';
    });
  }

  /**
   * Update grid size
   */
  function setGridSize(rows, cols) {
    state.gridRows = rows;
    state.gridCols = cols;
    redraw();
    notifyChange();
  }

  /**
   * Set primary color
   */
  function setPrimaryColor(color) {
    state.primaryColor = color;
  }

  /**
   * Set secondary color
   */
  function setSecondaryColor(color) {
    state.secondaryColor = color;
  }

  /**
   * Update SVG container size
   */
  function updateSVGSize() {
    if (!draw) return;
    
    // Get the actual DOM element (draw.node is the SVG element, its parent is the container)
    const svgElement = draw.node;
    const container = svgElement.parentElement;
    
    if (!container) {
      console.error('Container element not found');
      return;
    }
    
    const { width, height } = container.getBoundingClientRect();
    
    // Ensure we have positive dimensions, fallback to minimum size
    const svgWidth = width > 0 ? width : 500;
    const svgHeight = height > 0 ? height : 500;
    
    // Calculate viewBox to include all vertices with proper padding
    // Vertices extend vertexRadius (5px) beyond grid corners
    const vertexPadding = vertexRadius + 5; // 5px extra margin
    const viewWidth = state.gridCols * gridSize + (vertexPadding * 2);
    const viewHeight = state.gridRows * gridSize + (vertexPadding * 2);
    const viewX = -vertexPadding;
    const viewY = -vertexPadding;
    
    // Set SVG size and viewBox
    draw.size(svgWidth, svgHeight);
    draw.viewbox(`${viewX} ${viewY} ${viewWidth} ${viewHeight}`);
  }

  /**
   * Clear the grid
   */
  function clear() {
    state.squares = [];
    state.triangles = [];
    clearSelectedVertices();
    redraw();
    notifyChange();
  }

  /**
   * Notify change listeners
   */
  function notifyChange() {
    if (changeCallback) {
      changeCallback(getState());
    }
  }

  return {
    initialize,
    setState,
    getState,
    redraw,
    setGridSize,
    setPrimaryColor,
    setSecondaryColor,
    toggleGrid,
    clear,
    updateSVGSize,
  };
})();
