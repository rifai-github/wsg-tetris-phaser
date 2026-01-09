import Phaser from 'phaser';
import lottie, { AnimationItem } from 'lottie-web';
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

  // BOARD_X: 20, // (393 - 353) / 2 = 20px for centering
  // BOARD_Y: 319, // Position to have 136px distance from bottom (852 - 397 - 136)

  // Game config
  private config: GameConfig = {
    tileSize: GAME_CONSTANTS.TILE_SIZE,
    gridWidth: GAME_CONSTANTS.GRID_WIDTH,
    gridHeight: GAME_CONSTANTS.GRID_HEIGHT,
    boardX: 0, // Will be updated in create()
    boardY: 0, // Will be updated in create()
  };

  // Game timing
  private dropTimer: number = 0;
  private dropInterval: number = GAME_CONSTANTS.DROP_INTERVAL;
  private isGameActive: boolean = false;
  private gameTimer: number = GAME_CONSTANTS.COUNTDOWN_DURATION;
  private constGameTime: number = GAME_CONSTANTS.COUNTDOWN_DURATION;

  // Soft drop (hold down button)
  private isSoftDropping: boolean = false;
  private softDropInterval: number = 100; // Fast drop interval when holding down (50ms)
  private softDropTimer: number = 0;

  // Pre-game countdown
  private isCountdownActive: boolean = false;
  private countdownTimer: number = 0;
  private countdownNumber!: Phaser.GameObjects.Text;
  private countdownDuration: number = 3000; // 3 seconds countdown
  private lottieContainer!: HTMLDivElement;
  private lottieAnimation: AnimationItem | null = null;

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

    // Load timer background
    this.load.image('timer_bg', ASSET_PATHS.TIMER_BG);

    // Load control buttons
    this.load.image('button_skip', ASSET_PATHS.BUTTONS.SKIP);
    this.load.image('button_switch', ASSET_PATHS.BUTTONS.SWITCH);
    this.load.image('button_left', ASSET_PATHS.BUTTONS.LEFT);
    this.load.image('button_right', ASSET_PATHS.BUTTONS.RIGHT);
    this.load.image('button_down', ASSET_PATHS.BUTTONS.DOWN);
    this.load.image('button_rotate', ASSET_PATHS.BUTTONS.ROTATE);

    // Load shape data JSON
    this.load.json('shapeData', ASSET_PATHS.DATA.SHAPES);
    this.load.json('gameplayConfig', ASSET_PATHS.DATA.GAMEPLAY_CONFIG);

    // Load Lottie animation for countdown
    this.load.json('countdownAnimation', 'animation/Countdown.json');

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

    // Load audio files
    this.load.audio('blockSfx', ASSET_PATHS.AUDIO.BLOCK_SFX);
  }

  /**
   * Create - Initialize game
   */
  create(): void {
    // Calculate actual grid size
    const actualGridWidth = GAME_CONSTANTS.GRID_WIDTH * this.config.tileSize;
    const actualGridHeight = GAME_CONSTANTS.GRID_HEIGHT * this.config.tileSize;

    // Calculate centering offsets within play area
    const horizontalOffset = (GAME_CONSTANTS.PLAY_AREA_WIDTH - actualGridWidth) / 2;
    const verticalOffset = (GAME_CONSTANTS.PLAY_AREA_HEIGHT - actualGridHeight) / 2;

    // Update board position: center play area + centering offset for grid
    this.config.boardX = (this.cameras.main.width - GAME_CONSTANTS.PLAY_AREA_WIDTH) / 2 + horizontalOffset;
    this.config.boardY = (GAME_CONSTANTS.PLAY_AREA_TOP_MARGIN + (GAME_CONSTANTS.MAX_TETROMINO_HEIGHT * this.config.tileSize * GAME_CONSTANTS.PREVIEW_SCALE / 2)) + verticalOffset;


    // Initialize managers
    this.shapeManager = new ShapeManager();
    this.tetrominoRenderer = new TetrominoRenderer(this, this.config);
    this.gameBoard = new GameBoard(this, this.config);
    this.uiManager = new UIManager(this, this.config);

    // Load shape and gameplay data
    const shapeData = this.cache.json.get('shapeData') as ShapeData[];
    const gameplayConfigData = this.cache.json.get('gameplayConfig') as GameplayConfig[];

    // Listen for scale resize to update board position
    // this.scale.on('resize', (gameSize: any) => {
    //   this.config.boardX = (gameSize.width - GAME_CONSTANTS.PLAY_AREA_WIDTH) / 2;
    //   this.config.boardY = gameSize.height - GAME_CONSTANTS.PLAY_AREA_HEIGHT - GAME_CONSTANTS.PLAY_AREA_BOTTOM_MARGIN;
    // });

    this.shapeManager.setShapeData(shapeData);
    this.gameplayConfigs = gameplayConfigData;

    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get('type') || 'explorer'; // Default to explorer

    // Get timer duration from query param or use default
    const timerParam = urlParams.get('timer');
    const timerDuration = timerParam ? parseInt(timerParam, 10) : GAME_CONSTANTS.COUNTDOWN_DURATION;
    this.constGameTime = timerDuration;
    this.gameTimer = timerDuration;

    // Get username from query param or use default
    const username = urlParams.get('username') || undefined;

    // Find current gameplay config based on URL parameter
    this.currentGameplayConfig = this.gameplayConfigs.find(config => config.type === typeParam) || null;

    // Set gameplay type ke ShapeManager untuk filter shape
    this.shapeManager.setGameplayType(typeParam);

    // Load play area image dynamically if specified, otherwise use default
    const playAreaPath = this.currentGameplayConfig?.play_area || ASSET_PATHS.DEFAULT_PLAY_AREA;

    // Start the scene when image loading is complete
    this.load.image('panel', playAreaPath);
    this.load.start();

    // Wait for loading to complete before setting up UI and starting game
    this.load.once('complete', () => {
      // Setup UI after image is loaded
      this.uiManager.setupUI(this.currentGameplayConfig, username);

      // Check if prediction mode based on special_tag
      this.isExplorerMode = this.currentGameplayConfig?.special_tag.includes('prediction') || false;

      // Setup button controls
      this.uiManager.setupButtonCallbacks({
        onSkip: () => this.skipCurrentBlock(),
        onSwitch: () => this.switchCurrentBlock(),
        onLeft: () => this.moveLeft(),
        onRight: () => this.moveRight(),
        onDown: () => this.moveDown(),
        onRotate: () => this.rotate(),
        onDownPress: () => this.startSoftDrop(),
        onDownRelease: () => this.stopSoftDrop()
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

      // Listen for restart message from parent iframe
      this.setupParentMessageListener();

      // Start game
      this.startGame();
    });
  }

  /**
   * Setup listener for messages from parent iframe
   */
  private setupParentMessageListener(): void {
    window.addEventListener('message', (event) => {
      if (event.data.type === 'restart') {
        console.log('Restart command received from parent');
        this.startGame();
      }
    });
  }


  /**
   * Setup debug graphics dan text
   */
  private setupDebug(): void {
    this.debugGraphics = this.add.graphics();
    this.debugGraphics.setDepth(1000);

    this.debugText = this.add.text(10, 600, '', {
      fontFamily: '"Nunito", sans-serif',
      fontSize: '10px',
      color: '#00FF00',
      backgroundColor: '#000000',
      padding: { x: 5, y: 5 },
      resolution: window.devicePixelRatio || 2
    });
    this.debugText.setDepth(1001);
  }

  /**
   * Start/Restart game
   */
  private startGame(): void {
    // Cleanup any existing Lottie animation
    if (this.lottieAnimation) {
      this.lottieAnimation.destroy();
      this.lottieAnimation = null;
    }

    if (this.lottieContainer) {
      // Remove resize/scroll listeners
      const resizeHandler = (this.lottieContainer as any).resizeHandler;
      if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
        window.removeEventListener('scroll', resizeHandler);
      }

      if (this.lottieContainer.parentElement) {
        this.lottieContainer.parentElement.removeChild(this.lottieContainer);
      }
    }

    this.gameBoard.reset();
    this.isGameActive = false; // Don't start game immediately
    this.dropTimer = 0;
    this.gameTimer = this.constGameTime; // Reset countdown timer
    this.uiManager.updateTimer(this.gameTimer); // Update timer display

    // Generate 7 next tetrominos
    this.nextTetrominos = [];
    for (let i = 0; i < 7; i++) {
      this.nextTetrominos.push(this.shapeManager.generateRandomTetromino());
    }

    // Update preview
    this.updateNextShapePreview();

    // Start countdown before spawning first tetromino
    this.startCountdown();
  }

  /**
   * Start countdown before game begins
   */
  private startCountdown(): void {
    this.isCountdownActive = true;
    this.countdownTimer = this.countdownDuration;

    // Create Lottie animation container
    this.createLottieCountdown();
  }

  /**
   * Create Lottie countdown animation
   */
  private createLottieCountdown(): void {
    const containerSize = 400;

    // Create container for Lottie
    this.lottieContainer = document.createElement('div');
    this.lottieContainer.style.position = 'absolute';
    this.lottieContainer.style.width = `${containerSize}px`;
    this.lottieContainer.style.height = `${containerSize}px`;
    this.lottieContainer.style.pointerEvents = 'none';
    this.lottieContainer.style.zIndex = '2000';

    // Add to document body for proper positioning
    document.body.appendChild(this.lottieContainer);

    // Function to update position dynamically (responsive)
    const updatePosition = () => {
      const canvas = this.game.canvas;
      const canvasRect = canvas.getBoundingClientRect();

      // Center in actual canvas position (responsive to scale)
      this.lottieContainer.style.left = `${canvasRect.left + (canvasRect.width - containerSize) / 2}px`;
      this.lottieContainer.style.top = `${canvasRect.top + (canvasRect.height - containerSize) / 2}px`;
    };

    // Initial position
    updatePosition();

    // Update position on window resize for responsiveness
    const resizeHandler = () => updatePosition();
    window.addEventListener('resize', resizeHandler);
    window.addEventListener('scroll', resizeHandler);

    // Store handler for cleanup
    (this.lottieContainer as any).resizeHandler = resizeHandler;

    // Load and play Lottie animation
    const animationData = this.cache.json.get('countdownAnimation');

    this.lottieAnimation = lottie.loadAnimation({
      container: this.lottieContainer,
      renderer: 'svg',
      loop: false,
      autoplay: true,
      animationData: animationData
    });

    // Listen for animation complete

    this.lottieAnimation.addEventListener('complete', () => {
      this.finishCountdown();
    });

    // Calculate duration from animation data (135 frames at 30fps = 4.5 seconds)
    const totalFrames = animationData.op;
    const frameRate = animationData.fr;
    const animationDuration = (totalFrames / frameRate) * 1000; // in ms

    // Update countdown duration to match animation
    this.countdownTimer = animationDuration;
  }

  /**
   * Animate countdown numbers (kept for compatibility but now uses Lottie)
   */
  private animateCountdown(): void {
    // This method is now handled by Lottie animation
    // Keeping for compatibility with any references
  }

  /**
   * Finish countdown and start the game
   */
  private finishCountdown(): void {
    this.isCountdownActive = false;

    // Cleanup Lottie animation
    if (this.lottieAnimation) {
      this.lottieAnimation.destroy();
      this.lottieAnimation = null;
    }

    if (this.lottieContainer) {
      // Remove resize/scroll listeners
      const resizeHandler = (this.lottieContainer as any).resizeHandler;
      if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
        window.removeEventListener('scroll', resizeHandler);
      }

      // Remove from DOM
      if (this.lottieContainer.parentElement) {
        this.lottieContainer.parentElement.removeChild(this.lottieContainer);
      }
    }

    // Start the actual game
    this.isGameActive = true;
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

    // Cari posisi spawn yang valid di baris paling atas
    const spawnPosition = this.findValidSpawnInTopRow(this.currentTetromino);

    if (spawnPosition === null) {
      // Tidak ada posisi kosong di baris atas → GAME OVER
      this.gameOver();
      return;
    }

    // Set posisi spawn yang valid
    this.currentTetromino.x = spawnPosition.x;
    this.currentTetromino.y = spawnPosition.y;

    // Update next shape preview
    this.updateNextShapePreview();

    // Update prediction for new tetromino
    this.updatePrediction();
  }

  /**
   * Cari posisi spawn yang valid di baris paling atas (row 0)
   * Priority: tengah → kiri → kanan
   */
  private findValidSpawnInTopRow(tetromino: Tetromino): { x: number; y: number } | null {
    const matrix = tetromino.matrix;
    const matrixWidth = matrix[0].length;
    const spawnY = 0; // Selalu di baris paling atas

    // Default spawn position: tengah secara horizontal
    const defaultX = Math.floor((this.config.gridWidth - matrixWidth) / 2);

    // Coba posisi default (tengah) di row 0
    if (this.gameBoard.canPlace({ ...tetromino, x: defaultX, y: spawnY })) {
      return { x: defaultX, y: spawnY };
    }

    // Coba geser ke kiri (tetap di y=0)
    for (let x = defaultX - 1; x >= 0; x--) {
      if (this.gameBoard.canPlace({ ...tetromino, x, y: spawnY })) {
        return { x, y: spawnY };
      }
    }

    // Coba geser ke kanan (tetap di y=0)
    for (let x = defaultX + 1; x <= this.config.gridWidth - matrixWidth; x++) {
      if (this.gameBoard.canPlace({ ...tetromino, x, y: spawnY })) {
        return { x, y: spawnY };
      }
    }

    // Tidak ada posisi valid di row 0
    return null;
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
    // Handle countdown before game starts
    if (this.isCountdownActive) {
      this.countdownTimer -= delta;
      const previousSecond = Math.ceil((this.countdownTimer + delta) / 1000);
      const currentSecond = Math.ceil(this.countdownTimer / 1000);

      // Trigger animation when second changes
      if (previousSecond !== currentSecond && currentSecond >= 0) {
        this.animateCountdown();
      }

      return; // Don't process game logic during countdown
    }

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
    }

    // Auto drop tetromino (only if gravity active and not soft dropping)
    if (this.isGameActive && !this.isSoftDropping) {
      this.dropTimer += delta;
      if (this.dropTimer >= this.dropInterval) {
        this.dropTimer = 0;
        this.moveDown();
      }
    }

    // Soft drop tetromino (when holding down button)
    if (this.isGameActive && this.isSoftDropping) {
      this.softDropTimer += delta;
      if (this.softDropTimer >= this.softDropInterval) {
        this.softDropTimer = 0;
        this.moveDown();
      }
    }

    // Render current tetromino (only if game is active)
    if (this.isGameActive) {
      this.tetrominoRenderer.renderTetromino(this.currentTetromino);
    }

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
    if (!this.currentTetromino || this.isCountdownActive || !this.isGameActive) return;

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
    if (!this.currentTetromino || this.isCountdownActive || !this.isGameActive) return;

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
    if (!this.currentTetromino || this.isCountdownActive || !this.isGameActive) return;

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
    if (!this.currentTetromino || this.isCountdownActive || !this.isGameActive) return;

    const rotatedTetromino = this.shapeManager.rotateTetromino(this.currentTetromino);
    if (this.gameBoard.canPlace(rotatedTetromino)) {
      this.currentTetromino = rotatedTetromino;
      this.updatePrediction();
    }
  }

  /**
   * Start soft drop (hold down button)
   */
  private startSoftDrop(): void {
    if (this.isCountdownActive || !this.isGameActive) return;
    this.isSoftDropping = true;
    this.softDropTimer = 0;
  }

  /**
   * Stop soft drop (release down button)
   */
  private stopSoftDrop(): void {
    this.isSoftDropping = false;
    this.softDropTimer = 0;
  }

  /**
   * Skip current block and spawn next one
   */
  private skipCurrentBlock(): void {
    if (!this.currentTetromino || this.isCountdownActive || !this.isGameActive) return;

    // Destroy current tetromino renderer
    this.tetrominoRenderer.destroy();

    // Spawn next tetromino without locking
    this.spawnNextTetromino();
  }

  /**
   * Switch current block shape to a random tetromino
   */
  private switchCurrentBlock(): void {
    if (!this.currentTetromino || this.isCountdownActive || !this.isGameActive) return;

    // Destroy current tetromino renderer
    this.tetrominoRenderer.destroy();

    // Save current position dan labels (jangan ganti labels!)
    const currentX = this.currentTetromino.x;
    const currentY = this.currentTetromino.y;
    const currentLabels = this.currentTetromino.labels;

    // Try to find a valid shape that can fit at current position
    const maxAttempts = 20; // Try up to 20 different random tetrominos
    let validShapeFound = false;

    for (let attempt = 0; attempt < maxAttempts && !validShapeFound; attempt++) {
      // Generate a random tetromino dengan random rotation (termasuk S dan Z untuk switch)
      const randomTetromino = this.shapeManager.generateRandomTetrominoForSwitch();

      // Gunakan rotation yang sudah di-random dari generateRandomTetrominoForSwitch()
      const testTetromino = {
        shape: randomTetromino.shape,
        x: currentX,
        y: currentY,
        rotation: randomTetromino.rotation,
        matrix: randomTetromino.matrix,
        labels: currentLabels // Gunakan label dari tetromino yang sedang aktif
      };

      // Check if this shape+rotation can be placed at current position
      if (this.gameBoard.canPlace(testTetromino)) {
        this.currentTetromino = testTetromino;
        validShapeFound = true;
        break;
      }
    }

    // If no valid shape found after all attempts, keep the current shape
    // (should rarely happen, but prevents crashes)
    if (!validShapeFound) {
      console.warn('Could not find valid shape for switch at current position');
      return;
    }

    // Update prediction untuk new tetromino shape
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

    // Play block SFX when tetromino locks
    this.playBlockSFX();

    // Destroy renderer container
    this.tetrominoRenderer.destroy();

    // Clear completed lines
    // const linesCleared = this.gameBoard.clearLines();

    // Spawn next tetromino (smart spawn will check if there's valid position)
    this.spawnNextTetromino();
  }

  /**
   * Game over
   */
  private gameOver(): void {
    this.isGameActive = false;

    // Capture screenshot of play area and send to parent iframe
    this.capturePlayAreaScreenshot();

    // Wait for parent to send restart message
    // No auto-restart
  }

  /**
   * Capture screenshot of play area and send to parent iframe
   */
  private capturePlayAreaScreenshot(): void {
    // Hide prediction shape before capturing screenshot
    this.tetrominoRenderer.destroyPrediction();

    // Stop all ongoing tweens to ensure shapes are in final state
    this.tweens.killAll();

    // Force all locked tiles to their final color state (no outline, no animation)
    const allImages = this.gameBoard.getLockedTiles().getAll() as Phaser.GameObjects.Image[];
    allImages.forEach(obj => {
      if (obj instanceof Phaser.GameObjects.Image) {
        // Check if it's a shape image (not text)
        const currentTexture = obj.texture.key;
        if (currentTexture.includes('_outline')) {
          // Change outline to color
          const colorKey = currentTexture.replace('_outline', '_color');
          obj.setTexture(colorKey);
        }
        // Reset scale to original (before animation)
        const originalScale = (obj as any).originalScale;
        if (originalScale !== undefined) {
          obj.setScale(originalScale);
        }
      }
    });

    // Wait a frame to ensure all changes are rendered
    this.time.delayedCall(500, () => {
      // Calculate play area bounds (original position without grid centering offset)
      // Use the original play area coordinates, not the grid coordinates
      const x = (this.cameras.main.width - GAME_CONSTANTS.PLAY_AREA_WIDTH) / 2;
      const y = (GAME_CONSTANTS.PLAY_AREA_TOP_MARGIN + (GAME_CONSTANTS.MAX_TETROMINO_HEIGHT * this.config.tileSize * GAME_CONSTANTS.PREVIEW_SCALE / 2));
      const width = GAME_CONSTANTS.PLAY_AREA_WIDTH;
      const height = GAME_CONSTANTS.PLAY_AREA_HEIGHT;

      // Resolution multiplier for higher quality (2x = double resolution)
      const resolutionMultiplier = 2;

      // Capture specific area of the game
      this.game.renderer.snapshot((image: HTMLImageElement | Phaser.Display.Color) => {
        if (image instanceof HTMLImageElement) {
          // Create high-resolution canvas to crop the play area
          const canvas = document.createElement('canvas');
          canvas.width = width * resolutionMultiplier;
          canvas.height = height * resolutionMultiplier;
          const ctx = canvas.getContext('2d', {
            alpha: false,
            desynchronized: false
          });

          if (ctx) {
            // Disable image smoothing for crisp, sharp pixels (no blur)
            ctx.imageSmoothingEnabled = false;

            // Draw only the play area portion with upscaling
            ctx.drawImage(
              image,
              x, y, width, height,  // Source rectangle (from full screenshot)
              0, 0, canvas.width, canvas.height    // Destination rectangle (upscaled)
            );

            // Convert to base64 data URL with maximum quality
            // Quality parameter (0.0 to 1.0) - 1.0 is maximum quality
            const screenshotDataUrl = canvas.toDataURL('image/png', 1.0);

            // Send screenshot to parent iframe via postMessage
            if (window.parent !== window) {
              window.parent.postMessage({
                type: 'PHASER_IMAGE',
                screenshot: screenshotDataUrl,
                timestamp: new Date().toISOString(),
                resolution: {
                  width: canvas.width,
                  height: canvas.height,
                  multiplier: resolutionMultiplier
                }
              }, '*');
            }

            // Also store in window object for direct access if needed
            (window as any).tetrisGameOverScreenshot = screenshotDataUrl;
          }
        }
      });
    });
  }

  /**
   * Play Block SFX when tetromino locks to board
   */
  private playBlockSFX(): void {
    // Play block SFX without loop (one-shot)
    this.sound.play('blockSfx', {
      volume: 0.7, // 70% volume untuk SFX lebih jelas
      loop: false, // One-shot sound
    });

    console.log('🔊 Block SFX played');
  }
}