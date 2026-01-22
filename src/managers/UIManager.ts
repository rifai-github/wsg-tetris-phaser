import Phaser from 'phaser';
import { GameConfig, GameplayConfig } from '../types';
import { GAME_CONSTANTS } from '../config/constants';

/**
 * UIManager - Mengelola UI elements (background, panel, profile, buttons, next shape preview)
 */
export class UIManager {
  private scene: Phaser.Scene;
  private config: GameConfig;
  private buttons: {
    skip?: Phaser.GameObjects.Image;
    switch?: Phaser.GameObjects.Image;
    left?: Phaser.GameObjects.Image;
    right?: Phaser.GameObjects.Image;
    down?: Phaser.GameObjects.Image;
    rotate?: Phaser.GameObjects.Image;
  } = {};
  private timerText?: Phaser.GameObjects.Text;
  private slider: {
    background?: Phaser.GameObjects.Image;
    progress?: Phaser.GameObjects.Image;
    handling?: Phaser.GameObjects.Image;
    percentageText?: Phaser.GameObjects.Text;
  } = {};

  constructor(scene: Phaser.Scene, config: GameConfig) {
    this.scene = scene;
    this.config = config;
  }

  /**
   * Setup semua UI elements
   */
  setupUI(gameplayConfig?: GameplayConfig | null, username?: string): void {
    this.createBackground();
    this.createHeaderSection(gameplayConfig, username);
    this.createPlayAreaPanel();
    this.createControlButtons(gameplayConfig);
  }

  /**
   * Create background (adjusted untuk portrait)
   */
  private createBackground(): void {

    const centerX = GAME_CONSTANTS.CANVAS_WIDTH / 2;
    const centerY = GAME_CONSTANTS.CANVAS_HEIGHT / 2;

    const bg = this.scene.add.image(centerX, centerY, 'background');
    // Scale background untuk fit portrait mode
    const scaleX = GAME_CONSTANTS.CANVAS_WIDTH / bg.width;
    const scaleY = GAME_CONSTANTS.CANVAS_HEIGHT / bg.height;
    const scale = Math.max(scaleX, scaleY);
    bg.setScale(scale);
  }

  /**
   * Create play area panel (353x397 px)
   */
  private createPlayAreaPanel(): void {
    const panelWidth = GAME_CONSTANTS.PLAY_AREA_WIDTH;
    const panelHeight = GAME_CONSTANTS.PLAY_AREA_HEIGHT;

    const windowWidth = GAME_CONSTANTS.CANVAS_WIDTH;
    const windowHeight = GAME_CONSTANTS.CANVAS_HEIGHT;

    const panel = this.scene.add.image(
      (windowWidth / 2),
      (GAME_CONSTANTS.PLAY_AREA_TOP_MARGIN + (GAME_CONSTANTS.MAX_TETROMINO_HEIGHT * this.config.tileSize * GAME_CONSTANTS.PREVIEW_SCALE / 2) + (panelHeight / 2)),
      'panel'
    );

    // Scale panel to fixed dimensions
    panel.setDisplaySize(panelWidth, panelHeight);
  }

  /**
   * Create header section with vertical layout (instruction → profile with timer)
   */
  private createHeaderSection(gameplayConfig?: GameplayConfig | null, username?: string): void {

    const centerX = GAME_CONSTANTS.CANVAS_WIDTH / 2;
    const spacing = GAME_CONSTANTS.HEADER_SPACING;

    // 1. Instruction at the top
    const instructionY = GAME_CONSTANTS.START_Y;
    this.createInstructionSection(centerX, instructionY + spacing, gameplayConfig);

    // 2. Profile at the bottom with timer (pivot from left)
    const profileY = (instructionY + 60 + (spacing * 6));
    this.createProfileSection(profileY, gameplayConfig, username);
  }

