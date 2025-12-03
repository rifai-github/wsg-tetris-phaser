/**
 * Types and interfaces untuk WSG Tetris Game
 */

/**
 * Data struktur dari shape_data.json
 */
export interface ShapeData {
  shape_name: string;
  outline_path: string;
  color_path: string;
  prediction_path: string; // Path untuk prediction image
  text_position: number[][]; // Array of [x, y] offsets untuk text placement
  matrix: number[][];
}

/**
 * Representasi tetromino yang sedang aktif di game
 */
export interface Tetromino {
  shape: ShapeData;
  x: number; // Posisi grid X (0-7)
  y: number; // Posisi grid Y (0-8)
  rotation: number; // 0, 90, 180, 270
  matrix: number[][]; // Current rotated matrix
  labels: string[]; // Text labels untuk shape ini
}

/**
 * Konfigurasi posisi dan ukuran untuk game board
 */
export interface GameConfig {
  tileSize: number; // 40px
  gridWidth: number; // 8 tiles
  gridHeight: number; // 9 tiles
  boardX: number; // Posisi X play area
  boardY: number; // Posisi Y play area
}

/**
 * Representasi tile di grid board
 */
export interface GridTile {
  filled: boolean;
  shapeImage?: Phaser.GameObjects.Image;
  labelText?: Phaser.GameObjects.Text;
  shapeName?: string;
}

/**
 * Direction untuk movement
 */
export enum Direction {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  DOWN = 'DOWN'
}
