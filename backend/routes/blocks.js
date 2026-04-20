const express = require('express');
const router = express.Router();
const {
  saveBlock,
  getBlock,
  listBlocks,
  deleteBlock,
  setBlockPublic,
  importSvg,
  exportSvg
} = require('../controllers/blockController');

// List all blocks
router.get('/', listBlocks);

// Get a specific block
router.get('/:id', getBlock);

// Save a new block or update existing
router.post('/', saveBlock);

// Update block visibility
router.put('/:id/public', setBlockPublic);

// Delete a block
router.delete('/:id', deleteBlock);

// Import SVG and convert to block
router.post('/import/svg', importSvg);

// Export block as SVG
router.get('/:id/export', exportSvg);

module.exports = router;
