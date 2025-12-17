/**
 * Game constants - Semua nilai konfigurasi game
 */

export const GAME_CONSTANTS = {
  // Canvas size - Dynamic (responsive)
  CANVAS_WIDTH: window.innerWidth,
  CANVAS_HEIGHT: window.innerHeight,
  
  // Design Reference Resolution (untuk scaling calculations)
  DESIGN_WIDTH: 393,
  DESIGN_HEIGHT: 852,

  // Tile size
  TILE_SIZE: 44, // Updated to fit 353x397 play area with 8x9 grid

  // Grid dimensions
  GRID_WIDTH: 8,
  GRID_HEIGHT: 9,

  // Play area dimensions and position
  PLAY_AREA_WIDTH: 353,
  PLAY_AREA_HEIGHT: 397,

  // Spacing
  PLAY_AREA_BOTTOM_MARGIN: 136, // Distance from play area bottom to screen bottom
  BUTTON_DISTANCE_FROM_PLAY_AREA: 30, // Distance between play area bottom and button top
  TETROMINO_DISTANCE_FROM_PLAY_AREA: 10, // Distance between tetromino list bottom and play area top

  // Drop speed
  DROP_INTERVAL: 1000, // 1 second

  // Timer
  COUNTDOWN_DURATION: 60, // 3 minutes in seconds
  TIMER_WARNING_ORANGE: 30, // Orange warning below 30 seconds
  TIMER_WARNING_RED: 10, // Red urgent below 10 seconds

  // Colors
  BACKGROUND_COLOR: 'transparent',
  TIMER_COLOR_NORMAL: '#FFFFFF',
  TIMER_COLOR_WARNING: '#FFFFFF', // Orange
  TIMER_COLOR_URGENT: '#FFFFFF', // Red

  // Font
  FONT_FAMILY: 'Nunito',

  // Next shape preview
  NEXT_PREVIEW_START_X: 333, // Start from right side (393 - 60px margin)
  MAX_TETROMINO_HEIGHT: 4, // Maximum height in tiles
  PREVIEW_SCALE: 0.7,
  PREVIEW_BASE_SPACING_MULTIPLIER: 0.5, // tile_size * scale * this value

  // Control buttons
  BUTTON_SIZE: 70,
  BUTTON_SPACING: 15,

  // UI Layout
  SCREEN_CENTER_X: 196.5, // 393 / 2
  SCREEN_CENTER_Y: 426, // 852 / 2
  BACKGROUND_CENTER_X: 196.5, // 393 / 2
  BACKGROUND_CENTER_Y: 426, // 852 / 2

  // Header section
  HEADER_SPACING: 10,
  TIMER_HEIGHT: 35,
  TIMER_Y: 10,
  TIMER_BACKGROUND_HEIGHT: 40,
  INSTRUCTION_LINE_SPACING: 8,
  PROFILE_SIZE: 40,
  // PROFILE_LEFT_MARGIN: 25,
  PROFILE_NAME_SPACING: 10, // 10px spacing after profile

  // Text wrapping
  INSTRUCTION_WORD_WRAP_WIDTH: 373, // 393 - 20px margins

  // Tetromino list positioning
  TETROMINO_LIST_RIGHT_MARGIN: 60, // 393 - startX = 60
};

export const ASSET_PATHS = {
  // UI Assets
  BACKGROUND: '/images/background.png',
  PROFILE: '/images/profile-placeholder.png',
  DEFAULT_PLAY_AREA: '/images/panel-play-area-purple.png',

  // Control Buttons
  BUTTONS: {
    SKIP: '/images/button/skip.png',
    SWITCH: '/images/button/switch.png',
    LEFT: '/images/button/left.png',
    RIGHT: '/images/button/right.png',
    DOWN: '/images/button/down.png',
    ROTATE: '/images/button/rotate.png',
  },

  // Shape Images - Color Versions
  SHAPES_COLOR: {
    I: '/images/shapes/colours/i.png',
    J: '/images/shapes/colours/j.png',
    L: '/images/shapes/colours/l.png',
    O: '/images/shapes/colours/o.png',
    S: '/images/shapes/colours/s.png',
    T: '/images/shapes/colours/t.png',
    Z: '/images/shapes/colours/z.png',
  },

  // Shape Images - Outline Versions
  SHAPES_OUTLINE: {
    I: '/images/shapes/outline/i.png',
    J: '/images/shapes/outline/j.png',
    L: '/images/shapes/outline/l.png',
    O: '/images/shapes/outline/o.png',
    S: '/images/shapes/outline/s.png',
    T: '/images/shapes/outline/t.png',
    Z: '/images/shapes/outline/z.png',
  },

  // Shape Images - Prediction Versions
  SHAPES_PREDICTION: {
    I: '/images/shapes/prediction/i.png',
    J: '/images/shapes/prediction/j.png',
    L: '/images/shapes/prediction/l.png',
    O: '/images/shapes/prediction/o.png',
    S: '/images/shapes/prediction/s.png',
    T: '/images/shapes/prediction/t.png',
    Z: '/images/shapes/prediction/z.png',
  },

  // Slider Assets
  SLIDER: {
    BACKGROUND: '/images/slider/progress-bar.png',
    PROGRESS: '/images/slider/progress.png',
    HANDLING: '/images/slider/handling.png',
  },

  // Data Files
  DATA: {
    SHAPES: '/shape_data.json',
    LABELS: '/label_block.json',
    GAMEPLAY_CONFIG: '/gameplay_config.json',
  },
};

export const SLIDER_CONFIG = {
  BACKGROUND_WIDTH: 164,
  BACKGROUND_HEIGHT: 10,
  HANDLE_SIZE: 40,
  PERCENTAGE_COLOR: '#C22C98',
  PERCENTAGE_FONT_SIZE: '12px',
};