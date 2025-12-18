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
   * Render prediction shape showing optimal placement for maximum coverage
   */
  renderPrediction(tetromino: Tetromino, gameBoard: any, nextTetrominos: Tetromino[] = []): void {
    // Destroy existing prediction
    this.destroyPrediction();

    // Calculate optimal placement for maximum capacity coverage
    const optimalPlacement = this.calculateOptimalPlacement(tetromino, gameBoard, nextTetrominos);

    // Use current tetromino with its current rotation for optimal placement
    const currentTetromino = this.createRotatedTetromino(tetromino, tetromino.rotation);

    const originalMatrix = currentTetromino.shape.matrix;
    const shapeKey = `shape_${currentTetromino.shape.shape_name}_prediction`;

    // Ukuran original shape (sebelum rotation) untuk image display
    const originalWidth = originalMatrix[0].length * this.config.tileSize;
    const originalHeight = originalMatrix.length * this.config.tileSize;

    // Hitung center berdasarkan actual filled tiles untuk akurasi
    const center = this.calculateTrueCenter(currentTetromino.matrix, optimalPlacement.x, optimalPlacement.y);

    // Render optimal prediction shape with current tetromino rotation - NO TEXT
    this.predictionImage = this.scene.add.image(center.x, center.y, shapeKey);
    this.predictionImage.setDisplaySize(originalWidth, originalHeight);
    this.predictionImage.setAngle(tetromino.rotation); // Use current rotation, not optimal
    this.predictionImage.setAlpha(1); // Guide visibility
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
   * Calculate optimal placement for maximum capacity coverage
   * Uses current tetromino rotation and tests different x positions
   */
  private calculateOptimalPlacement(
    tetromino: Tetromino,
    gameBoard: any,
    nextTetrominos: Tetromino[]
  ): { x: number; y: number; rotation: number } {
    let bestPlacement = { x: tetromino.x, y: tetromino.y, rotation: tetromino.rotation };
    let bestScore = -Infinity;

    // Create tetromino with current rotation
    const currentRotatedTetromino = this.createRotatedTetromino(tetromino, tetromino.rotation);

    // Test all possible x positions
    for (let x = -2; x < this.config.gridWidth; x++) {
      const testTetromino = { ...currentRotatedTetromino, x, y: 0 };

      // Check if position is valid at top
      if (gameBoard.canPlace(testTetromino)) {
        // Find landing position
        const landingPos = this.calculateLandingPosition(testTetromino, gameBoard);
        const landedTetromino = { ...testTetromino, x: landingPos.x, y: landingPos.y };

        // Check if this placement would cause game over (tetromino placed in top row)
        if (this.wouldCauseGameOver(landedTetromino, gameBoard)) {
          continue; // Skip game-over positions
        }

        // Evaluate this placement
        const score = this.evaluatePlacement(landedTetromino, gameBoard, nextTetrominos);

        if (score > bestScore) {
          bestScore = score;
          bestPlacement = { x: landingPos.x, y: landingPos.y, rotation: tetromino.rotation };
        }
      }
    }

    return bestPlacement;
  }

  /**
   * Check if placing tetromino at this position would cause game over
   * Game over occurs when any part of the tetromino is in row 0
   */
  private wouldCauseGameOver(tetromino: Tetromino, gameBoard: any): boolean {
    const matrix = tetromino.matrix;

    // Check if any part of the tetromino is in row 0 (top row)
    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        if (matrix[row][col] === 1) {
          const gridY = tetromino.y + row;
          // If any filled tile is in the top row, it would cause game over
          if (gridY <= 0) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * Create rotated version of tetromino for testing
   */
  private createRotatedTetromino(tetromino: Tetromino, rotation: number): Tetromino {
    if (rotation === 0 || tetromino.shape.shape_name === 'o') {
      return tetromino;
    }

    const matrix = tetromino.shape.matrix;
    let rotatedMatrix: number[][];

    switch (rotation) {
      case 90:
        rotatedMatrix = this.rotateMatrix90(matrix);
        break;
      case 180:
        rotatedMatrix = this.rotateMatrix180(matrix);
        break;
      case 270:
        rotatedMatrix = this.rotateMatrix270(matrix);
        break;
      default:
        rotatedMatrix = matrix;
    }

    return {
      ...tetromino,
      rotation,
      matrix: rotatedMatrix
    };
  }

  /**
   * Rotate matrix 90 degrees clockwise
   */
  private rotateMatrix90(matrix: number[][]): number[][] {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const rotated = Array(cols).fill(null).map(() => Array(rows).fill(0));

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        rotated[col][rows - 1 - row] = matrix[row][col];
      }
    }

    return rotated;
  }

  /**
   * Rotate matrix 180 degrees
   */
  private rotateMatrix180(matrix: number[][]): number[][] {
    return matrix.map(row => [...row].reverse()).reverse();
  }

  /**
   * Rotate matrix 270 degrees clockwise (90 counter-clockwise)
   */
  private rotateMatrix270(matrix: number[][]): number[][] {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const rotated = Array(cols).fill(null).map(() => Array(rows).fill(0));

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        rotated[cols - 1 - col][row] = matrix[row][col];
      }
    }

    return rotated;
  }

  /**
   * Evaluate placement quality based on multiple factors
   */
  private evaluatePlacement(
    placedTetromino: Tetromino,
    gameBoard: any,
    nextTetrominos: Tetromino[]
  ): number {
    let score = 0;

    // Create temporary grid state with this placement
    const tempGrid = this.simulatePlacement(placedTetromino, gameBoard);

    // Factor 1: Immediate coverage - tiles filled by this piece
    const tilesFilled = this.countTilesFilled(placedTetromino);
    score += tilesFilled * 10;

    // Factor 2: Flatness preference - penalize creating deep holes
    const flatnessScore = this.calculateFlatness(tempGrid);
    score += flatnessScore * 5;

    // Factor 3: Future placement potential - how well future pieces can fit
    const futureScore = this.evaluateFuturePotential(tempGrid, nextTetrominos.slice(0, 3));
    score += futureScore * 3;

    // Factor 4: Height preference - prefer lower placements
    const heightScore = (this.config.gridHeight - placedTetromino.y) * 2;
    score += heightScore;

    // Factor 5: Edge preference - prefer placements against walls for stability
    const edgeScore = this.calculateEdgeScore(placedTetromino);
    score += edgeScore;

    // Factor 6: Complete lines bonus - high bonus for completing lines
    const linesBonus = this.countCompletedLines(tempGrid) * 50;
    score += linesBonus;

    return score;
  }

  /**
   * Simulate placement on temporary grid
   */
  private simulatePlacement(tetromino: Tetromino, gameBoard: any): boolean[][] {
    const tempGrid = Array(this.config.gridHeight).fill(null).map(() =>
      Array(this.config.gridWidth).fill(false)
    );

    // Copy current grid state
    const currentGrid = gameBoard.getGrid();
    for (let row = 0; row < this.config.gridHeight; row++) {
      for (let col = 0; col < this.config.gridWidth; col++) {
        tempGrid[row][col] = currentGrid[row][col].filled;
      }
    }

    // Add tetromino placement
    const matrix = tetromino.matrix;
    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        if (matrix[row][col] === 1) {
          const gridX = tetromino.x + col;
          const gridY = tetromino.y + row;
          if (gridY >= 0 && gridY < this.config.gridHeight && gridX >= 0 && gridX < this.config.gridWidth) {
            tempGrid[gridY][gridX] = true;
          }
        }
      }
    }

    return tempGrid;
  }

  /**
   * Count tiles filled by tetromino
   */
  private countTilesFilled(tetromino: Tetromino): number {
    let count = 0;
    const matrix = tetromino.matrix;
    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        if (matrix[row][col] === 1) count++;
      }
    }
    return count;
  }

  /**
   * Calculate flatness - lower penalty for flatter surfaces
   */
  private calculateFlatness(grid: boolean[][]): number {
    let flatnessScore = 0;

    for (let col = 0; col < this.config.gridWidth; col++) {
      // Find highest filled cell in this column
      let highestFilled = this.config.gridHeight;
      for (let row = 0; row < this.config.gridHeight; row++) {
        if (grid[row][col]) {
          highestFilled = row;
          break;
        }
      }

      // Check for deep holes
      for (let row = highestFilled + 1; row < this.config.gridHeight; row++) {
        if (!grid[row][col]) {
          // Found a hole - penalize based on depth
          flatnessScore -= (this.config.gridHeight - row);
        }
      }
    }

    return flatnessScore;
  }

  /**
   * Evaluate how well future tetrominos can fit in remaining spaces
   */
  private evaluateFuturePotential(grid: boolean[][], nextTetrominos: Tetromino[]): number {
    let futureScore = 0;

    for (const nextTetromino of nextTetrominos) {
      let bestFitScore = 0;

      // Test different positions for this future piece
      for (let x = 0; x < this.config.gridWidth; x++) {
        for (let y = 0; y < this.config.gridHeight; y++) {
          const testTetromino = { ...nextTetromino, x, y };

          if (this.canPlaceInGrid(testTetromino, grid)) {
            // Count how many cells this would fill
            const wouldFill = this.countWouldFill(testTetromino, grid);
            bestFitScore = Math.max(bestFitScore, wouldFill);
          }
        }
      }

      futureScore += bestFitScore;
    }

    return futureScore;
  }

  /**
   * Check if tetromino can be placed in simulated grid
   */
  private canPlaceInGrid(tetromino: Tetromino, grid: boolean[][]): boolean {
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

          // Check collision with filled cells
          if (gridY >= 0 && grid[gridY][gridX]) {
            return false;
          }
        }
      }
    }

    return true;
  }

  /**
   * Count how many cells tetromino would fill in empty spaces
   */
  private countWouldFill(tetromino: Tetromino, grid: boolean[][]): number {
    let wouldFill = 0;
    const matrix = tetromino.matrix;

    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        if (matrix[row][col] === 1) {
          const gridX = tetromino.x + col;
          const gridY = tetromino.y + row;

          if (gridY >= 0 && gridY < this.config.gridHeight &&
              gridX >= 0 && gridX < this.config.gridWidth) {
            // Count cells that would fill gaps (surrounded by filled cells)
            if (!grid[gridY][gridX]) {
              wouldFill++;
            }
          }
        }
      }
    }

    return wouldFill;
  }

  /**
   * Calculate edge placement score
   */
  private calculateEdgeScore(tetromino: Tetromino): number {
    const matrix = tetromino.matrix;
    let edgeScore = 0;

    // Check if touching left wall
    for (let row = 0; row < matrix.length; row++) {
      if (matrix[row][0] === 1 && tetromino.x === 0) {
        edgeScore += 2;
      }
    }

    // Check if touching right wall
    const rightCol = matrix[0].length - 1;
    for (let row = 0; row < matrix.length; row++) {
      if (matrix[row][rightCol] === 1 && tetromino.x + rightCol === this.config.gridWidth - 1) {
        edgeScore += 2;
      }
    }

    // Check if on bottom
    const bottomRow = matrix.length - 1;
    for (let col = 0; col < matrix[bottomRow].length; col++) {
      if (matrix[bottomRow][col] === 1 && tetromino.y + bottomRow === this.config.gridHeight - 1) {
        edgeScore += 3;
      }
    }

    return edgeScore;
  }

  /**
   * Count completed lines in simulated grid
   */
  private countCompletedLines(grid: boolean[][]): number {
    let completedLines = 0;

    for (let row = 0; row < this.config.gridHeight; row++) {
      let isComplete = true;
      for (let col = 0; col < this.config.gridWidth; col++) {
        if (!grid[row][col]) {
          isComplete = false;
          break;
        }
      }
      if (isComplete) completedLines++;
    }

    return completedLines;
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
