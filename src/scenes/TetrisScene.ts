import Phaser from 'phaser';
import { ShapeManager } from '../managers/ShapeManager';
import { TetrominoRenderer } from '../managers/TetrominoRenderer';
import { GameBoard } from '../managers/GameBoard';
import { UIManager } from '../managers/UIManager';
import { Tetromino, ShapeData, GameConfig, GameplayConfig } from '../types';
import { GAME_CONSTANTS, ASSET_PATHS } from '../config/constants';

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

  // Explorer mode (prediction)
  private isExplorerMode: boolean = false;

  // Gameplay config
  private gameplayConfigs: GameplayConfig[] = [];
  private currentGameplayConfig: GameplayConfig | null = null;

  // Game config
  private config: GameConfig = {
    tileSize: GAME_CONSTANTS.TILE_SIZE,
    gridWidth: GAME_CONSTANTS.GRID_WIDTH,
    gridHeight: GAME_CONSTANTS.GRID_HEIGHT,
    boardX: GAME_CONSTANTS.BOARD_X,
    boardY: GAME_CONSTANTS.BOARD_Y
  };

  // Game timing
  private dropTimer: number = 0;
  private dropInterval: number = GAME_CONSTANTS.DROP_INTERVAL;
  private isGameActive: boolean = false;
  private gameTimer: number = GAME_CONSTANTS.COUNTDOWN_DURATION;
  private constGameTime: number = GAME_CONSTANTS.COUNTDOWN_DURATION;

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
    this.load.image('background', ASSET_PATHS.BACKGROUND);

    // Load panel play area - will be loaded dynamically after reading config

    // Load profile placeholder
    this.load.image('profile', ASSET_PATHS.PROFILE);

    // Load control buttons
    this.load.image('button_skip', ASSET_PATHS.BUTTONS.SKIP);
    this.load.image('button_switch', ASSET_PATHS.BUTTONS.SWITCH);
    this.load.image('button_left', ASSET_PATHS.BUTTONS.LEFT);
    this.load.image('button_right', ASSET_PATHS.BUTTONS.RIGHT);
    this.load.image('button_down', ASSET_PATHS.BUTTONS.DOWN);
    this.load.image('button_rotate', ASSET_PATHS.BUTTONS.ROTATE);

    // Load shape data JSON
    this.load.json('shapeData', ASSET_PATHS.DATA.SHAPES);
    this.load.json('labelData', ASSET_PATHS.DATA.LABELS);
    this.load.json('gameplayConfig', ASSET_PATHS.DATA.GAMEPLAY_CONFIG);

    // Load shape images - color versions
    this.load.image('shape_i_color', ASSET_PATHS.SHAPES_COLOR.I);
    this.load.image('shape_j_color', ASSET_PATHS.SHAPES_COLOR.J);
    this.load.image('shape_l_color', ASSET_PATHS.SHAPES_COLOR.L);
    this.load.image('shape_o_color', ASSET_PATHS.SHAPES_COLOR.O);
    this.load.image('shape_s_color', ASSET_PATHS.SHAPES_COLOR.S);
    this.load.image('shape_t_color', ASSET_PATHS.SHAPES_COLOR.T);
    this.load.image('shape_z_color', ASSET_PATHS.SHAPES_COLOR.Z);

    // Load shape images - outline versions
    this.load.image('shape_i_outline', ASSET_PATHS.SHAPES_OUTLINE.I);
    this.load.image('shape_j_outline', ASSET_PATHS.SHAPES_OUTLINE.J);
    this.load.image('shape_l_outline', ASSET_PATHS.SHAPES_OUTLINE.L);
    this.load.image('shape_o_outline', ASSET_PATHS.SHAPES_OUTLINE.O);
    this.load.image('shape_s_outline', ASSET_PATHS.SHAPES_OUTLINE.S);
    this.load.image('shape_t_outline', ASSET_PATHS.SHAPES_OUTLINE.T);
    this.load.image('shape_z_outline', ASSET_PATHS.SHAPES_OUTLINE.Z);

    // Load shape images - prediction versions
    this.load.image('shape_i_prediction', ASSET_PATHS.SHAPES_PREDICTION.I);
    this.load.image('shape_j_prediction', ASSET_PATHS.SHAPES_PREDICTION.J);
    this.load.image('shape_l_prediction', ASSET_PATHS.SHAPES_PREDICTION.L);
    this.load.image('shape_o_prediction', ASSET_PATHS.SHAPES_PREDICTION.O);
    this.load.image('shape_s_prediction', ASSET_PATHS.SHAPES_PREDICTION.S);
    this.load.image('shape_t_prediction', ASSET_PATHS.SHAPES_PREDICTION.T);
    this.load.image('shape_z_prediction', ASSET_PATHS.SHAPES_PREDICTION.Z);

    // Load slider assets
    this.load.image('slider_background', ASSET_PATHS.SLIDER.BACKGROUND);
    this.load.image('slider_progress', ASSET_PATHS.SLIDER.PROGRESS);
    this.load.image('slider_handling', ASSET_PATHS.SLIDER.HANDLING);
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

    // Load shape, label, and gameplay data
    const shapeData = this.cache.json.get('shapeData') as ShapeData[];
    const labelData = this.cache.json.get('labelData') as string[];
    const gameplayConfigData = this.cache.json.get('gameplayConfig') as GameplayConfig[];

    this.shapeManager.setShapeData(shapeData);
    this.shapeManager.setLabelData(labelData);
    this.gameplayConfigs = gameplayConfigData;

    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get('type') || 'explorer'; // Default to explorer

    // Find current gameplay config based on URL parameter
    this.currentGameplayConfig = this.gameplayConfigs.find(config => config.type === typeParam) || null;

    // Load play area image dynamically if specified, otherwise use default
    const playAreaPath = this.currentGameplayConfig?.play_area || ASSET_PATHS.DEFAULT_PLAY_AREA;

    // Start the scene when image loading is complete
    this.load.image('panel', playAreaPath);
    this.load.start();

    // Wait for loading to complete before setting up UI and starting game
    this.load.once('complete', () => {
      // Setup UI after image is loaded
      this.uiManager.setupUI(this.currentGameplayConfig);

      // Check if prediction mode based on special_tag
      this.isExplorerMode = this.currentGameplayConfig?.special_tag.includes('prediction') || false;

      // Setup button controls
      this.uiManager.setupButtonCallbacks({
        onSkip: () => this.skipCurrentBlock(),
        onSwitch: () => this.switchCurrentBlock(),
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
    });
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
    this.gameTimer = this.constGameTime; // Reset countdown timer
    this.uiManager.updateTimer(this.gameTimer); // Update timer display
    this.uiManager.updateSlider(this.gameTimer, this.constGameTime); // Update slider display

    // Generate 7 next tetrominos
    this.nextTetrominos = [];
    for (let i = 0; i < 7; i++) {
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

    // Update prediction for new tetromino
    this.updatePrediction();

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

    // Create 7 previews horizontal (dari kanan ke kiri)
    // Align right edge of first shape with right side of play area
    const maxTetrominoHeight = GAME_CONSTANTS.MAX_TETROMINO_HEIGHT;
    const scale = GAME_CONSTANTS.PREVIEW_SCALE;
    const baseSpacing = this.config.tileSize * scale * GAME_CONSTANTS.PREVIEW_BASE_SPACING_MULTIPLIER;
    const playAreaRight = this.config.boardX + GAME_CONSTANTS.PLAY_AREA_WIDTH;
    const firstShapeWidth = this.nextTetrominos[0].matrix[0].length * this.config.tileSize * scale;
    const startX = playAreaRight - (firstShapeWidth / 2); // Position so right edge aligns

    // Calculate preview Y position: play area top - spacing - (max tetromino height * tileSize * scale / 2)
    // This positions the center so the bottom is spacing from play area top
    const previewY = this.config.boardY - GAME_CONSTANTS.TETROMINO_DISTANCE_FROM_PLAY_AREA - (maxTetrominoHeight * this.config.tileSize * scale / 2);

    let currentX = startX;

    for (let i = 0; i < 7; i++) {
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
        const currentShapeWidth = this.nextTetrominos[i].matrix[0].length * this.config.tileSize * scale;

        if (i < 6 && this.nextTetrominos[i + 1]) {
          const nextShapeWidth = this.nextTetrominos[i + 1].matrix[0].length * this.config.tileSize * scale;
          // Move left by half of current width + spacing + half of next width
          currentX -= (currentShapeWidth / 2) + baseSpacing + (nextShapeWidth / 2);
        }
      }
    }
  }

  /**
   * Update prediction (only in explorer mode)
   */
  private updatePrediction(): void {
    if (this.isExplorerMode && this.currentTetromino) {
      // Pass next tetrominos for optimal placement calculation
      this.tetrominoRenderer.renderPrediction(
        this.currentTetromino,
        this.gameBoard,
        this.nextTetrominos
      );
    } else {
      this.tetrominoRenderer.destroyPrediction();
    }
  }

  /**
   * Update - Game loop
   */
  update(time: number, delta: number): void {
    if (!this.currentTetromino) {
      return;
    }

    // Update game timer (countdown)
    if (this.isGameActive) {
      this.gameTimer -= delta / 1000; // Convert to seconds and countdown
      if (this.gameTimer <= 0) {
        this.gameTimer = 0;
        this.gameOver(); // Time's up!
      }
      this.uiManager.updateTimer(Math.ceil(this.gameTimer)); // Show ceiling for better UX
      this.uiManager.updateSlider(Math.ceil(this.gameTimer), this.constGameTime); // Update slider progress
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
      this.updatePrediction();
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
      this.updatePrediction();
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
      this.updatePrediction();
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
      this.updatePrediction();
    }
  }

  /**
   * Skip current block and spawn next one
   */
  private skipCurrentBlock(): void {
    if (!this.currentTetromino) return;

    // Destroy current tetromino renderer
    this.tetrominoRenderer.destroy();

    // Spawn next tetromino without locking
    this.spawnNextTetromino();
  }

  /**
   * Switch current block shape to a random tetromino
   */
  private switchCurrentBlock(): void {
    if (!this.currentTetromino) return;

    // Destroy current tetromino renderer
    this.tetrominoRenderer.destroy();

    // Generate a random tetromino shape
    const randomTetromino = this.shapeManager.generateRandomTetromino();

    // Transform current tetromino to the new random shape, preserving position and rotation
    // Apply the current rotation to the new shape
    let rotatedMatrix = randomTetromino.shape.matrix;
    for (let i = 0; i < this.currentTetromino.rotation / 90; i++) {
      rotatedMatrix = this.shapeManager.rotateMatrix(rotatedMatrix);
    }

    this.currentTetromino = {
      shape: randomTetromino.shape,
      x: this.currentTetromino.x,
      y: this.currentTetromino.y,
      rotation: this.currentTetromino.rotation,
      matrix: rotatedMatrix,
      labels: this.currentTetromino.labels // Keep the same labels
    };

    // Update prediction for new tetromino shape
    this.updatePrediction();
  }

  /**
   * Lock tetromino to board
   */
  private lockTetromino(): void {
    if (!this.currentTetromino) return;

    // Destroy prediction before locking
    this.tetrominoRenderer.destroyPrediction();

    // Lock ke board
    this.gameBoard.lockTetromino(this.currentTetromino);

    // Destroy renderer container
    this.tetrominoRenderer.destroy();

    // Clear completed lines
    // const linesCleared = this.gameBoard.clearLines();

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