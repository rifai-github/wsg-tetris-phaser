import Phaser from 'phaser';
import { TetrisScene } from './scenes/TetrisScene';
import { GAME_CONSTANTS } from './config/constants';

// Get device pixel ratio for high-DPI support
const pixelRatio = Math.min(window.devicePixelRatio || 1, 3); // Cap at 3x for performance

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL, // Force WebGL for better performance
  width: GAME_CONSTANTS.CANVAS_WIDTH,
  height: GAME_CONSTANTS.CANVAS_HEIGHT,
  backgroundColor: GAME_CONSTANTS.BACKGROUND_COLOR,
  parent: 'game-container',
  scene: [TetrisScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: true,
    antialiasGL: true,
    pixelArt: false,
    roundPixels: false,
    powerPreference: 'high-performance',
    mipmapFilter: 'LINEAR_MIPMAP_LINEAR'
  },
  // Handle high-DPI screens (iPhone, Samsung high-end)
  resolution: pixelRatio
};

const game = new Phaser.Game(config);

// Force texture quality for all loaded textures
game.events.once('ready', () => {
  const textures = game.textures;
  textures.on('addtexture', (key: string, texture: Phaser.Textures.Texture) => {
    // Set LINEAR filter mode for smooth scaling on high-DPI
    texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
  });
});