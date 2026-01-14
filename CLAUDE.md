# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WSG Tetris Game is a Phaser 3-based Tetris implementation with workforce skills labels on tetromino blocks. Built in portrait orientation (393x852px) with an 8x9 grid system (44px tiles), featuring touch controls, countdown timer with slider, and skill-themed gameplay with multiple gameplay modes.

**Note**: This project uses a custom parent frame integration pattern. The `parent-example.html` file in the root directory serves as a reference for iframe embedding and parent-window messaging.

### Parent Frame Integration

The game supports iframe embedding with parent-window messaging via PostMessage API:

**Game → Parent Messages:**
- `PHASER_IMAGE`: Sent on game over, contains base64 screenshot data and timestamp
- Message format: `{ type: 'PHASER_IMAGE', screenshot: string, timestamp: number }`

**Parent → Game Messages:**
- `restart`: Triggers game restart from parent application
- Message format: `{ type: 'restart' }`

Reference implementation in `parent-example.html` demonstrates screenshot capture and restart functionality.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on port 3000, may auto-increment if occupied)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

**Note**: This project does not have configured test scripts or linting tools.

## Gameplay Modes

The game supports 4 different gameplay modes controlled via URL parameter `?type=<mode>`:

- **Explorer** (`?type=explorer`): Shows prediction hints for optimal tetromino placement
- **Builder** (`?type=builder`): Includes skip button to bypass current tetromino
- **Adapter** (`?type=adapter`): Includes switch button to swap current with next tetromino
- **Innovator** (`?type=innovator`): Includes rotate button for enhanced rotation control

Each mode is configured via [`gameplay_config.json`](public/gameplay_config.json) with custom play area images, instruction text, colors, and special features.

### URL Parameters

Customize gameplay via query parameters:
- `?type=<mode>`: Select gameplay mode (explorer, builder, adapter, innovator)
- `?timer=<seconds>`: Set custom countdown duration (default: 10)
- `?username=<name>`: Display custom username in profile section

Example: `game.html?type=adapter&timer=15&username=John`

## Architecture

### Manager Pattern

The game uses a manager-based architecture where [TetrisScene.ts](src/scenes/TetrisScene.ts) orchestrates four specialized managers:

**ShapeManager** ([ShapeManager.ts](src/managers/ShapeManager.ts))
- Loads shape data from [shape_data.json](public/shape_data.json)
- Generates random tetrominos with skill labels
- Handles rotation logic via matrix transformation
- Manages label assignment: S and Z shapes get two-word labels when available (e.g., "Future Ready"), other shapes get single labels

**TetrominoRenderer** ([TetrominoRenderer.ts](src/managers/TetrominoRenderer.ts))
- Renders active and preview tetrominos
- Handles text rotation with special rule: 180° rotation displays text at 0° to prevent upside-down labels
- Manages temporary rendering during gameplay (destroyed on lock)
- **Prediction System**: For explorer mode, renders optimal placement suggestions using sophisticated scoring algorithm
- Uses prediction-specific textures: `/images/shapes/prediction/*.png`

**GameBoard** ([GameBoard.ts](src/managers/GameBoard.ts))
- Manages 8x9 grid system with 44px tiles
- Collision detection and boundary checking
- Locks tetrominos permanently to the board with rotated text labels
- Line clearing (disabled by default but implemented)
- Game over detection when row 0 has filled tiles

**UIManager** ([UIManager.ts](src/managers/UIManager.ts))
- Renders background, panel, and profile elements
- Creates interactive control buttons filtered by gameplay mode
- Manages countdown timer with color warnings and slider progress indicator
- Dynamic slider component with quarters-based progress display
- Manages button callbacks and touch interactions
- Dynamically loads play area images and instruction text based on gameplay config

### Data Flow

1. Gameplay configuration loaded from [`gameplay_config.json`](public/gameplay_config.json) based on URL parameter
2. Shape structure defined in [shape_data.json](public/shape_data.json) with matrix, image paths, and text_position offsets
3. Labels sourced from [label_block.json](public/label_block.json)
4. ShapeManager generates Tetromino objects with labels
5. TetrominoRenderer displays active piece (temporary) with optional prediction overlay
6. GameBoard locks pieces permanently on collision
7. Next 7 shapes previewed horizontally (right edge aligns with play area right edge)

### Key Game Mechanics

**Grid System**: 8 columns × 9 rows, 44px tiles, positioned at (20, 319)

**Screen Resolution**: 393x852px portrait mode with 353x397px play area

**Timer System**: 10-second countdown with color warnings (white → orange → red)

**Progress Slider**: Real-time slider showing timer progress in quarters format ("Progress X/4")

**Shape Rotation**: Text follows shape rotation except at 180° (remains at 0° for readability)

**Label Management**: Tracks used labels and resets when all labels exhausted

**Gravity Toggle**: Press 'G' to toggle automatic dropping (for debugging)

**Special Mode Features**:
- **Skip Function**: Skip current tetromino without locking (builder mode)
- **Switch Function**: Swap current with next tetromino (adapter mode)
- **Prediction Overlay**: Shows optimal placement hints (explorer mode)
- **Enhanced Rotation**: Additional rotation controls (innovator mode)

**Auto Restart**: Game automatically restarts 3 seconds after game over