  /**
   * Update timer display (countdown)
   */
  updateTimer(remainingSeconds: number): void {
    if (this.timerText) {
      const minutes = Math.floor(remainingSeconds / 60);
      const seconds = remainingSeconds % 60;
      const timeString = `${minutes.toString().padStart(2, '0')}:${Math.ceil(seconds).toString().padStart(2, '0')}`;

      // Change color when time is running low
      if (remainingSeconds <= GAME_CONSTANTS.TIMER_WARNING_ORANGE && remainingSeconds > GAME_CONSTANTS.TIMER_WARNING_RED) {
        this.timerText.setColor(GAME_CONSTANTS.TIMER_COLOR_WARNING);
      } else if (remainingSeconds <= GAME_CONSTANTS.TIMER_WARNING_RED) {
        this.timerText.setColor(GAME_CONSTANTS.TIMER_COLOR_URGENT);
      } else {
        this.timerText.setColor(GAME_CONSTANTS.TIMER_COLOR_NORMAL);
      }

      this.timerText.setText(timeString);
    }
  }

  /**
   * Create profile section (pivot from left with margin distance)
   */
  private createProfileSection(y: number, gameplayConfig?: GameplayConfig | null, username?: string): void {
    const profileSize = GAME_CONSTANTS.PROFILE_SIZE;
    const leftMargin = (GAME_CONSTANTS.CANVAS_WIDTH / 2) - (GAME_CONSTANTS.PLAY_AREA_WIDTH / 2);

    // Profile image positioned from left
    const profile = this.scene.add.image(leftMargin + (profileSize / 2), y, 'profile');
    profile.setDisplaySize(profileSize, profileSize);
    profile.setOrigin(0.5, 0.5);

    const userName = username || 'John Doe';

    // Hitung max width untuk username agar tidak overlap dengan timer
    const timerX = (GAME_CONSTANTS.CANVAS_WIDTH / 2) + (GAME_CONSTANTS.PLAY_AREA_WIDTH / 2);
    const nameTextX = leftMargin + profileSize + GAME_CONSTANTS.PROFILE_NAME_SPACING;
    const maxNameWidth = timerX - nameTextX - (130 * GAME_CONSTANTS.SCALE_FACTOR); // 130px padding untuk timer bg

    // Coba 1 baris dulu
    let nameText = this.scene.add.text(
      nameTextX,
      y,
      userName,
      {
        fontFamily: GAME_CONSTANTS.FONT_FAMILY,
        fontSize: Math.floor(21 * GAME_CONSTANTS.SCALE_FACTOR) + 'px',
        color: '#FFFFFF',
        fontStyle: 'bold',
        align: 'left'
      }
    );
    nameText.setOrigin(0, 0.5);
    nameText.setResolution(2);

    // Jika 1 baris melebihi max width, coba 2 baris (balanced split)
    if (nameText.width > maxNameWidth) {
      nameText.destroy();

      const words = userName.split(' ');
      const midPoint = Math.ceil(words.length / 2);
      const line1 = words.slice(0, midPoint).join(' ');
      const line2 = words.slice(midPoint).join(' ');
      const displayName = `${line1}\n${line2}`;

      nameText = this.scene.add.text(
        nameTextX,
        y,
        displayName,
        {
          fontFamily: GAME_CONSTANTS.FONT_FAMILY,
          fontSize: Math.floor(21 * GAME_CONSTANTS.SCALE_FACTOR) + 'px',
          color: '#FFFFFF',
          fontStyle: 'bold',
          lineSpacing: -5,
          align: 'left'
        }
      );
      nameText.setOrigin(0, 0.5);
      nameText.setResolution(2);

      // Auto-size (scale down) jika 2 baris masih terlalu lebar
      if (nameText.width > maxNameWidth) {
        const scale = maxNameWidth / nameText.width;
        nameText.setScale(scale);
      }
    }

    // Create timer on the right side (where slider was)
    this.createTimer(y);
  }

