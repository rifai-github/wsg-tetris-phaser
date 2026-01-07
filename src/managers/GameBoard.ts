import Phaser from 'phaser';
import { Tetromino, GridTile, GameConfig, Direction } from '../types';
import { GAME_CONSTANTS } from '../config/constants';

/**
 * GameBoard - Mengelola grid system, collision detection, dan line clearing
 */
export class GameBoard {
  private scene: Phaser.Scene;
  private config: GameConfig;
  private grid: GridTile[][] = [];
  private lockedTiles: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, config: GameConfig) {
    this.scene = scene;
    this.config = config;
    this.lockedTiles = scene.add.container(0, 0);
    this.initializeGrid();
  }

  /**
   * Initialize grid dengan empty tiles
   */
  private initializeGrid(): void {
    this.grid = [];
    for (let row = 0; row < this.config.gridHeight; row++) {
      this.grid[row] = [];
      for (let col = 0; col < this.config.gridWidth; col++) {
        this.grid[row][col] = { filled: false };
      }
    }
  }

  /**
   * Check apakah tetromino bisa ditempatkan di posisi tertentu
   */
  canPlace(tetromino: Tetromino): boolean {
    const matrix = tetromino.matrix;

    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        if (matrix[row][col] === 1) {
          const gridX = tetromino.x + col;
          const gridY = tetromino.y + row;

          // Check bounds
          if (gridX < 0 || gridX >= this.config.gridWidth || gridY >= this.config.gridHeight) {
            return false;
          }

          // Check collision dengan locked tiles (abaikan jika masih di atas grid)
          if (gridY >= 0 && this.grid[gridY][gridX].filled) {
            return false;
          }
        }
      }
    }

    return true;
  }

  /**
   * Lock tetromino ke grid (simpan di grid dan render permanent)
   */
  lockTetromino(tetromino: Tetromino): void {
    const matrix = tetromino.matrix;
    const originalMatrix = tetromino.shape.matrix;
    const outlineKey = `shape_${tetromino.shape.shape_name}_outline`;
    const colorKey = `shape_${tetromino.shape.shape_name}_color`;

    // Hitung center berdasarkan actual filled tiles untuk akurasi
    const center = this.calculateTrueCenter(matrix, tetromino.x, tetromino.y);

    // Ukuran original shape (sebelum rotation) untuk image display
    const originalWidth = originalMatrix[0].length * this.config.tileSize;
    const originalHeight = originalMatrix.length * this.config.tileSize;

    // Create outline shape first
    const image = this.scene.add.image(center.x, center.y, outlineKey);
    image.setDisplaySize(originalWidth, originalHeight);
    image.setAngle(tetromino.rotation);
    this.lockedTiles.add(image);

    // Store original scale before animation
    const itemScale = image.scale;
    (image as any).originalScale = itemScale;

    this.scene.tweens.add({
      targets: image,
      scale: { from: itemScale, to: itemScale + 0.2 },
      duration: 150,
      ease: 'Back.easeOut',
      onComplete: () => {
        image.setTexture(colorKey);
        this.scene.tweens.add({
          targets: image,
          scale: { from: itemScale + 0.2, to: itemScale },
          duration: 150,
          ease: 'Back.easeIn',
          onComplete: () => {
          }
        });
      }
    });

    // Create permanent text labels
    const textRotation = this.getTextRotation(tetromino.rotation);

    for (let i = 0; i < tetromino.shape.text_position.length; i++) {
      const [offsetX, offsetY] = tetromino.shape.text_position[i];
      const label = tetromino.labels[i] || tetromino.labels[0];

      // Rotate offset position sesuai shape rotation
      const rotatedOffset = this.rotateOffset(offsetX, offsetY, tetromino.rotation);

      const text = this.scene.add.text(
        Math.round(center.x + (rotatedOffset.x * GAME_CONSTANTS.SCALE_FACTOR)),
        Math.round(center.y + (rotatedOffset.y * GAME_CONSTANTS.SCALE_FACTOR)),
        label,
        {
          fontFamily: '"Nunito", sans-serif',
          fontSize: Math.floor(GAME_CONSTANTS.TETROMINO_FONT_SIZE) + 'px',
          color: '#FFFFFF',
          align: 'center',
          fontStyle: 'bold',
          resolution: window.devicePixelRatio || 2
        }
      );
      text.setOrigin(0.5);
      text.setAngle(textRotation);
      this.lockedTiles.add(text);
    }

    // Mark grid cells as filled
    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        if (matrix[row][col] === 1) {
          const gridX = tetromino.x + col;
          const gridY = tetromino.y + row;

          if (gridY >= 0 && gridY < this.config.gridHeight && gridX >= 0 && gridX < this.config.gridWidth) {
            this.grid[gridY][gridX] = {
              filled: true,
              shapeImage: image,
              labelText: undefined,
              shapeName: tetromino.shape.shape_name
            };
          }
        }
      }
    }
  }

  /**
   * Rotate offset position berdasarkan rotation angle
   */
  private rotateOffset(x: number, y: number, angle: number): { x: number; y: number } {
    const rad = Phaser.Math.DegToRad(angle);
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    return {
      x: x * cos - y * sin,
      y: x * sin + y * cos
    };
  }

  /**
   * Get text rotation (sama seperti TetrominoRenderer)
   * Rule: Text hanya rotate 0° atau 90° untuk readability
   */
  private getTextRotation(shapeRotation: number): number {
    if (shapeRotation === 0 || shapeRotation === 360) {
      return 0;
    } else if (shapeRotation === 90 || shapeRotation === 270) {
      return 90;
    } else if (shapeRotation === 180) {
      return 0; // 180° tetap 0° agar tidak terbalik
    }
    return shapeRotation;
  }

  /**
   * Check dan clear completed lines
   * @returns Jumlah lines yang di-clear
   */
  clearLines(): number {
    let linesCleared = 0;
    const linesToClear: number[] = [];

    // Cari lines yang penuh
    for (let row = 0; row < this.config.gridHeight; row++) {
      let isFull = true;
      for (let col = 0; col < this.config.gridWidth; col++) {
        if (!this.grid[row][col].filled) {
          isFull = false;
          break;
        }
      }
      if (isFull) {
        linesToClear.push(row);
      }
    }

    // Clear lines
    for (const row of linesToClear) {
      this.clearLine(row);
      linesCleared++;
    }

    // Move lines down
    if (linesToClear.length > 0) {
      this.moveDownAfterClear(linesToClear);
    }

    return linesCleared;
  }

  /**
   * Clear satu line
   */
  private clearLine(row: number): void {
    // Track unique images yang perlu dihapus
    const imagesToDestroy = new Set<Phaser.GameObjects.Image>();

    for (let col = 0; col < this.config.gridWidth; col++) {
      const tile = this.grid[row][col];
      if (tile.shapeImage) {
        imagesToDestroy.add(tile.shapeImage);
      }
      this.grid[row][col] = { filled: false };
    }

    // Destroy complete shape images yang termasuk di line ini
    imagesToDestroy.forEach(img => {
      // Find and destroy associated texts
      const children = this.lockedTiles.getAll();
      children.forEach(child => {
        if (child instanceof Phaser.GameObjects.Text) {
          // Check if text is near this image
          const imgBounds = img.getBounds();
          const textBounds = child.getBounds();
          if (Phaser.Geom.Intersects.RectangleToRectangle(imgBounds, textBounds)) {
            child.destroy();
          }
        }
      });
      img.destroy();
    });
  }

  /**
   * Move lines down setelah clear
   */
  private moveDownAfterClear(clearedRows: number[]): void {
    // Untuk simplicity, kita rebuild locked shapes
    // Ini bukan optimal tapi akan berfungsi dengan shape-based approach

    // Sort dari bawah ke atas
    clearedRows.sort((a, b) => b - a);

    for (const clearedRow of clearedRows) {
      // Shift semua row di atasnya ke bawah
      for (let row = clearedRow; row > 0; row--) {
        for (let col = 0; col < this.config.gridWidth; col++) {
          this.grid[row][col] = this.grid[row - 1][col];
        }
      }

      // Clear top row
      for (let col = 0; col < this.config.gridWidth; col++) {
        this.grid[0][col] = { filled: false };
      }
    }

    // Move all remaining locked tiles down
    const moveDistance = clearedRows.length * this.config.tileSize;
    const children = this.lockedTiles.getAll();

    children.forEach(child => {
      if (child instanceof Phaser.GameObjects.Image || child instanceof Phaser.GameObjects.Text) {
        // Only move if y position is above cleared area
        const lowestClearedRow = Math.max(...clearedRows);
        const lowestClearedY = this.config.boardY + lowestClearedRow * this.config.tileSize;

        if (child.y < lowestClearedY) {
          child.y += moveDistance;
        }
      }
    });
  }

  /**
   * Check apakah game over (ada tile filled di row 0)
   */
  isGameOver(): boolean {
    for (let col = 0; col < this.config.gridWidth; col++) {
      if (this.grid[0][col].filled) {
        return true;
      }
    }
    return false;
  }

  /**
   * Reset board
   */
  reset(): void {
    // Destroy semua locked tiles
    this.lockedTiles.destroy();
    this.lockedTiles = this.scene.add.container(0, 0);

    // Reset grid
    this.initializeGrid();
  }

  /**
   * Calculate true center berdasarkan filled tiles
   */
  private calculateTrueCenter(matrix: number[][], gridX: number, gridY: number): { x: number; y: number } {
    let minCol = matrix[0].length;
    let maxCol = -1;
    let minRow = matrix.length;
    let maxRow = -1;

    // Find bounding box dari filled tiles
    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        if (matrix[row][col] === 1) {
          minCol = Math.min(minCol, col);
          maxCol = Math.max(maxCol, col);
          minRow = Math.min(minRow, row);
          maxRow = Math.max(maxRow, row);
        }
      }
    }

    // Calculate center dari filled tiles
    const centerCol = (minCol + maxCol) / 2;
    const centerRow = (minRow + maxRow) / 2;

    return {
      x: this.config.boardX + (gridX + centerCol + 0.5) * this.config.tileSize,
      y: this.config.boardY + (gridY + centerRow + 0.5) * this.config.tileSize
    };
  }

  /**
   * Get grid state (untuk debugging)
   */
  getGrid(): GridTile[][] {
    return this.grid;
  }

  /**
   * Get locked tiles container
   */
  getLockedTiles(): Phaser.GameObjects.Container {
    return this.lockedTiles;
  }

  /**
   * Get grid width
   */
  getGridWidth(): number {
    return this.config.gridWidth;
  }

  /**
   * Get grid height
   */
  getGridHeight(): number {
    return this.config.gridHeight;
  }
}
