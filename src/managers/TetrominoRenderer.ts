import Phaser from 'phaser';
import { Tetromino, GameConfig } from '../types';

/**
 * TetrominoRenderer - Mengelola rendering tetromino dengan images dan text labels
 */
export class TetrominoRenderer {
  private scene: Phaser.Scene;
  private config: GameConfig;
  private container: Phaser.GameObjects.Container | null = null;

  constructor(scene: Phaser.Scene, config: GameConfig) {
    this.scene = scene;
    this.config = config;
  }

  /**
   * Render tetromino sebagai 1 complete image + text labels
   */
  renderTetromino(tetromino: Tetromino): Phaser.GameObjects.Container {
    // Destroy container lama jika ada
    if (this.container) {
      this.container.destroy();
    }

    // Buat container baru
    this.container = this.scene.add.container(0, 0);

    const matrix = tetromino.matrix;
    const originalMatrix = tetromino.shape.matrix;
    const shapeKey = `shape_${tetromino.shape.shape_name}_color`;

    // Hitung center berdasarkan actual filled tiles untuk akurasi
    const center = this.calculateTrueCenter(matrix, tetromino.x, tetromino.y);

    // Ukuran original shape (sebelum rotation) untuk image display
    const originalWidth = originalMatrix[0].length * this.config.tileSize;
    const originalHeight = originalMatrix.length * this.config.tileSize;

    // Render complete shape image dan rotate
    const image = this.scene.add.image(center.x, center.y, shapeKey);
    image.setDisplaySize(originalWidth, originalHeight);
    image.setAngle(tetromino.rotation);
    this.container.add(image);

    // Render text labels sesuai text_position
    const textRotation = this.getTextRotation(tetromino.rotation);
    
    for (let i = 0; i < tetromino.shape.text_position.length; i++) {
      const [offsetX, offsetY] = tetromino.shape.text_position[i];
      const label = tetromino.labels[i] || tetromino.labels[0];

      // Rotate offset position sesuai shape rotation
      const rotatedOffset = this.rotateOffset(offsetX, offsetY, tetromino.rotation);

      const text = this.scene.add.text(
        center.x + rotatedOffset.x,
        center.y + rotatedOffset.y,
        label,
        {
          fontFamily: 'Nunito',
          fontSize: '13px',
          color: '#FFFFFF',
          align: 'center',
          fontStyle: 'bold'
        }
      );
      text.setOrigin(0.5);
      text.setAngle(textRotation);

      this.container.add(text);
    }

    return this.container;
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
   * Get text rotation berdasarkan shape rotation
   * Rule: Jika shape rotate 180°, text tetap 0° (tidak terbalik)
   */
  private getTextRotation(shapeRotation: number): number {
    if (shapeRotation === 180) {
      return 0; // Tidak terbalik
    }
    return shapeRotation;
  }

  /**
   * Render preview shape (menggunakan outline complete image) untuk next shape
   */
  renderPreview(tetromino: Tetromino, x: number, y: number, scale: number = 1, useColor: boolean = false): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);
    const matrix = tetromino.shape.matrix; // Gunakan matrix original (tidak rotated)
    const shapeKey = useColor 
      ? `shape_${tetromino.shape.shape_name}_color`
      : `shape_${tetromino.shape.shape_name}_outline`;

    // Ukuran original shape
    const originalWidth = matrix[0].length * this.config.tileSize;
    const originalHeight = matrix.length * this.config.tileSize;

    // Render complete shape image
    const image = this.scene.add.image(0, 0, shapeKey);
    image.setDisplaySize(originalWidth * scale, originalHeight * scale);
    container.add(image);

    // Render text labels (scaled)
    for (let i = 0; i < tetromino.shape.text_position.length; i++) {
      const [offsetX, offsetY] = tetromino.shape.text_position[i];
      const label = tetromino.labels[i] || tetromino.labels[0];

      const text = this.scene.add.text(
        offsetX * scale,
        offsetY * scale,
        label,
        {
          fontFamily: 'Nunito',
          fontSize: `${Math.floor(13 * scale)}px`,
          color: '#FFFFFF',
          align: 'center',
          fontStyle: 'bold'
        }
      );
      text.setOrigin(0.5);

      container.add(text);
    }

    return container;
  }

  /**
   * Destroy container
   */
  destroy(): void {
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
  }

  /**
   * Get current container
   */
  getContainer(): Phaser.GameObjects.Container | null {
    return this.container;
  }
}
