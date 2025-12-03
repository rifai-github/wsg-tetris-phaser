/**
 * Game constants - Semua nilai konfigurasi game
 */

export const GAME_CONSTANTS = {
  // Canvas size
  CANVAS_WIDTH: 360,
  CANVAS_HEIGHT: 720,

  // Tile size
  TILE_SIZE: 40,

  // Grid dimensions
  GRID_WIDTH: 8,
  GRID_HEIGHT: 9,

  // Play area position (centered)
  BOARD_X: 20, // (360 - 320) / 2 = 20
  BOARD_Y: 140,

  // Drop speed
  DROP_INTERVAL: 1000, // 1 second

  // Colors
  BACKGROUND_COLOR: '#2a2a3e',

  // Font
  FONT_FAMILY: 'Nunito',

  // Next shape preview
  NEXT_PREVIEW_X: 280,
  NEXT_PREVIEW_Y: 70,
  NEXT_PREVIEW_SCALE: 0.8,

  // Control buttons
  BUTTON_SIZE: 50,
  BUTTON_SPACING: 70,
  BUTTON_Y_OFFSET: 60, // Dari bottom play area
};

export const ASSET_PATHS = {
  BACKGROUND: '/images/background.png',
  PROFILE: '/images/profile-placeholder.png',
  
  BUTTONS: {
    LEFT: '/images/button/left.png',
    RIGHT: '/images/button/right.png',
    DOWN: '/images/button/down.png',
    ROTATE: '/images/button/rotate.png',
  },

  DATA: {
    SHAPES: '/shape_data.json',
    LABELS: '/label_block.json',
  },
};
