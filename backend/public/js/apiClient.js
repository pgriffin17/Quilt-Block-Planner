/**
 * API Client module
 * Handles all communication with the backend API
 */

const APIClient = (() => {
  const API_BASE = '/api/blocks';

  /**
   * Make a generic API request
   */
  async function request(endpoint, options = {}) {
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
   * Save a block (create or update)
   */
  async function saveBlock(blockData) {
    return request('/', {
      method: 'POST',
      body: JSON.stringify(blockData),
    });
  }

  /**
   * Load a specific block by ID
   */
  async function loadBlock(id) {
    return request(`/${id}`);
  }

  /**
   * Get list of all blocks
   */
  async function listBlocks() {
    return request('/');
  }

  /**
   * Delete a block
   */
  async function deleteBlock(id) {
    return request(`/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Export block as SVG (download)
   */
  async function exportSvg(id, blockName) {
    const blob = await request(`/${id}/export`, {
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

  /**
   * Import SVG and convert to block format
   */
  async function importSvg(svgContent, name = null, gridRows = 10, gridCols = 10) {
    return request('/import/svg', {
      method: 'POST',
      body: JSON.stringify({ svgContent, name, gridRows, gridCols }),
    });
  }

  /**
   * Set block visibility
   */
  async function setBlockPublic(id, isPublic) {
    return request(`/${id}/public`, {
      method: 'PUT',
      body: JSON.stringify({ isPublic }),
    });
  }

  return {
    saveBlock,
    loadBlock,
    listBlocks,
    deleteBlock,
    exportSvg,
    importSvg,
    setBlockPublic,
  };
})();
