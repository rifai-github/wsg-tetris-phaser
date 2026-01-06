import Phaser from 'phaser';
import { TetrisScene } from './scenes/TetrisScene';
import { GAME_CONSTANTS } from './config/constants';

// Get device pixel ratio for high-DPI support (cap at 3 for performance)
const pixelRatio = Math.min(window.devicePixelRatio || 1, 3);

const config = {
  type: Phaser.WEBGL,
  width: GAME_CONSTANTS.CANVAS_WIDTH,
  height: GAME_CONSTANTS.CANVAS_HEIGHT,
  parent: 'game-container',
  backgroundColor: GAME_CONSTANTS.BACKGROUND_COLOR,
  scene: [TetrisScene],

  scale: {
    mode: Phaser.Scale.MAX_ZOOM,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },

  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: true,
    powerPreference: 'high-performance',
    desynchronized: false
  },

  // High-DPI resolution
  resolution: pixelRatio,

  // Force WebGL 2 context for better text rendering
  context: undefined as any // Let Phaser auto-detect, will prefer WebGL 2
} as any;


const game = new Phaser.Game(config);

// Force texture quality for all loaded textures
game.events.once('ready', () => {
  const textures = game.textures;
  textures.on('addtexture', (_key: string, texture: Phaser.Textures.Texture) => {
    texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
  });
});