  /**
   * Create timer (aligned to right side of profile section)
   */
  private createTimer(profileY: number): void {
    // Position timer at right edge, aligned with profile
    const timerX = (GAME_CONSTANTS.CANVAS_WIDTH / 2) + (GAME_CONSTANTS.PLAY_AREA_WIDTH / 2);
    const timerY = profileY;

    // Create timer background
    const timerBg = this.scene.add.image(timerX, timerY, 'timer_bg');
    timerBg.setOrigin(1, 0.5); // Right center origin to align with text
    timerBg.setScale(GAME_CONSTANTS.SCALE_FACTOR); // Apply scale factor

    // Create timer text
    this.timerText = this.scene.add.text(
      timerX - 17 * GAME_CONSTANTS.SCALE_FACTOR,
      timerY,
      '00:00  ',
      {
        fontFamily: GAME_CONSTANTS.FONT_FAMILY,
        fontSize: Math.floor(32 * GAME_CONSTANTS.SCALE_FACTOR) + 'px',
        color: GAME_CONSTANTS.TIMER_COLOR_NORMAL,
        fontStyle: '600',
        align: 'right'
      }
    );
    this.timerText.setOrigin(1, 0.5); // Right center origin
    this.timerText.setResolution(2);
  }


  /**
   * Create instruction text section below header
   */
  private createInstructionSection(x: number, y: number, gameplayConfig?: GameplayConfig | null): void {
    const centerX = x;
    const instructionY = y;

    // Text bagian putih
    const instructionText1 = this.scene.add.text(
      centerX,
      instructionY,
      'Arrange your skills and traits to find your fit',
      {
        fontFamily: GAME_CONSTANTS.FONT_FAMILY,
        fontSize: Math.floor(14 * GAME_CONSTANTS.SCALE_FACTOR) + 'px',
        color: '#FFFFFF',
        fontStyle: '600',
        align: 'center',
      }
    );
    instructionText1.setOrigin(0.5, 0);
    instructionText1.setResolution(2);

    // Text bagian warna dinamis (dari config)
    const instructionText2 = this.scene.add.text(
      centerX,
      (instructionY + instructionText1.height),
      gameplayConfig?.instruction_text || '',
      {
        fontFamily: GAME_CONSTANTS.FONT_FAMILY,
        fontSize: Math.floor(14 * GAME_CONSTANTS.SCALE_FACTOR) + 'px',
        color: gameplayConfig?.instruction_text_color || '#FFFFFF',
        fontStyle: '600',
        align: 'center',
      }
    );
    instructionText2.setOrigin(0.5, 0);
    instructionText2.setResolution(2);
  }

  /**
   * Create control buttons di bawah play area
   * Menggunakan horizontal layout group system (seperti Unity)
   */
  private createControlButtons(gameplayConfig?: GameplayConfig | null): void {
    const centerX = GAME_CONSTANTS.CANVAS_WIDTH / 2;
    const buttonSize = GAME_CONSTANTS.BUTTON_SIZE;
    const spacing = GAME_CONSTANTS.BUTTON_SPACING;
    const buttonY = GAME_CONSTANTS.PLAY_AREA_TOP_MARGIN + GAME_CONSTANTS.PLAY_AREA_HEIGHT + GAME_CONSTANTS.BUTTON_DISTANCE_FROM_PLAY_AREA + (buttonSize / 2) + buttonSize;

    // Definisi button order (kiri ke kanan)
    const buttonDefinitions = [
      { key: 'skip', texture: 'button_skip' },
      { key: 'switch', texture: 'button_switch' },
      { key: 'rotate', texture: 'button_rotate' },
      { key: 'left', texture: 'button_left' },
      { key: 'down', texture: 'button_down' },
      { key: 'right', texture: 'button_right' }
    ];

    // Filter button yang aktif berdasarkan special_tag dari gameplay config
    const activeButtons = buttonDefinitions.filter(def => {
      // Skip button untuk type dengan "skip" tag
      if (def.key === 'skip') {
        return gameplayConfig?.special_tag.includes('skip');
      }
      // Switch button untuk type dengan "switch" tag
      if (def.key === 'switch') {
        return gameplayConfig?.special_tag.includes('switch');
      }
      // Rotate button untuk type dengan "rotate" tag
      if (def.key === 'rotate') {
        return gameplayConfig?.special_tag.includes('rotate');
      }
      // Prediction untuk type dengan "prediction" tag (ini handle di scene level)
      return true;
    });

    // Hitung total width untuk centering
    const totalWidth = (activeButtons.length * buttonSize) + ((activeButtons.length - 1) * spacing);
    const startX = centerX - (totalWidth / 2) + (buttonSize / 2);

    // Create buttons dengan horizontal layout
    activeButtons.forEach((def, index) => {
      const buttonX = startX + (index * (buttonSize + spacing));
      const button = this.scene.add.image(buttonX, buttonY, def.texture);
      button.setDisplaySize(buttonSize, buttonSize);
      button.setInteractive({ useHandCursor: true });

      // @ts-ignore - dynamic property assignment
      this.buttons[def.key] = button;
    });
  }

