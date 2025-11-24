import Phaser from 'phaser';
import { ShapeManager } from '../managers/ShapeManager';
import { TetrominoRenderer } from '../managers/TetrominoRenderer';
import { GameBoard } from '../managers/GameBoard';
import { UIManager } from '../managers/UIManager';
import { Tetromino, ShapeData, GameConfig } from '../types';

/**
 * TetrisScene - Main game scene
 */
export class TetrisScene extends Phaser.Scene {
  // Managers
  private shapeManager!: ShapeManager;
  private tetrominoRenderer!: TetrominoRenderer;
  private gameBoard!: GameBoard;
  private uiManager!: UIManager;

  // Game state
  private currentTetromino: Tetromino | null = null;
  private nextTetrominos: Tetromino[] = [];
  private nextPreviewContainers: Phaser.GameObjects.Container[] = [];

  // Game config
  private config: GameConfig = {
    tileSize: 40,
    gridWidth: 8,
    gridHeight: 9,
    boardX: 20, // (360 - 320) / 2 untuk center horizontal
    boardY: 230 // Posisi Y play area
  };

  // Game timing
  private dropTimer: number = 0;
  private dropInterval: number = 1000; // 1 detik
  private isGameActive: boolean = false;

  // Debug
  private debugMode: boolean = false;
  private debugGraphics!: Phaser.GameObjects.Graphics;
  private debugText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'TetrisScene' });
  }

  /**
   * Preload - Load semua assets
   */
  preload(): void {
    // Load background
    this.load.image('background', '/images/background.png');
    
    // Load panel play area
    this.load.image('panel', '/images/panel-play-area-purple.png');
    
    // Load profile placeholder
    this.load.image('profile', '/images/profile-placeholder.png');
    
    // Load control buttons
    this.load.image('button_left', '/images/button/left.png');
    this.load.image('button_right', '/images/button/right.png');
    this.load.image('button_down', '/images/button/down.png');
    this.load.image('button_rotate', '/images/button/rotate.png');
    
    // Load shape data JSON
    this.load.json('shapeData', '/shape_data.json');
    this.load.json('labelData', '/label_block.json');
    
    // Load shape images - color versions
    this.load.image('shape_i_color', '/images/shapes/colours/i.png');
    this.load.image('shape_j_color', '/images/shapes/colours/j.png');
    this.load.image('shape_l_color', '/images/shapes/colours/l.png');
    this.load.image('shape_o_color', '/images/shapes/colours/o.png');
    this.load.image('shape_s_color', '/images/shapes/colours/s.png');
    this.load.image('shape_t_color', '/images/shapes/colours/t.png');
    this.load.image('shape_z_color', '/images/shapes/colours/z.png');
    
    // Load shape images - outline versions
    this.load.image('shape_i_outline', '/images/shapes/outline/i.png');
    this.load.image('shape_j_outline', '/images/shapes/outline/j.png');
    this.load.image('shape_l_outline', '/images/shapes/outline/l.png');
    this.load.image('shape_o_outline', '/images/shapes/outline/o.png');
    this.load.image('shape_s_outline', '/images/shapes/outline/s.png');
    this.load.image('shape_t_outline', '/images/shapes/outline/t.png');
    this.load.image('shape_z_outline', '/images/shapes/outline/z.png');
  }

  /**
   * Create - Initialize game
   */
  create(): void {
    // Initialize managers
    this.shapeManager = new ShapeManager();
    this.tetrominoRenderer = new TetrominoRenderer(this, this.config);
    this.gameBoard = new GameBoard(this, this.config);
    this.uiManager = new UIManager(this, this.config);

    // Load shape and label data
    const shapeData = this.cache.json.get('shapeData') as ShapeData[];
    const labelData = this.cache.json.get('labelData') as string[];
    this.shapeManager.setShapeData(shapeData);
    this.shapeManager.setLabelData(labelData);

    // Setup UI
    this.uiManager.setupUI();

    // Setup button controls
    this.uiManager.setupButtonCallbacks({
      onLeft: () => this.moveLeft(),
      onRight: () => this.moveRight(),
      onDown: () => this.moveDown(),
      onRotate: () => this.rotate()
    });


    // Setup debug mode
    if (this.debugMode) {
      this.setupDebug();
    }

    // Setup keyboard for gravity toggle
    this.input.keyboard?.on('keydown-G', () => {
      this.isGameActive = !this.isGameActive;
      console.log('Gravity:', this.isGameActive ? 'ON' : 'OFF');
    });

    // Start game
    this.startGame();
  }

  /**
   * Setup debug graphics dan text
   */
  private setupDebug(): void {
    this.debugGraphics = this.add.graphics();
    this.debugGraphics.setDepth(1000);

    this.debugText = this.add.text(10, 600, '', {
      fontFamily: 'Nunito',
      fontSize: '10px',
      color: '#00FF00',
      backgroundColor: '#000000',
      padding: { x: 5, y: 5 }
    });
    this.debugText.setDepth(1001);
  }

  /**
   * Start/Restart game
   */
  private startGame(): void {
    this.gameBoard.reset();
    this.isGameActive = true;
    this.dropTimer = 0;

    // Generate 4 next tetrominos
    this.nextTetrominos = [];
    for (let i = 0; i < 4; i++) {
      this.nextTetrominos.push(this.shapeManager.generateRandomTetromino());
    }

    // Update preview
    this.updateNextShapePreview();

    // Spawn first tetromino
    this.spawnNextTetromino();
  }

  /**
   * Spawn next tetromino
   */
  private spawnNextTetromino(): void {
    // Ambil shape pertama dari queue
    this.currentTetromino = this.nextTetrominos.shift()!;
    
    // Tambahkan shape baru di akhir queue
    this.nextTetrominos.push(this.shapeManager.generateRandomTetromino());

    // Update next shape preview
    this.updateNextShapePreview();

    // Check if game over
    if (!this.gameBoard.canPlace(this.currentTetromino)) {
      this.gameOver();
    }
  }

  /**
   * Update next shape preview (4 shapes horizontal, kanan ke kiri)
   */
  private updateNextShapePreview(): void {
    // Destroy old previews
    this.nextPreviewContainers.forEach(container => container.destroy());
    this.nextPreviewContainers = [];

    // Create 4 previews horizontal (dari kanan ke kiri)
    const startX = 300; // Start from right side
    const previewY = 180;
    const scale = 0.7;
    const baseSpacing = 15; // Base spacing between shapes

    let currentX = startX;

    for (let i = 0; i < 4; i++) {
      if (this.nextTetrominos[i]) {
        // First shape (index 0) uses color, others use outline
        const useColor = i === 0;
        
        const container = this.tetrominoRenderer.renderPreview(
          this.nextTetrominos[i],
          currentX,
          previewY,
          scale,
          useColor
        );
        this.nextPreviewContainers.push(container);

        // Calculate spacing based on current shape width + next shape width
        const currentShapeWidth = this.nextTetrominos[i].shape.matrix[0].length * this.config.tileSize * scale;
        
        if (i < 3 && this.nextTetrominos[i + 1]) {
          const nextShapeWidth = this.nextTetrominos[i + 1].shape.matrix[0].length * this.config.tileSize * scale;
          // Move left by half of current width + spacing + half of next width
          currentX -= (currentShapeWidth / 2) + baseSpacing + (nextShapeWidth / 2);
        }
      }
    }
  }

  /**
   * Update - Game loop
   */
  update(time: number, delta: number): void {
    if (!this.currentTetromino) {
      return;
    }

    // Auto drop tetromino (only if gravity active)
    if (this.isGameActive) {
      this.dropTimer += delta;
      if (this.dropTimer >= this.dropInterval) {
        this.dropTimer = 0;
        this.moveDown();
      }
    }

    // Render current tetromino
    this.tetrominoRenderer.renderTetromino(this.currentTetromino);

    // Debug rendering
    if (this.debugMode) {
      this.renderDebug();
    }
  }

  /**
   * Render debug info
   */
  private renderDebug(): void {
    this.debugGraphics.clear();

    if (!this.currentTetromino) return;

    // Draw grid lines
    this.debugGraphics.lineStyle(1, 0x00ff00, 0.3);
    for (let row = 0; row <= this.config.gridHeight; row++) {
      const y = this.config.boardY + row * this.config.tileSize;
      this.debugGraphics.lineBetween(
        this.config.boardX,
        y,
        this.config.boardX + this.config.gridWidth * this.config.tileSize,
        y
      );
    }
    for (let col = 0; col <= this.config.gridWidth; col++) {
      const x = this.config.boardX + col * this.config.tileSize;
      this.debugGraphics.lineBetween(
        x,
        this.config.boardY,
        x,
        this.config.boardY + this.config.gridHeight * this.config.tileSize
      );
    }

    // Draw current tetromino bounding box
    const matrix = this.currentTetromino.matrix;
    this.debugGraphics.lineStyle(2, 0xff0000, 0.8);
    
    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix[row].length; col++) {
        if (matrix[row][col] === 1) {
          const x = this.config.boardX + (this.currentTetromino.x + col) * this.config.tileSize;
          const y = this.config.boardY + (this.currentTetromino.y + row) * this.config.tileSize;
          this.debugGraphics.strokeRect(x, y, this.config.tileSize, this.config.tileSize);
        }
      }
    }

    // Draw shape center point
    const shapeWidth = matrix[0].length * this.config.tileSize;
    const shapeHeight = matrix.length * this.config.tileSize;
    const shapeCenterX = this.config.boardX + this.currentTetromino.x * this.config.tileSize + shapeWidth / 2;
    const shapeCenterY = this.config.boardY + this.currentTetromino.y * this.config.tileSize + shapeHeight / 2;
    
    this.debugGraphics.fillStyle(0xff00ff, 1);
    this.debugGraphics.fillCircle(shapeCenterX, shapeCenterY, 3);

    // Draw text positions
    this.debugGraphics.fillStyle(0x00ffff, 1);
    for (let i = 0; i < this.currentTetromino.shape.text_position.length; i++) {
      const [offsetX, offsetY] = this.currentTetromino.shape.text_position[i];
      
      // Original position (before rotation)
      this.debugGraphics.fillCircle(shapeCenterX + offsetX, shapeCenterY + offsetY, 2);
      
      // Rotated position
      const rad = Phaser.Math.DegToRad(this.currentTetromino.rotation);
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const rotatedX = offsetX * cos - offsetY * sin;
      const rotatedY = offsetX * sin + offsetY * cos;
      
      this.debugGraphics.lineStyle(1, 0xffff00, 0.5);
      this.debugGraphics.lineBetween(
        shapeCenterX + offsetX,
        shapeCenterY + offsetY,
        shapeCenterX + rotatedX,
        shapeCenterY + rotatedY
      );
      
      this.debugGraphics.fillStyle(0xffff00, 1);
      this.debugGraphics.fillCircle(shapeCenterX + rotatedX, shapeCenterY + rotatedY, 3);
    }

    // Debug text info
    const debugInfo = [
      `Shape: ${this.currentTetromino.shape.shape_name}`,
      `Position: (${this.currentTetromino.x}, ${this.currentTetromino.y})`,
      `Rotation: ${this.currentTetromino.rotation}°`,
      `Matrix: ${matrix.length}x${matrix[0].length}`,
      `Center: (${shapeCenterX.toFixed(0)}, ${shapeCenterY.toFixed(0)})`,
      `Labels: ${this.currentTetromino.labels.join(', ')}`,
      `Text Positions: ${this.currentTetromino.shape.text_position.length}`,
    ];

    this.debugText.setText(debugInfo.join('\n'));
  }

  /**
   * Move tetromino left
   */
  private moveLeft(): void {
    if (!this.currentTetromino) return;

    const newTetromino = { ...this.currentTetromino, x: this.currentTetromino.x - 1 };
    if (this.gameBoard.canPlace(newTetromino)) {
      this.currentTetromino = newTetromino;
    }
  }

  /**
   * Move tetromino right
   */
  private moveRight(): void {
    if (!this.currentTetromino) return;

    const newTetromino = { ...this.currentTetromino, x: this.currentTetromino.x + 1 };
    if (this.gameBoard.canPlace(newTetromino)) {
      this.currentTetromino = newTetromino;
    }
  }

  /**
   * Move tetromino down
   */
  private moveDown(): void {
    if (!this.currentTetromino) return;

    const newTetromino = { ...this.currentTetromino, y: this.currentTetromino.y + 1 };
    if (this.gameBoard.canPlace(newTetromino)) {
      this.currentTetromino = newTetromino;
    } else {
      // Lock tetromino
      this.lockTetromino();
    }
  }

  /**
   * Rotate tetromino
   */
  private rotate(): void {
    if (!this.currentTetromino) return;

    const rotatedTetromino = this.shapeManager.rotateTetromino(this.currentTetromino);
    if (this.gameBoard.canPlace(rotatedTetromino)) {
      this.currentTetromino = rotatedTetromino;
    }
  }

  /**
   * Lock tetromino to board
   */
  private lockTetromino(): void {
    if (!this.currentTetromino) return;

    // Lock ke board
    this.gameBoard.lockTetromino(this.currentTetromino);

    // Destroy renderer container
    this.tetrominoRenderer.destroy();

    // Clear completed lines
    const linesCleared = this.gameBoard.clearLines();

    // Check game over
    if (this.gameBoard.isGameOver()) {
      this.gameOver();
      return;
    }

    // Spawn next tetromino
    this.spawnNextTetromino();
  }

  /**
   * Game over
   */
  private gameOver(): void {
    this.isGameActive = false;

    // Show game over text
    const gameOverText = this.add.text(180, 360, 'GAME OVER', {
      fontFamily: 'Nunito',
      fontSize: '32px',
      color: '#FFFFFF',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Restart after 3 seconds
    this.time.delayedCall(3000, () => {
      gameOverText.destroy();
      this.startGame();
    });
  }
}