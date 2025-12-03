import Phaser from 'phaser';
import { Tetromino, GameConfig } from '../types';

/**
 * TetrominoRenderer - Mengelola rendering tetromino dengan images dan text labels
 */
export class TetrominoRenderer {
  private scene: Phaser.Scene;
  private config: GameConfig;
  private container: Phaser.GameObjects.Container | null = null;
  private predictionContainer: Phaser.GameObjects.Container | null = null;
  private predictionImage: Phaser.GameObjects.Image | null = null;

  constructor(scene: Phaser.Scene, config: GameConfig) {
    this.scene = scene;
    this.config = config;
  }

  /**
   * Render tetromino sebagai 1 complete image + text labels
   * Uses outline image for active (falling) tetromino
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
    // Use outline for active (falling) tetromino
    const shapeKey = `shape_${tetromino.shape.shape_name}_outline`;

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
        Math.round(center.x + rotatedOffset.x),
        Math.round(center.y + rotatedOffset.y),
        label,
        {
          fontFamily: 'Nunito',
          fontSize: '13px',
          color: '#FFFFFF',
          align: 'center',
          fontStyle: 'bold',
          resolution: 2
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
   * Render preview shape (menggunakan outline complete image) untuk next shape
   */
  renderPreview(tetromino: Tetromino, x: number, y: number, scale: number = 1, useColor: boolean = false): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);

    // Use the original matrix for image dimensions (avoid stretching)
    const originalMatrix = tetromino.shape.matrix;
    const shapeKey = useColor
      ? `shape_${tetromino.shape.shape_name}_color`
      : `shape_${tetromino.shape.shape_name}_outline`;

    // Ukuran original shape (sebelum rotation) untuk image
    const originalWidth = originalMatrix[0].length * this.config.tileSize;
    const originalHeight = originalMatrix.length * this.config.tileSize;

    // Render complete shape image WITH rotation (show actual spawn rotation)
    const image = this.scene.add.image(0, 0, shapeKey);
    image.setDisplaySize(originalWidth * scale, originalHeight * scale);
    image.setAngle(tetromino.rotation); // Show the actual rotation
    container.add(image);

    // Render text labels WITH rotation (show actual spawn rotation)
    const textRotation = this.getTextRotation(tetromino.rotation);

    for (let i = 0; i < tetromino.shape.text_position.length; i++) {
      const [offsetX, offsetY] = tetromino.shape.text_position[i];
      const label = tetromino.labels[i] || tetromino.labels[0];

      // Rotate offset position sesuai shape rotation
      const rotatedOffset = this.rotateOffset(offsetX, offsetY, tetromino.rotation);

      const text = this.scene.add.text(
        Math.round(rotatedOffset.x * scale),
        Math.round(rotatedOffset.y * scale),
        label,
        {
          fontFamily: 'Nunito',
          fontSize: `${Math.floor(13 * scale)}px`,
          color: '#FFFFFF',
          align: 'center',
          fontStyle: 'bold',
          resolution: 2
        }
      );
      text.setOrigin(0.5);
      text.setAngle(textRotation); // Show the actual text rotation
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
   * Render prediction shape showing where tetromino will land
   */
  renderPrediction(tetromino: Tetromino, gameBoard: any): void {
    // Destroy existing prediction
    this.destroyPrediction();

    // Calculate landing position
    const landingPosition = this.calculateLandingPosition(tetromino, gameBoard);

    const originalMatrix = tetromino.shape.matrix;
    const shapeKey = `shape_${tetromino.shape.shape_name}_prediction`;

    // Ukuran original shape (sebelum rotation) untuk image display
    const originalWidth = originalMatrix[0].length * this.config.tileSize;
    const originalHeight = originalMatrix.length * this.config.tileSize;

    // Hitung center berdasarkan actual filled tiles untuk akurasi
    const center = this.calculateTrueCenter(tetromino.matrix, landingPosition.x, landingPosition.y);

    // Render prediction shape image with rotation - NO TEXT
    this.predictionImage = this.scene.add.image(center.x, center.y, shapeKey);
    this.predictionImage.setDisplaySize(originalWidth, originalHeight);
    this.predictionImage.setAngle(tetromino.rotation);
    this.predictionImage.setAlpha(0.2); // Constant 20% opacity
  }

  /**
   * Calculate where tetromino will land
   */
  private calculateLandingPosition(tetromino: Tetromino, gameBoard: any): { x: number; y: number } {
    let testY = tetromino.y;

    // Keep moving down until collision
    while (gameBoard.canPlace({ ...tetromino, y: testY + 1 })) {
      testY++;
    }

    return { x: tetromino.x, y: testY };
  }

  /**
   * Destroy prediction elements
   */
  destroyPrediction(): void {
    // Destroy prediction image
    if (this.predictionImage) {
      this.predictionImage.destroy();
      this.predictionImage = null;
    }

    // Destroy prediction container (for backward compatibility)
    if (this.predictionContainer) {
      this.predictionContainer.destroy();
      this.predictionContainer = null;
    }
  }

  /**
   * Get current container
   */
  getContainer(): Phaser.GameObjects.Container | null {
    return this.container;
  }
}
