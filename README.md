# WSG Tetris Game

Game Tetris dengan tema WSG (Workforce Singapore) yang menampilkan skills labels pada setiap tetromino block.

## Struktur Project

```
wsg-tetris-game/
├── src/
│   ├── config/
│   │   └── constants.ts          # Game constants dan konfigurasi
│   ├── managers/
│   │   ├── ShapeManager.ts       # Handle shapes, random generation, rotation
│   │   ├── TetrominoRenderer.ts  # Render tetromino dengan images dan text
│   │   ├── GameBoard.ts          # Grid system, collision, line clearing
│   │   └── UIManager.ts          # UI elements (background, buttons, etc)
│   ├── scenes/
│   │   └── TetrisScene.ts        # Main game scene
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces dan types
│   └── main.ts                   # Entry point
├── public/
│   ├── images/
│   │   ├── background.png
│   │   ├── panel-play-area-purple.png
│   │   ├── profile-placeholder.png
│   │   ├── button/               # Control buttons
│   │   └── shapes/
│   │       ├── colours/          # Colored shapes untuk gameplay
│   │       └── outline/          # Outline shapes untuk preview
│   ├── shape_data.json           # Data struktur setiap shape
│   └── label_block.json          # Text labels untuk blocks
└── index.html

```

## Fitur

- **Portrait Mode**: Game dalam layout portrait (360x720)
- **Grid System**: Play area 8x9 tiles (320x360 px)
- **Shape dengan Labels**: Setiap tile menampilkan skill label
- **Special Shapes S & Z**: Dapat menampilkan 2 kata (contoh: "Future Ready")
- **Text Rotation**: Text mengikuti rotasi shape (kecuali 180° tetap 0°)
- **Next Shape Preview**: Menggunakan outline images
- **Touch Controls**: Button controls untuk mobile

## Cara Menjalankan

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build untuk production
npm run build
```

## Game Controls

- **Left Button**: Gerakkan tetromino ke kiri
- **Right Button**: Gerakkan tetromino ke kanan
- **Down Button**: Percepat jatuh tetromino
- **Rotate Button**: Rotate tetromino 90° clockwise

## Teknologi

- **Phaser 3**: Game framework
- **TypeScript**: Programming language
- **Vite**: Build tool dan dev server
- **Google Fonts (Nunito)**: Typography

## Arsitektur Code

### Managers (src/managers/)

1. **ShapeManager**: 
   - Load shape data dari JSON
   - Generate random tetromino dengan labels
   - Handle rotation logic

2. **TetrominoRenderer**:
   - Render tetromino dengan images dan text
   - Handle text rotation dengan rule khusus (180° = 0°)
   - Render preview shapes

3. **GameBoard**:
   - Grid system 8x9
   - Collision detection
   - Line clearing dan scoring
   - Lock tetromino ke board

4. **UIManager**:
   - Setup background, panel, profile
   - Create dan manage control buttons
   - Handle button interactions

### Types (src/types/)

- **ShapeData**: Struktur data shape dari JSON
- **Tetromino**: Representasi active tetromino
- **GameConfig**: Konfigurasi board dan positioning
- **GridTile**: Representasi tile di board

## Customization

### Mengubah Drop Speed
Edit di `TetrisScene.ts`:
```typescript
private dropInterval: number = 1000; // milliseconds
```

### Mengubah Grid Size
Edit di `TetrisScene.ts`:
```typescript
private config: GameConfig = {
  tileSize: 40,
  gridWidth: 8,
  gridHeight: 9,
  ...
};
```

### Menambah Labels Baru
Edit `public/label_block.json`:
```json
[
  "New Label",
  "Another Label",
  ...
]
```

## Notes

- Shape S dan Z secara otomatis menggunakan 2-word labels jika tersedia
- Text rotation mengikuti shape rotation, kecuali pada 180° (tetap 0° agar tidak terbalik)
- Game auto-restart setelah 3 detik dari game over