  /**
   * Setup button callbacks
   */
  setupButtonCallbacks(callbacks: {
    onSkip: () => void;
    onSwitch: () => void;
    onLeft: () => void;
    onRight: () => void;
    onDown: () => void;
    onRotate: () => void;
    onDownPress?: () => void;
    onDownRelease?: () => void;
  }): void {
    if (this.buttons.skip) {
      this.buttons.skip.on('pointerdown', () => {
        // @ts-ignore
        this.buttons.skip!.setTint(0xcccccc);
        callbacks.onSkip();
      });
      this.buttons.skip.on('pointerup', () => {
        // @ts-ignore
        this.buttons.skip!.clearTint();
      });
      this.buttons.skip.on('pointerout', () => {
        // @ts-ignore
        this.buttons.skip!.clearTint();
      });
    }

    if (this.buttons.switch) {
      this.buttons.switch.on('pointerdown', () => {
        // @ts-ignore
        this.buttons.switch!.setTint(0xcccccc);
        callbacks.onSwitch();
      });
      this.buttons.switch.on('pointerup', () => {
        // @ts-ignore
        this.buttons.switch!.clearTint();
      });
      this.buttons.switch.on('pointerout', () => {
        // @ts-ignore
        this.buttons.switch!.clearTint();
      });
    }

    if (this.buttons.left) {
      this.buttons.left.on('pointerdown', () => {
        this.buttons.left!.setTint(0xcccccc);
        callbacks.onLeft();
      });
      this.buttons.left.on('pointerup', () => {
        this.buttons.left!.clearTint();
      });
      this.buttons.left.on('pointerout', () => {
        this.buttons.left!.clearTint();
      });
    }

    if (this.buttons.right) {
      this.buttons.right.on('pointerdown', () => {
        this.buttons.right!.setTint(0xcccccc);
        callbacks.onRight();
      });
      this.buttons.right.on('pointerup', () => {
        this.buttons.right!.clearTint();
      });
      this.buttons.right.on('pointerout', () => {
        this.buttons.right!.clearTint();
      });
    }

    if (this.buttons.down) {
      this.buttons.down.on('pointerdown', () => {
        this.buttons.down!.setTint(0xcccccc);
        callbacks.onDown();
        if (callbacks.onDownPress) {
          callbacks.onDownPress();
        }
      });
      this.buttons.down.on('pointerup', () => {
        this.buttons.down!.clearTint();
        if (callbacks.onDownRelease) {
          callbacks.onDownRelease();
        }
      });
      this.buttons.down.on('pointerout', () => {
        this.buttons.down!.clearTint();
        if (callbacks.onDownRelease) {
          callbacks.onDownRelease();
        }
      });
    }

    if (this.buttons.rotate) {
      this.buttons.rotate.on('pointerdown', () => {
        this.buttons.rotate!.setTint(0xcccccc);
        callbacks.onRotate();
      });
      this.buttons.rotate.on('pointerup', () => {
        this.buttons.rotate!.clearTint();
      });
      this.buttons.rotate.on('pointerout', () => {
        this.buttons.rotate!.clearTint();
      });
    }
  }

  /**
   * Get buttons (untuk akses dari luar jika diperlukan)
   */
  getButtons() {
    return this.buttons;
  }
}
