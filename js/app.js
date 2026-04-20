/**
 * Main Application module
 * Coordinates all other modules and manages UI interactions
 */

const App = (() => {
  let currentBlockId = null;
  let currentBlockName = 'Untitled Block';

  /**
   * Initialize the application
   */
  async function initialize() {
    // Initialize block editor
    BlockEditor.initialize('svgContainer', handleBlockChange);

    // Create initial state
    const initialState = {
      id: null,
      name: 'Untitled Block',
      description: '',
      gridRows: 6,
      gridCols: 6,
      primaryColor: '#ff0000',
      secondaryColor: '#00ff00',
      squares: [],
      triangles: [],
    };

    // Initialize with state
    BlockEditor.setState(initialState);
    UndoRedoManager.initialize(initialState);

    // Set up UI event listeners
    setupEventListeners();

    // Set up history change listener
    UndoRedoManager.addListener(updateHistoryUI);

    // Handle window resize
    window.addEventListener('resize', () => BlockEditor.updateSVGSize());

    console.log('Application initialized');
  }

  /**
   * Set up event listeners
   */
  function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Grid size slider
    document.getElementById('rowSlider').addEventListener('input', (e) => {
      const size = parseInt(e.target.value);
      document.getElementById('gridSizeDisplay').textContent = `${size}×${size}`;
      BlockEditor.setGridSize(size, size);
    });

    // Color pickers
    document.getElementById('primaryColor').addEventListener('input', (e) => {
      BlockEditor.setPrimaryColor(e.target.value);
    });

    document.getElementById('secondaryColor').addEventListener('input', (e) => {
      BlockEditor.setSecondaryColor(e.target.value);
    });

    // Toggle grid button
    document.getElementById('toggleGridButton').addEventListener('click', () => {
      console.log('Toggle Grid button clicked');
      BlockEditor.toggleGrid();
    });

    // New block button
    const newBlockBtn = document.getElementById('newButton');
    console.log('New Block button element:', newBlockBtn);
    if (newBlockBtn) {
      newBlockBtn.addEventListener('click', createNewBlock);
      console.log('Event listener added to New Block button');
    } else {
      console.error('New Block button not found!');
    }

    // Undo button
    document.getElementById('undoButton').addEventListener('click', performUndo);

    // Redo button
    document.getElementById('redoButton').addEventListener('click', performRedo);

    // Save block button
    document.getElementById('saveButton').addEventListener('click', saveBlock);

    // Load block button
    document.getElementById('loadButton').addEventListener('click', showLoadModal);

    // Import SVG button
    document.getElementById('importButton').addEventListener('click', () => {
      document.getElementById('importFile').click();
    });

    document.getElementById('importFile').addEventListener('change', handleImportFile);

    // Export SVG button
    document.getElementById('exportButton').addEventListener('click', exportBlock);

    // Modal close button
    document.querySelector('.close').addEventListener('click', closeLoadModal);

    // Modal click outside
    document.getElementById('loadBlockModal').addEventListener('click', (e) => {
      if (e.target === document.getElementById('loadBlockModal')) {
        closeLoadModal();
      }
    });
    
    console.log('Event listeners setup complete');
  }

  /**
   * Handle block changes from editor
   */
  function handleBlockChange(newState) {
    UndoRedoManager.push(newState);
  }

  /**
   * Create a new block
   */
  function createNewBlock() {
    console.log('New Block button clicked');
    if (confirm('Create a new block? Any unsaved changes will be lost.')) {
      console.log('User confirmed - creating new block');
      currentBlockId = null;
      currentBlockName = 'Untitled Block';
      document.getElementById('blockName').value = currentBlockName;
      document.getElementById('blockDescription').value = '';

      const initialState = {
        id: null,
        name: currentBlockName,
        description: '',
        gridRows: 6,
        gridCols: 6,
        primaryColor: '#ff0000',
        secondaryColor: '#00ff00',
        squares: [],
        triangles: [],
      };

      console.log('Setting editor state to:', initialState);
      BlockEditor.setState(initialState);
      console.log('Initializing undo/redo manager');
      UndoRedoManager.initialize(initialState);
      document.getElementById('rowSlider').value = 6;
      document.getElementById('gridSizeDisplay').textContent = '6×6';
      document.getElementById('primaryColor').value = '#ff0000';
      document.getElementById('secondaryColor').value = '#00ff00';
      console.log('New block created successfully');
    } else {
      console.log('User cancelled new block creation');
    }
  }

  /**
   * Perform undo
   */
  function performUndo() {
    const state = UndoRedoManager.undo();
    if (state) {
      BlockEditor.setState(state);
    }
  }

  /**
   * Perform redo
   */
  function performRedo() {
    const state = UndoRedoManager.redo();
    if (state) {
      BlockEditor.setState(state);
    }
  }

  /**
   * Save block
   */
  async function saveBlock() {
    const name = document.getElementById('blockName').value.trim();
    const description = document.getElementById('blockDescription').value.trim();

    if (!name) {
      alert('Please enter a block name');
      return;
    }

    try {
      const state = BlockEditor.getState();
      const blockData = {
        id: currentBlockId,
        name,
        description,
        gridRows: state.gridRows,
        gridCols: state.gridCols,
        data: {
          primaryColor: state.primaryColor,
          secondaryColor: state.secondaryColor,
          squares: state.squares,
          triangles: state.triangles,
        },
      };

      const response = await APIClient.saveBlock(blockData);
      currentBlockId = response.id;
      currentBlockName = name;

      alert(`Block "${name}" saved successfully!`);
    } catch (error) {
      console.error('Error saving block:', error);
      alert(`Error saving block: ${error.message}`);
    }
  }

  /**
   * Show load block modal
   */
  async function showLoadModal() {
    const modal = document.getElementById('loadBlockModal');
    const container = document.getElementById('blockListContainer');

    try {
      container.innerHTML = '<p>Loading blocks...</p>';
      modal.style.display = 'block';

      const blocks = await APIClient.listBlocks();

      if (blocks.length === 0) {
        container.innerHTML = '<p>No saved blocks found.</p>';
        return;
      }

      container.innerHTML = '';
      blocks.forEach(block => {
        const blockItem = document.createElement('div');
        blockItem.className = 'block-item';
        blockItem.innerHTML = `
          <h4>${escapeHtml(block.name)}</h4>
          <p>${block.description ? escapeHtml(block.description) : 'No description'}</p>
          <div class="block-grid-info">Grid: ${block.grid_rows}×${block.grid_cols}</div>
        `;
        blockItem.addEventListener('click', () => loadBlockFromList(block.id, modal));
        container.appendChild(blockItem);
      });
    } catch (error) {
      console.error('Error loading blocks:', error);
      container.innerHTML = `<p>Error loading blocks: ${error.message}</p>`;
    }
  }

  /**
   * Load block from list
   */
  async function loadBlockFromList(blockId, modal) {
    try {
      const block = await APIClient.loadBlock(blockId);
      currentBlockId = block.id;
      currentBlockName = block.name;

      // Extract data
      const data = typeof block.data === 'string' ? JSON.parse(block.data) : block.data;

      const state = {
        id: block.id,
        name: block.name,
        description: block.description,
        gridRows: block.grid_rows,
        gridCols: block.grid_cols,
        primaryColor: data.primaryColor || '#ff0000',
        secondaryColor: data.secondaryColor || '#00ff00',
        squares: data.squares || [],
        triangles: data.triangles || [],
      };

      // Update UI
      document.getElementById('blockName').value = block.name;
      document.getElementById('blockDescription').value = block.description;
      document.getElementById('rowSlider').value = block.grid_rows;
      document.getElementById('gridSizeDisplay').textContent = `${block.grid_rows}×${block.grid_cols}`;
      document.getElementById('primaryColor').value = state.primaryColor;
      document.getElementById('secondaryColor').value = state.secondaryColor;

      // Update editor
      BlockEditor.setState(state);
      UndoRedoManager.initialize(state);

      // Close modal
      closeLoadModal();
    } catch (error) {
      console.error('Error loading block:', error);
      alert(`Error loading block: ${error.message}`);
    }
  }

  /**
   * Close load modal
   */
  function closeLoadModal() {
    document.getElementById('loadBlockModal').style.display = 'none';
  }

  /**
   * Handle SVG file import
   */
  async function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const blockData = await SVGImporter.importFromFile(file);
      const state = {
        id: null,
        name: `Imported - ${file.name.replace('.svg', '')}`,
        description: 'Imported from SVG',
        gridRows: blockData.gridRows || 10,
        gridCols: blockData.gridCols || 10,
        primaryColor: blockData.primaryColor || '#ff0000',
        secondaryColor: blockData.secondaryColor || '#00ff00',
        squares: blockData.squares || [],
        triangles: blockData.triangles || [],
      };

      BlockEditor.setState(state);
      UndoRedoManager.initialize(state);

      document.getElementById('blockName').value = state.name;
      document.getElementById('blockDescription').value = state.description;
      document.getElementById('rowSlider').value = state.gridRows;
      document.getElementById('gridSizeDisplay').textContent = `${state.gridRows}×${state.gridCols}`;
      document.getElementById('primaryColor').value = state.primaryColor;
      document.getElementById('secondaryColor').value = state.secondaryColor;

      alert('SVG imported successfully!');
    } catch (error) {
      console.error('Error importing SVG:', error);
      alert(`Error importing SVG: ${error.message}`);
    }

    // Reset file input
    e.target.value = '';
  }

  /**
   * Export block as SVG
   */
  async function exportBlock() {
    if (!currentBlockId) {
      // Export locally without saving to server
      const state = BlockEditor.getState();
      const filename = `${currentBlockName || 'quilt-block'}.svg`;
      SVGExporter.exportAsFile(state, filename);
      alert('Block exported successfully!');
      return;
    }

    try {
      await APIClient.exportSvg(currentBlockId, currentBlockName);
      alert('Block exported successfully!');
    } catch (error) {
      console.error('Error exporting block:', error);
      alert(`Error exporting block: ${error.message}`);
    }
  }

  /**
   * Update history UI
   */
  function updateHistoryUI(historyState) {
    document.getElementById('undoButton').disabled = !historyState.canUndo;
    document.getElementById('redoButton').disabled = !historyState.canRedo;
  }

  /**
   * Escape HTML special characters
   */
  function escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  return {
    initialize,
  };
})();

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  App.initialize();
});
