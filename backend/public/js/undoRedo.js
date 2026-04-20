/**
 * Undo/Redo History Manager
 * Manages state history for undo/redo functionality
 */

const UndoRedoManager = (() => {
  let history = [];
  let currentIndex = -1;
  let listeners = [];

  /**
   * Create a deep copy of an object
   */
  function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Push a new state to history
   */
  function push(state) {
    // Remove any states after current index (redo stack)
    history = history.slice(0, currentIndex + 1);
    
    // Add new state
    history.push(deepCopy(state));
    currentIndex++;

    // Limit history size to prevent memory issues
    const maxHistorySize = 50;
    if (history.length > maxHistorySize) {
      history.shift();
      currentIndex--;
    }

    notifyListeners();
  }

  /**
   * Undo to previous state
   */
  function undo() {
    if (canUndo()) {
      currentIndex--;
      notifyListeners();
      return deepCopy(history[currentIndex]);
    }
    return null;
  }

  /**
   * Redo to next state
   */
  function redo() {
    if (canRedo()) {
      currentIndex++;
      notifyListeners();
      return deepCopy(history[currentIndex]);
    }
    return null;
  }

  /**
   * Get current state
   */
  function getCurrentState() {
    if (currentIndex >= 0 && currentIndex < history.length) {
      return deepCopy(history[currentIndex]);
    }
    return null;
  }

  /**
   * Check if undo is available
   */
  function canUndo() {
    return currentIndex > 0;
  }

  /**
   * Check if redo is available
   */
  function canRedo() {
    return currentIndex < history.length - 1;
  }

  /**
   * Clear history
   */
  function clear() {
    history = [];
    currentIndex = -1;
    notifyListeners();
  }

  /**
   * Register listener for history changes
   */
  function addListener(callback) {
    listeners.push(callback);
  }

  /**
   * Remove listener
   */
  function removeListener(callback) {
    listeners = listeners.filter(l => l !== callback);
  }

  /**
   * Notify all listeners of state change
   */
  function notifyListeners() {
    listeners.forEach(callback => {
      callback({
        canUndo: canUndo(),
        canRedo: canRedo(),
      });
    });
  }

  /**
   * Initialize with initial state
   */
  function initialize(initialState) {
    clear();
    push(initialState);
    currentIndex = 0; // Don't allow undo from initial state
  }

  return {
    push,
    undo,
    redo,
    getCurrentState,
    canUndo,
    canRedo,
    clear,
    initialize,
    addListener,
    removeListener,
  };
})();
