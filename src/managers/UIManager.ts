import Phaser from 'phaser';
import { GameConfig, GameplayConfig } from '../types';
import { GAME_CONSTANTS, ASSET_PATHS, SLIDER_CONFIG } from '../config/constants';

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
  setupUI(gameplayConfig?: GameplayConfig | null): void {
    this.createBackground();
    this.createPlayAreaPanel();
    this.createHeaderSection(gameplayConfig);
    this.createControlButtons(gameplayConfig);
  }

  /**
   * Create background (adjusted untuk portrait)
   */
  private createBackground(): void {
    const bg = this.scene.add.image(GAME_CONSTANTS.BACKGROUND_CENTER_X, GAME_CONSTANTS.BACKGROUND_CENTER_Y, 'background');
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

    const panel = this.scene.add.image(
      this.config.boardX + panelWidth / 2,
      this.config.boardY + panelHeight / 2,
      'panel'
    );

    // Scale panel to fixed dimensions
    panel.setDisplaySize(panelWidth, panelHeight);
  }

  /**
   * Create header section with vertical layout (timer → instruction → profile)
   */
  private createHeaderSection(gameplayConfig?: GameplayConfig | null): void {
    const centerX = GAME_CONSTANTS.SCREEN_CENTER_X;
    const spacing = GAME_CONSTANTS.HEADER_SPACING;
    const timerHeight = GAME_CONSTANTS.TIMER_HEIGHT;

    // 1. Timer at the top (attached to screen)
    this.createTimer(centerX);

    // 2. Instruction below timer
    const instructionY = timerHeight;
    this.createInstructionSection(centerX, instructionY + spacing, gameplayConfig);

    // 3. Profile at the bottom (pivot from left)
    const profileY = instructionY + this.getInstructionHeight(gameplayConfig) + (spacing * 6);
    this.createProfileSection(profileY, gameplayConfig);
  }

  /**
   * Get actual height for instruction section
   */
  private getInstructionHeight(gameplayConfig?: GameplayConfig | null): number {
    // Create temporary text objects to measure actual height
    const tempText1 = this.scene.add.text(0, 0,
      'Arrange your skill and recommendation programme\nto complete your personalised career direction.', {
        fontFamily: GAME_CONSTANTS.FONT_FAMILY,
        fontSize: '14px',
        fontStyle: '600',
        align: 'center',
        lineSpacing: 2,
        wordWrap: { width: GAME_CONSTANTS.INSTRUCTION_WORD_WRAP_WIDTH }
      });
    tempText1.setOrigin(0.5, 0);
    tempText1.setResolution(2);

    const tempText2 = this.scene.add.text(0, 0,
      gameplayConfig?.instruction_text || '', {
        fontFamily: GAME_CONSTANTS.FONT_FAMILY,
        fontSize: '14px',
        fontStyle: '600',
        align: 'center',
        wordWrap: { width: GAME_CONSTANTS.INSTRUCTION_WORD_WRAP_WIDTH }
      });
    tempText2.setOrigin(0.5, 0);
    tempText2.setResolution(2);

    // Calculate total height
    const text1Height = tempText1.height;
    const text2Height = tempText2.height;
    const spacing = GAME_CONSTANTS.INSTRUCTION_LINE_SPACING;
    const totalHeight = text1Height + spacing + text2Height;

    // Clean up temporary objects
    tempText1.destroy();
    tempText2.destroy();

    return totalHeight;
  }

  /**
   * Create timer display - full width attached to top
   */
  private createTimer(x: number): void {
    // Create full-width timer background attached to top
    const timerBg = this.scene.add.rectangle(
      GAME_CONSTANTS.SCREEN_CENTER_X,
      GAME_CONSTANTS.TIMER_Y,
      GAME_CONSTANTS.CANVAS_WIDTH,
      GAME_CONSTANTS.TIMER_BACKGROUND_HEIGHT,
      0xFFFFFF, 0.1
    );
    timerBg.setOrigin(0.5, 0.5);

    // Create timer text
    this.timerText = this.scene.add.text(
      x,
      GAME_CONSTANTS.TIMER_Y + 2, // Slightly offset from background center
      '00:00',
      {
        fontFamily: GAME_CONSTANTS.FONT_FAMILY,
        fontSize: '14px',
        color: GAME_CONSTANTS.TIMER_COLOR_NORMAL,
        fontStyle: '600',
        align: 'center'
      }
    );
    this.timerText.setOrigin(0.5, 0.5);
    this.timerText.setResolution(2);
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
  private createProfileSection(y: number, gameplayConfig?: GameplayConfig | null): void {
    const profileSize = GAME_CONSTANTS.PROFILE_SIZE;
    const leftMargin = GAME_CONSTANTS.PROFILE_LEFT_MARGIN;

    // Profile image positioned from left
    const profile = this.scene.add.image(leftMargin + (profileSize / 2), y, 'profile');
    profile.setDisplaySize(profileSize, profileSize);
    profile.setOrigin(0.5, 0.5);

    // Username to the right of profile
    const nameText = this.scene.add.text(
      leftMargin + profileSize + GAME_CONSTANTS.PROFILE_NAME_SPACING,
      y,
      'John\nDoe',
      {
        fontFamily: GAME_CONSTANTS.FONT_FAMILY,
        fontSize: '16px',
        color: '#FFFFFF',
        fontStyle: 'bold',
        lineSpacing: -5,
        align: 'left'
      }
    );
    nameText.setOrigin(0, 0.5); // Pivot from left center
    nameText.setResolution(2);

    // Create progress slider on the right side
    this.createProgressSlider(y);
  }

  /**
   * Create progress slider (aligned to bottom of profile section)
   */
  private createProgressSlider(profileY: number): void {
    const sliderWidth = SLIDER_CONFIG.BACKGROUND_WIDTH;
    const sliderHeight = SLIDER_CONFIG.BACKGROUND_HEIGHT;
    const handleSize = SLIDER_CONFIG.HANDLE_SIZE;

    // Position slider at bottom of profile, aligned to right edge
    const sliderX = GAME_CONSTANTS.SCREEN_CENTER_X + (GAME_CONSTANTS.CANVAS_WIDTH / 2) - sliderWidth - 20; // 20px from right edge
    const sliderY = profileY + (GAME_CONSTANTS.PROFILE_SIZE / 3); // Same as profile bottom (center)

    // Background slider bar
    this.slider.background = this.scene.add.image(sliderX, sliderY, 'slider_background');
    this.slider.background.setDisplaySize(sliderWidth, sliderHeight);
    this.slider.background.setOrigin(0, 0.5); // Left center origin

    // Progress fill - use progress.png image with rounded mask
    this.slider.progress = this.scene.add.image(sliderX, sliderY, 'slider_progress');
    this.slider.progress.setDisplaySize(sliderWidth, sliderHeight); // Full width
    this.slider.progress.setOrigin(0, 0.5); // Left center origin

    // Create mask for rounded progress
    const progressMask = this.scene.make.graphics({ x: 0, y: 0 });
    progressMask.fillStyle(0xffffff);
    progressMask.fillRoundedRect(sliderX, sliderY - (sliderHeight / 2), sliderWidth, sliderHeight, sliderHeight / 2);
    this.slider.progress.setMask(progressMask.createGeometryMask());

    // Handling (thumb) - positioned at the end of progress
    this.slider.handling = this.scene.add.image(sliderX, sliderY, 'slider_handling');
    this.slider.handling.setDisplaySize(handleSize, handleSize);
    this.slider.handling.setOrigin(0.5, 0.5); // Center origin

    // Progress text above slider - right aligned
    this.slider.percentageText = this.scene.add.text(
      sliderX + sliderWidth, // Right edge of slider
      sliderY - 25, // 25px above slider
      'Progress 0/4',
      {
        fontFamily: GAME_CONSTANTS.FONT_FAMILY,
        fontSize: SLIDER_CONFIG.PERCENTAGE_FONT_SIZE,
        color: SLIDER_CONFIG.PERCENTAGE_COLOR,
        fontStyle: '600',
        align: 'right'
      }
    );
    this.slider.percentageText.setOrigin(1, 0.5); // Right center origin for right alignment
    this.slider.percentageText.setResolution(2);
  }

  /**
   * Update slider based on timer progress (0 = full, 1 = empty)
   */
  updateSlider(remainingSeconds: number, totalSeconds: number): void {
    if (!this.slider.progress || !this.slider.handling || !this.slider.percentageText) return;

    // Calculate progress (0 when timer at max, 1 when timer at 0)
    const progress = 1 - (remainingSeconds / totalSeconds);

    // Update progress mask width to show rounded progress
    const fillWidth = SLIDER_CONFIG.BACKGROUND_WIDTH * progress;

    // Update the mask to create rounded progress effect
    const currentMask = this.slider.progress!.mask;
    if (currentMask) {
      const maskGraphics = this.scene.make.graphics({ x: 0, y: 0 });
      maskGraphics.fillStyle(0xffffff);
      maskGraphics.fillRoundedRect(
        this.slider.background!.x,
        this.slider.background!.y - (SLIDER_CONFIG.BACKGROUND_HEIGHT / 2),
        fillWidth,
        SLIDER_CONFIG.BACKGROUND_HEIGHT,
        SLIDER_CONFIG.BACKGROUND_HEIGHT / 2
      );
      this.slider.progress!.setMask(maskGraphics.createGeometryMask());
    }

    // Update handling position
    if (this.slider.background) {
      const handleX = this.slider.background.x + fillWidth;
      this.slider.handling!.x = handleX;
    }

    // Update progress text with quarters format
    const percentage = Math.round(progress * 100);
    const quarters = Math.round(progress * 4); // 0-4 quarters
    this.slider.percentageText.setText(`Progress ${quarters}/4`);
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
      'Arrange your skill and recommendation programme\nto complete your personalised career direction.',
      {
        fontFamily: GAME_CONSTANTS.FONT_FAMILY,
        fontSize: '14px',
        color: '#FFFFFF',
        fontStyle: '600',
        align: 'center',
        lineSpacing: 4,
        wordWrap: { width: GAME_CONSTANTS.INSTRUCTION_WORD_WRAP_WIDTH },
        shadow: {
          offsetX: 1,
          offsetY: 1,
          color: '#000000',
          blur: 2,
          stroke: true,
          fill: true
        },
        padding: { x: 4, y: 2 }
      }
    );
    instructionText1.setOrigin(0.5, 0);
    instructionText1.setResolution(2); // Higher resolution for sharper text

    // Text bagian warna dinamis (dari config)
    const instructionText2 = this.scene.add.text(
      centerX,
      instructionY + instructionText1.height + GAME_CONSTANTS.INSTRUCTION_LINE_SPACING,
      gameplayConfig?.instruction_text || '',
      {
        fontFamily: GAME_CONSTANTS.FONT_FAMILY,
        fontSize: '14px',
        color: gameplayConfig?.instruction_text_color || '#FFFFFF',
        fontStyle: '600',
        align: 'center',
        lineSpacing: 4,
        wordWrap: { width: GAME_CONSTANTS.INSTRUCTION_WORD_WRAP_WIDTH },
        shadow: {
          offsetX: 1,
          offsetY: 1,
          color: '#000000',
          blur: 2,
          stroke: true,
          fill: true
        },
        padding: { x: 4, y: 2 }
      }
    );
    instructionText2.setOrigin(0.5, 0);
    instructionText2.setResolution(2); // Higher resolution for sharper text
  }

  /**
   * Create control buttons di bawah play area
   * Menggunakan horizontal layout group system (seperti Unity)
   */
  private createControlButtons(gameplayConfig?: GameplayConfig | null): void {
    const centerX = GAME_CONSTANTS.SCREEN_CENTER_X;
    const playAreaBottom = this.config.boardY + GAME_CONSTANTS.PLAY_AREA_HEIGHT;
    const buttonSize = GAME_CONSTANTS.BUTTON_SIZE;
    const spacing = GAME_CONSTANTS.BUTTON_SPACING;
    const buttonY = playAreaBottom + GAME_CONSTANTS.BUTTON_DISTANCE_FROM_PLAY_AREA + (buttonSize / 2);

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
      });
      this.buttons.down.on('pointerup', () => {
        this.buttons.down!.clearTint();
      });
      this.buttons.down.on('pointerout', () => {
        this.buttons.down!.clearTint();
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
