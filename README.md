# WSG Tetris Game

A Phaser 3-based Tetris implementation with workforce skills labels on tetromino blocks. Built in portrait orientation (360x720px) with an 8x9 grid system, featuring touch controls and multiple gameplay modes.

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
- **Switch Function**: Swap current tetromino with next one
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
- **Portrait Mode**: Optimized for mobile (360x720px)
- **Grid System**: 8×9 tiles (320x360px play area)
- **Skill Labels**: Each tetromino displays workforce skills
- **Smart Text**: S & Z shapes show two-word labels when available
- **Text Rotation**: Follows shape rotation (180° stays upright)
- **7-Shape Preview**: Horizontal preview with dynamic spacing
- **Touch Controls**: Mobile-friendly button interface

### Advanced Features
- **Dynamic Play Areas**: Different backgrounds per gameplay mode
- **Intelligent Prediction**: AI-powered placement suggestions
- **Mode-Specific Controls**: Different buttons based on gameplay type
- **Adaptive Instructions**: Context-sensitive help text
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
- **Builder Mode**: Skip button to bypass current piece
- **Adapter Mode**: Switch button to swap with next piece
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
Modify game parameters in `TetrisScene.ts`:
```typescript
private dropInterval: number = 1000; // Drop speed (ms)
private config: GameConfig = {
  tileSize: 40,
  gridWidth: 8,
  gridHeight: 9,
  boardX: 20,
  boardY: 230
};
```

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
4. **UIManager**: Manages dynamic UI, mode-specific buttons, and asset loading

### Data Flow
1. Load gameplay configuration based on URL parameter
2. Initialize managers with shape and label data
3. Generate tetrominos with skill labels
4. Render with optional prediction overlays
5. Handle user input and game state updates

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
- **Dynamic Loading**: Play area images loaded based on gameplay mode
- **Prediction Safety**: AI avoids suggesting game-over positions
- **Mobile Optimized**: Touch controls and portrait layout
- **Performance**: Efficient rendering with texture caching

## Browser Support

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

Mobile browsers supported with touch controls.