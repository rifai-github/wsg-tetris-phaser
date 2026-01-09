# WSG Tetris Game

A Phaser 3-based Tetris implementation with workforce skills labels on tetromino blocks. Built in portrait orientation (393x852px) with an 8x9 grid system (44px tiles), featuring touch controls, countdown timer with progress slider, and multiple gameplay modes.

## Gameplay Modes

The game supports 4 different gameplay modes via URL parameter `?type=<mode>`:

### Explorer Mode (`?type=explorer`)
- **Prediction System**: Shows optimal placement hints for tetrominos
- **Smart AI**: Uses six-factor scoring algorithm to suggest best moves
- **Visual Guidance**: Semi-transparent prediction overlays show where to place pieces

### Builder Mode (`?type=builder`)
- **Skip Function**: Skip current tetromino without locking
- **Foundation Building**: Focus on perfect piece placement
- **Skip Button**: Bypass unfittable pieces

### Adapter Mode (`?type=adapter`)
- **Switch Function**: Swap current tetromino shape with random shape (including S & Z)
- **Label Preservation**: Labels remain unchanged when switching shapes
- **Random Rotation**: Each switch generates random rotation (0°, 90°, 180°, or 270°)
- **Shape Filtering**: Next tetrominos exclude S & Z shapes (only 5 shapes instead of 7)
- **Flexibility Training**: Adapt to changing circumstances
- **Switch Button**: Exchange current piece for better fit

### Innovator Mode (`?type=innovator`)
- **Enhanced Rotation**: Additional rotation controls
- **Creative Problem-Solving**: Find innovative solutions
- **Rotate Button**: Extended rotation capabilities

## Project Structure

```
wsg-tetris-game/
├── src/
│   ├── managers/
│   │   ├── ShapeManager.ts       # Shape data, random generation, rotation
│   │   ├── TetrominoRenderer.ts  # Rendering with prediction system
│   │   ├── GameBoard.ts          # Grid system, collision, line clearing
│   │   └── UIManager.ts          # Dynamic UI with mode-specific features
│   ├── scenes/
│   │   └── TetrisScene.ts        # Main game scene with mode handling
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces including GameplayConfig
│   └── main.ts                   # Entry point
├── public/
│   ├── images/
│   │   ├── play_area/            # Mode-specific play area backgrounds
│   │   ├── shapes/
│   │   │   ├── colours/          # Active gameplay shapes
│   │   │   ├── outline/          # Preview shapes
│   │   │   └── prediction/       # Prediction overlay shapes
│   │   └── button/               # Control buttons
│   ├── shape_data.json           # Shape matrices and text positions
│   ├── label_block.json          # Skills labels database
│   └── gameplay_config.json      # Mode configurations and features
└── index.html
```

## Features

### Core Gameplay
- **Portrait Mode**: Optimized for mobile with responsive scaling
- **Grid System**: 8×9 tiles with dynamic sizing based on screen size
- **Countdown Timer**: Configurable timer with color-coded warnings (default: 10 seconds)
- **Progress Slider**: Real-time visual progress indicator in quarters format
- **Skill Labels**: Each tetromino displays workforce skills
- **Smart Text System**:
  - S & Z shapes show two-word labels when available
  - Other shapes show single-word labels
  - Labels adjust based on shape type during switch
- **Text Rotation**: Follows shape rotation (180° stays upright for readability)
- **7-Shape Preview**: Horizontal preview aligned with play area edge
- **Touch Controls**: Mobile-friendly button interface
- **Smart Spawn System**:
  - Finds valid spawn position in top row (center → left → right)
  - Game over only when no valid spawn position exists
- **Audio System**:
  - Background music (BGM) loops during gameplay
  - Block SFX plays when tetromino locks to board
  - BGM stops when game over

### Advanced Features
- **Dynamic Play Areas**: Different backgrounds per gameplay mode
- **Intelligent Prediction**: AI-powered placement suggestions with 6-factor scoring
- **Mode-Specific Controls**: Different buttons based on gameplay type
- **Adaptive Instructions**: Context-sensitive help text
- **Rounded Progress Slider**: Dynamic masking for smooth visual feedback
- **Game-Over Prevention**: Prediction avoids dangerous placements
- **Auto-Restart**: 3-second delay after game over

## Getting Started