**Smart Spawn System**: Finds valid spawn position in top row (center → left → right). Game over only when no valid spawn position exists, preventing premature game over.

**Switch Mechanics** (Adapter Mode):
- Preserves current labels when changing shapes
- Generates random shape with random rotation (0°, 90°, 180°, or 270°)
- Labels adjust based on target shape's text position count
- Can switch from any shape to any shape (including S and Z)
- Next tetromino pool excludes S and Z shapes (only 5 shapes)

**Audio System**:
- Background music (BGM) loops during gameplay (50% volume)
- Block SFX plays when tetromino locks to board (70% volume)
- BGM stops when game over occurs

## Configuration

### Gameplay Configuration
[`gameplay_config.json`](public/gameplay_config.json) defines each gameplay mode:
- `type`: Mode identifier
- `special_tag`: Array of features to enable ("prediction", "skip", "switch", "rotate")
- `play_area`: Path to custom play area background image
- `instruction_text`: Dynamic instruction text for the mode
- `instruction_text_color`: RGB hex color for instruction text

### Key Constants
- `TILE_SIZE`: 44px
- `GRID_WIDTH`: 8, `GRID_HEIGHT`: 9
- `CANVAS_WIDTH`: 393px, `CANVAS_HEIGHT`: 852px
- `PLAY_AREA_WIDTH`: 353px, `PLAY_AREA_HEIGHT`: 397px
- `BOARD_X`: 20px, `BOARD_Y`: 319px
- `COUNTDOWN_DURATION`: 10 seconds
- `DROP_INTERVAL`: 1000ms
- `FONT_FAMILY`: 'Nunito' (loaded from Google Fonts)

### Asset Management
All asset paths centralized in [`constants.ts`](src/config/constants.ts):
- **UI Assets**: Background, profile, play area panels
- **Button Assets**: Skip, switch, rotate, movement controls
- **Shape Assets**: Color, outline, and prediction versions for all 7 tetrominos
- **Slider Assets**: Progress bar background, fill indicator, and handle/thumb

## Important Implementation Details

**Dynamic Asset Loading**: Play area images are loaded dynamically based on gameplay config in TetrisScene.create()

**Shape Images**: Each shape has three versions:
- `/images/shapes/colours/*.png` - Used for active and locked blocks
- `/images/shapes/outline/*.png` - Used for next shape previews (except first)
- `/images/shapes/prediction/*.png` - Used for prediction overlays (explorer mode)

**Slider Component**: Progress tracking with rounded appearance:
- Background bar: 164x10px positioned at right side of profile section
- Handle/thumb: 40x40px sliding along progress bar
- Progress fill: Uses `progress.png` with dynamic masking for rounded appearance
- Progress text: "Progress X/4" format, right-aligned above slider
- Follows countdown timer (0 at start, 1 at finish)

**Text Positioning**: Defined per-shape in shape_data.json as `[x, y]` offsets from shape center. S and Z shapes have two positions for two-word labels.

**Locking Mechanism**: When tetromino locks, GameBoard calculates true center from filled tiles, renders complete shape image at rotation, and applies rotated text labels.

**Prediction Algorithm**: Six-factor scoring system considers:
- Tile coverage (immediate placement value)
- Flatness (hole avoidance)
- Future placement potential
- Height preference (lower is better)
- Edge stability (wall hugging)
- Line completion bonus

**Game-Over Prevention**: Prediction system avoids suggesting placements in top row to prevent instant game over.

**Shape Preview Positioning**: 7 tetrominos previewed horizontally to the left of the play area. Right edge of first shape aligns with play area right edge. First shape uses color rendering, others use outline.

**Timer System**: 10-second countdown with visual warnings:
- 10-30 seconds: White text
- 1-10 seconds: Orange warning
- 0 seconds: Red urgent
- Auto game over when timer reaches 0

**Game Over Conditions**:
1. Timer reaches 0 seconds
2. No valid spawn position available in top row

**Debug Mode**: Set `debugMode: boolean = true` in TetrisScene.ts:47 to see grid lines, bounding boxes, and shape info.

**Text Rendering**: All text elements use 2x resolution (`setResolution(2)`) with enhanced shadow effects (1px offset, 2px blur) for sharp, clear display with optimal readability against game backgrounds.

**Font Loading**: Google Fonts (Nunito) preloads before Phaser initialization to prevent race conditions and ensure consistent text rendering.

## TypeScript Types

All interfaces defined in [types/index.ts](src/types/index.ts):
- `ShapeData`: JSON structure from shape_data.json
- `Tetromino`: Active piece with position, rotation, matrix, labels
- `GameConfig`: Board dimensions and positioning
- `GridTile`: Locked board state per cell
- `GameplayConfig`: Configuration for different gameplay modes
- `Direction`: Movement enum

## Build Configuration

Vite config uses:
- `base: './'` for relative paths (GitHub Pages compatible)
- Port 3000 for dev server (auto-increments if occupied)
- TypeScript with strict mode enabled
- ES2020 target with CommonJS modules

## Dependencies

- **phaser**: ^3.90.0 - Game framework and rendering engine
- **lottie-web**: ^5.13.0 - Animation library (available but may not be actively used)
- **typescript**: ^5.9.3 - Type-safe development
- **vite**: ^7.2.4 - Fast build tool and dev server