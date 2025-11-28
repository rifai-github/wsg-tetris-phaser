import Phaser from 'phaser';
import { GameConfig } from '../types';

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

  constructor(scene: Phaser.Scene, config: GameConfig) {
    this.scene = scene;
    this.config = config;
  }

  /**
   * Setup semua UI elements
   */
  setupUI(): void {
    this.createBackground();
    this.createPlayAreaPanel();
    this.createProfileSection();
    this.createControlButtons();
  }

  /**
   * Create background (adjusted untuk portrait)
   */
  private createBackground(): void {
    const bg = this.scene.add.image(180, 360, 'background');
    // Scale background untuk fit portrait mode
    const scaleX = 360 / bg.width;
    const scaleY = 720 / bg.height;
    const scale = Math.max(scaleX, scaleY);
    bg.setScale(scale);
  }

  /**
   * Create play area panel (8x9 tiles = 320x360 px)
   */
  private createPlayAreaPanel(): void {
    const panelWidth = this.config.gridWidth * this.config.tileSize;
    const panelHeight = this.config.gridHeight * this.config.tileSize;

    const panel = this.scene.add.image(
      this.config.boardX + panelWidth / 2,
      this.config.boardY + panelHeight / 2,
      'panel'
    );
    
    // Scale panel sesuai ukuran play area
    panel.setDisplaySize(panelWidth, panelHeight);
  }

  /**
   * Create profile section (di atas play area)
   */
  private createProfileSection(): void {
    // Profile placeholder di pojok kiri atas
    const profileX = 20;
    const profileY = 90;
    const profileSize = 40;

    const profile = this.scene.add.image(profileX, profileY, 'profile');
    profile.setDisplaySize(profileSize, profileSize);
    profile.setOrigin(0);

    // Username di sebelah kanan profile
    const nameText = this.scene.add.text(
      profileX + profileSize + 10,
      profileY ,
      'John\nDoe',
      {
        fontFamily: 'Nunito',
        fontSize: '18px',
        color: '#FFFFFF',
        fontStyle: 'bold',
        lineSpacing: -5
      }
    );
    nameText.setOrigin(0, 0);

    // Instruction text di atas semua (centered)
    const centerX = 180;
    const instructionY = 20;

    // Text bagian putih
    const instructionText1 = this.scene.add.text(
      centerX,
      instructionY,
      'Arrange your skill and recommendation programme\nto complete your personalised career direction.',
      {
        fontFamily: 'Nunito',
        fontSize: '11px',
        color: '#FFFFFF',
        fontStyle: '600',
        align: 'center',
        lineSpacing: 2,
        wordWrap: { width: 340 }
      }
    );
    instructionText1.setOrigin(0.5, 0);

    // Text bagian ungu (Combine glowing block...)
    const instructionText2 = this.scene.add.text(
      centerX,
      instructionY + instructionText1.height + 8,
      'Combine glowing block to make connection!',
      {
        fontFamily: 'Nunito',
        fontSize: '11px',
        color: '#D14BFF',
        fontStyle: '600',
        align: 'center',
        wordWrap: { width: 340 }
      }
    );
    instructionText2.setOrigin(0.5, 0);
  }

  /**
   * Create control buttons di bawah play area
   * Menggunakan horizontal layout group system (seperti Unity)
   */
  private createControlButtons(): void {
    const playAreaBottom = this.config.boardY + (this.config.gridHeight * this.config.tileSize);
    const centerX = 180;
    const buttonY = playAreaBottom + 60;
    const buttonSize = 70;
    const spacing = 15;

    // Get query params
    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get('type');

    // Definisi button order (kiri ke kanan)
    const buttonDefinitions = [
      { key: 'skip', texture: 'button_skip' },
      { key: 'switch', texture: 'button_switch' },
      { key: 'rotate', texture: 'button_rotate' },
      { key: 'left', texture: 'button_left' },
      { key: 'down', texture: 'button_down' },
      { key: 'right', texture: 'button_right' }
    ];

    // Filter button yang aktif berdasarkan query param
    const activeButtons = buttonDefinitions.filter(def => {
      // Hide skip button by default, show only if ?type=skip
      if (def.key === 'skip') {
        return typeParam === 'skip';
      }
      // Hide switch button by default, show only if ?type=switch
      if (def.key === 'switch') {
        return typeParam === 'switch';
      }
      // Hide rotate button by default, show only if ?type=rotate
      if (def.key === 'rotate') {
        return typeParam === 'rotate';
      }
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