```bash
# Install dependencies
npm install

# Start development server (port 3000, auto-increments if occupied)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Game Controls

### Standard Controls (All Modes)
- **Left Button**: Move tetromino left
- **Right Button**: Move tetromino right
- **Down Button**: Speed up tetromino fall

### Mode-Specific Controls
- **Explorer Mode**: No additional buttons (prediction automatic)
- **Builder Mode**: Skip button to bypass current piece without locking
- **Adapter Mode**: Switch button to transform current shape to random shape with random rotation
- **Innovator Mode**: Rotate button for enhanced rotation

### Debug Controls
- **G Key**: Toggle gravity (auto-drop) for testing

## Configuration

### Gameplay Modes
Edit `public/gameplay_config.json` to customize modes:
```json
[
  {
    "type": "explorer",
    "special_tag": ["prediction"],
    "play_area": "/images/play_area/explorer.png",
    "instruction_text": "Follow the hints to find your perfect fit!",
    "instruction_text_color": "#FD70FF"
  }
]
```

### Game Settings
Modify game parameters in [`constants.ts`](src/config/constants.ts):
```typescript
TILE_SIZE: Dynamic based on screen size,  // Calculated from SCALE_FACTOR
CANVAS_WIDTH: window.innerWidth * 2,     // Responsive width
CANVAS_HEIGHT: window.innerHeight * 2,   // Responsive height
PLAY_AREA_WIDTH: 353, PLAY_AREA_HEIGHT: 397, // Play area dimensions
BOARD_X: Dynamic, BOARD_Y: Dynamic,       // Calculated for centering
COUNTDOWN_DURATION: 10,                   // Timer in seconds (configurable via URL)
DROP_INTERVAL: 1000,                      // Drop speed (ms)
```

### URL Parameters
Customize gameplay via query parameters:
- `?type=<mode>`: Select gameplay mode (explorer, builder, adapter, innovator)
- `?timer=<seconds>`: Set custom countdown duration (default: 10)
- `?username=<name>`: Display custom username in profile section

Example: `game.html?type=adapter&timer=15&username=John`

### Labels Database
Add new skills labels in `public/label_block.json`:
```json
[
  "Future Ready",
  "Digital Skills",
  "Problem Solving",
  "Your New Label Here"
]
```

### UI Components
The game features several specialized UI elements:

**Timer System**:
- 10-second countdown with color-coded warnings (white → orange → red)
- Real-time updates every frame
- Auto game over when timer expires

**Progress Slider**:
- Positioned in profile section, right-aligned
- 164x10px background with 40x40px handle
- Rounded progress fill using dynamic masking
- Displays "Progress X/4" format based on timer completion

**Shape Preview**:
- 7 upcoming tetrominos displayed horizontally
- Right edge of first shape aligns with play area right edge
- First shape in color, others in outline
- Dynamic spacing based on shape dimensions

## Technology Stack

- **Phaser 3**: Game framework and rendering engine
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Google Fonts (Nunito)**: Clean, readable typography

## Architecture

### Manager Pattern
The game uses a modular manager architecture:

1. **ShapeManager**: Handles shape data, random generation, and rotation logic
2. **TetrominoRenderer**: Manages rendering, text rotation, and prediction system
3. **GameBoard**: Controls grid system, collision detection, and piece locking
4. **UIManager**: Manages dynamic UI, timer, slider, and mode-specific buttons

### Data Flow
1. Load gameplay configuration based on URL parameter
2. Initialize managers with shape and label data from centralized constants
3. Generate tetrominos with skill labels
4. Render with optional prediction overlays
5. Update timer and slider in real-time
6. Handle user input and game state updates

### Prediction Algorithm
The explorer mode uses a sophisticated six-factor scoring system:
- **Tile Coverage**: Immediate placement value
- **Flatness**: Hole avoidance and surface smoothing
- **Future Potential**: Next piece compatibility
- **Height Preference**: Lower is better
- **Edge Stability**: Wall hugging for structural integrity
- **Line Completion**: High bonus for clearing lines

## Development Notes

- **Text Positioning**: Defined per-shape in `shape_data.json` as `[x, y]` offsets
  - S and Z shapes have 2 text positions for two-word labels
  - Other shapes have 1 text position
- **Dynamic Loading**: Play area images loaded based on gameplay mode
- **Prediction Safety**: AI avoids suggesting game-over positions
- **Mobile Optimized**: Touch controls and responsive layout
  - Canvas scales to fit screen while maintaining aspect ratio
  - TILE_SIZE calculated from SCALE_FACTOR for consistency
- **Performance**: Efficient rendering with texture caching
- **Enhanced Text Rendering**:
  - All UI text uses 2x resolution (`setResolution(2)`)
  - Font family includes fallback: `"Nunito", sans-serif`
  - Shadow effects for improved readability
- **Font Loading**: Preloads Google Fonts before Phaser initialization to prevent race condition
- **Shape Filtering**:
  - Adapter mode excludes S and Z shapes from next tetromino pool
  - Switch function can generate all shapes including S and Z
  - Uses separate `generateRandomTetrominoForSwitch()` method
- **Smart Spawn Logic**:
  - Searches for valid position in top row (priority: center → left → right)
  - Game over only when no valid spawn position exists
  - Prevents premature game over with intelligent positioning
- **Game Over Conditions**:
  1. Timer reaches 0 seconds
  2. No valid spawn position available in top row
- **Audio System**:
  - BGM starts after countdown animation (50% volume, loop)
  - Block SFX plays on tetromino lock (70% volume, one-shot)
  - BGM stops when game over occurs
- **Switch Mechanics**:
  - Preserves current labels when changing shapes
  - Generates random shape with random rotation
  - Labels adjust based on target shape's text position count
  - Can switch from any shape to any shape (including S and Z)

## Browser Support

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

Mobile browsers supported with touch controls.