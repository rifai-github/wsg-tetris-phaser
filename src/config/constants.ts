/**
 * Game constants - Semua nilai konfigurasi game
 */

// Calculate scale factor for small screens
const MIN_HEIGHT = 850;
const SCALE_FACTOR = (window.innerHeight * 2 < MIN_HEIGHT ? window.innerHeight * 2 / MIN_HEIGHT : 1 * 2);

export const GAME_CONSTANTS = {
  // Design Reference Resolution (fixed size untuk game logic)
  DESIGN_WIDTH: 393,
  DESIGN_HEIGHT: 852,

  // Canvas size - Dynamic (responsive) - untuk backward compatibility
  CANVAS_WIDTH: window.innerWidth * 2,
  CANVAS_HEIGHT: window.innerHeight * 2,

  // Scale factor for small screens
  SCALE_FACTOR: SCALE_FACTOR,
  MIN_HEIGHT: MIN_HEIGHT,

  // Tile size (scaled for small screens)
  TILE_SIZE: Math.floor(44 * SCALE_FACTOR), // Updated to fit 353x397 play area with 8x9 grid

  // Grid dimensions
  GRID_WIDTH: 8,
  GRID_HEIGHT: 9,

  // Play area dimensions and position (scaled for small screens)
  PLAY_AREA_WIDTH: Math.floor(353 * SCALE_FACTOR),
  PLAY_AREA_HEIGHT: Math.floor(397 * SCALE_FACTOR),

  // Spacing (scaled for small screens)
  PLAY_AREA_TOP_MARGIN: Math.floor(220 * SCALE_FACTOR), // Distance from play area bottom to screen bottom
  BUTTON_DISTANCE_FROM_PLAY_AREA: Math.floor(10 * SCALE_FACTOR), // Distance between play area bottom and button top
  TETROMINO_DISTANCE_FROM_PLAY_AREA: Math.floor(15 * SCALE_FACTOR), // Distance between tetromino list bottom and play area top

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
  PREVIEW_SCALE: 0.65,
  PREVIEW_BASE_SPACING_MULTIPLIER: 0.5, // tile_size * scale * this value

  // Control buttons (scaled for small screens)
  BUTTON_SIZE: Math.floor(75 * SCALE_FACTOR),
  BUTTON_SPACING: Math.floor(12 * SCALE_FACTOR),

  // UI Layout
  SCREEN_CENTER_X: window.innerWidth / 2,
  SCREEN_CENTER_Y: window.innerHeight / 2,
  BACKGROUND_CENTER_X: window.innerWidth / 2,
  BACKGROUND_CENTER_Y: window.innerHeight / 2,

  // Header section (scaled for small screens)
  HEADER_SPACING: Math.floor(10 * SCALE_FACTOR),
  TIMER_HEIGHT: Math.floor(25 * SCALE_FACTOR),
  START_Y: Math.floor(20 * SCALE_FACTOR),
  TIMER_BACKGROUND_HEIGHT: Math.floor(40 * SCALE_FACTOR),
  INSTRUCTION_LINE_SPACING: Math.floor(1 * SCALE_FACTOR),
  PROFILE_SIZE: Math.floor(40 * SCALE_FACTOR),
  // PROFILE_LEFT_MARGIN: 25,
  PROFILE_NAME_SPACING: Math.floor(10 * SCALE_FACTOR), // 10px spacing after profile

  // Text wrapping
  INSTRUCTION_WORD_WRAP_WIDTH: 373, // 393 - 20px margins

  // Tetromino list positioning
  TETROMINO_LIST_RIGHT_MARGIN: 60, // 393 - startX = 60

  TETROMINO_FONT_SIZE: 15 * SCALE_FACTOR,
};

export const ASSET_PATHS = {
  // UI Assets
  BACKGROUND: '/images/background.png',
  PROFILE: '/images/profile-placeholder.png',
  DEFAULT_PLAY_AREA: '/images/panel-play-area-purple.png',
  TIMER_BG: '/images/timer-bg.png',

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
    GAMEPLAY_CONFIG: '/gameplay_config.json',
  },
};