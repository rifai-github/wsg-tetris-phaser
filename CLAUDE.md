# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

WSG Tetris Game is a Phaser 3-based Tetris implementation with workforce skills labels on tetromino blocks. Built in portrait orientation (360x720px) with an 8x9 grid system, featuring touch controls and skill-themed gameplay with multiple gameplay modes.

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

## Gameplay Modes

The game supports 4 different gameplay modes controlled via URL parameter `?type=<mode>`:

- **Explorer** (`?type=explorer`): Shows prediction hints for optimal tetromino placement
- **Builder** (`?type=builder`): Includes skip button to bypass current tetromino
- **Adapter** (`?type=adapter`): Includes switch button to swap current with next tetromino
- **Innovator** (`?type=innovator`): Includes rotate button for enhanced rotation control

Each mode is configured via [`gameplay_config.json`](public/gameplay_config.json) with custom play area images, instruction text, colors, and special features.

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
- Manages 8x9 grid system
- Collision detection and boundary checking
- Locks tetrominos permanently to the board with rotated text labels
- Line clearing (disabled by default but implemented)
- Game over detection when row 0 has filled tiles

**UIManager** ([UIManager.ts](src/managers/UIManager.ts))
- Renders background, panel, and profile elements
- Creates interactive control buttons filtered by gameplay mode
- Manages button callbacks and touch interactions
- Dynamically loads play area images and instruction text based on gameplay config

### Data Flow

1. Gameplay configuration loaded from [`gameplay_config.json`](public/gameplay_config.json) based on URL parameter
2. Shape structure defined in [shape_data.json](public/shape_data.json) with matrix, image paths, and text_position offsets
3. Labels sourced from [label_block.json](public/label_block.json)
4. ShapeManager generates Tetromino objects with labels
5. TetrominoRenderer displays active piece (temporary) with optional prediction overlay
6. GameBoard locks pieces permanently on collision
7. Next 7 shapes previewed horizontally (rightmost uses color, others use outline)

### Key Game Mechanics

**Grid System**: 8 columns × 9 rows, 40px tiles, positioned at (20, 230)

**Shape Rotation**: Text follows shape rotation except at 180° (remains at 0° for readability)

**Label Management**: Tracks used labels and resets when all labels exhausted

**Gravity Toggle**: Press 'G' to toggle automatic dropping (for debugging)

**Special Mode Features**:
- **Skip Function**: Skip current tetromino without locking (builder mode)
- **Switch Function**: Swap current with next tetromino (adapter mode)
- **Prediction Overlay**: Shows optimal placement hints (explorer mode)
- **Enhanced Rotation**: Additional rotation controls (innovator mode)

**Auto Restart**: Game automatically restarts 3 seconds after game over

## Configuration

### Gameplay Configuration
[`gameplay_config.json`](public/gameplay_config.json) defines each gameplay mode:
- `type`: Mode identifier
- `special_tag`: Array of features to enable ("prediction", "skip", "switch", "rotate")
- `play_area`: Path to custom play area background image
- `instruction_text`: Dynamic instruction text for the mode
- `instruction_text_color`: RGB hex color for instruction text

### Key Constants
- `TILE_SIZE`: 40px
- `GRID_WIDTH`: 8, `GRID_HEIGHT`: 9
- `DROP_INTERVAL`: 1000ms (modify in TetrisScene.ts:34)
- `FONT_FAMILY`: 'Nunito' (loaded from Google Fonts)

## Important Implementation Details

**Dynamic Asset Loading**: Play area images are loaded dynamically based on gameplay config in TetrisScene.create()

**Shape Images**: Each shape has three versions:
- `/images/shapes/colours/*.png` - Used for active and locked blocks
- `/images/shapes/outline/*.png` - Used for next shape previews (except first)
- `/images/shapes/prediction/*.png` - Used for prediction overlays (explorer mode)

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

**Debug Mode**: Set `debugMode: boolean = true` in TetrisScene.ts:38 to see grid lines, bounding boxes, and shape info.

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