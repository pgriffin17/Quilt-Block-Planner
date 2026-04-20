/**
 * API Client module
 * Handles communication with backend API or localStorage (for GitHub Pages)
 * Auto-detects environment:
 * - localhost:3000 → uses Express backend API
 * - GitHub Pages (https://...) → uses localStorage
 */

const APIClient = (() => {
  // Detect if running on GitHub Pages or localhost
  const isGitHubPages = !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1');
  const API_BASE = '/api/blocks';
  const STORAGE_KEY = 'quilt_blocks';

  console.log(`APIClient initialized in ${isGitHubPages ? 'GitHub Pages (localStorage)' : 'Server'} mode`);

  /**
   * Make a backend API request (server mode only)
   */
  async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
    };

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      // For file downloads (SVG export), return blob
      if (options.returnBlob) {
        return await response.blob();
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  /**
   * Get all blocks from localStorage
   */
  function getAllBlocksFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (err) {
      console.error('Error reading from localStorage:', err);
      return {};
    }
  }

  /**
   * Save all blocks to localStorage
   */
  function saveBlocksToStorage(blocks) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(blocks));
    } catch (err) {
      console.error('Error writing to localStorage:', err);
      if (err.name === 'QuotaExceededError') {
        throw new Error('Storage quota exceeded. Please delete some blocks.');
      }
      throw err;
    }
  }

  /**
   * Generate unique ID for localStorage blocks
   */
  function generateId() {
    return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save a block (create or update)
   */
  async function saveBlock(blockData) {
    if (isGitHubPages) {
      const blocks = getAllBlocksFromStorage();
      const id = blockData.id || generateId();
      
      blocks[id] = {
        id,
        name: blockData.name,
        description: blockData.description,
        grid_rows: blockData.gridRows,
        grid_cols: blockData.gridCols,
        data: JSON.stringify(blockData.data),
        is_public: 0,
        user_id: null,
        created_at: blocks[id]?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      saveBlocksToStorage(blocks);
      return { id, message: 'Block saved successfully' };
    } else {
      return apiRequest('/', {
        method: 'POST',
        body: JSON.stringify(blockData),
      });
    }
  }

  /**
   * Load a specific block by ID
   */
  async function loadBlock(id) {
    if (isGitHubPages) {
      const blocks = getAllBlocksFromStorage();
      const block = blocks[id];
      
      if (!block) {
        throw new Error('Block not found');
      }

      // Parse the data field if it's a string
      block.data = typeof block.data === 'string' ? JSON.parse(block.data) : block.data;
      return block;
    } else {
      return apiRequest(`/${id}`);
    }
  }

  /**
   * Get list of all blocks
   */
  async function listBlocks() {
    if (isGitHubPages) {
      const blocks = getAllBlocksFromStorage();
      return Object.values(blocks).map(block => ({
        id: block.id,
        name: block.name,
        description: block.description,
        grid_rows: block.grid_rows,
        grid_cols: block.grid_cols,
        is_public: block.is_public,
        created_at: block.created_at,
        updated_at: block.updated_at,
      }));
    } else {
      return apiRequest('/');
    }
  }

  /**
   * Delete a block
   */
  async function deleteBlock(id) {
    if (isGitHubPages) {
      const blocks = getAllBlocksFromStorage();
      
      if (!blocks[id]) {
        throw new Error('Block not found');
      }

      delete blocks[id];
      saveBlocksToStorage(blocks);
      return { message: 'Block deleted successfully' };
    } else {
      return apiRequest(`/${id}`, {
        method: 'DELETE',
      });
    }
  }

  /**
   * Export block as SVG (download)
   */
  async function exportSvg(id, blockName) {
    if (isGitHubPages) {
      // Load block from localStorage and export locally
      const block = await loadBlock(id);
      const data = typeof block.data === 'string' ? JSON.parse(block.data) : block.data;
      
      const blockData = {
        gridRows: block.grid_rows,
        gridCols: block.grid_cols,
        ...data,
      };

      SVGExporter.exportAsFile(blockData, `${blockName || 'quilt-block'}.svg`);
    } else {
      const blob = await apiRequest(`/${id}/export`, {
        returnBlob: true,
      });

      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${blockName || 'quilt-block'}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Import SVG and convert to block format
   */
  async function importSvg(svgContent, name = null, gridRows = 10, gridCols = 10) {
    if (isGitHubPages) {
      // Parse locally on GitHub Pages
      const blockData = SVGImporter.parseSvgToBlock(svgContent);
      return {
        ...blockData,
        name: name || 'Imported Block',
        gridRows: gridRows || blockData.gridRows || 10,
        gridCols: gridCols || blockData.gridCols || 10,
      };
    } else {
      return apiRequest('/import/svg', {
        method: 'POST',
        body: JSON.stringify({ svgContent, name, gridRows, gridCols }),
      });
    }
  }

  /**
   * Set block visibility (no-op on GitHub Pages)
   */
  async function setBlockPublic(id, isPublic) {
    if (isGitHubPages) {
      const blocks = getAllBlocksFromStorage();
      
      if (!blocks[id]) {
        throw new Error('Block not found');
      }

      blocks[id].is_public = isPublic ? 1 : 0;
      saveBlocksToStorage(blocks);
      return { message: `Block is now ${isPublic ? 'public' : 'private'}` };
    } else {
      return apiRequest(`/${id}/public`, {
        method: 'PUT',
        body: JSON.stringify({ isPublic }),
      });
    }
  }

  return {
    saveBlock,
    loadBlock,
    listBlocks,
    deleteBlock,
    exportSvg,
    importSvg,
    setBlockPublic,
    isGitHubPages, // Expose for debugging
  };
})();
