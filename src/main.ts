import Phaser from 'phaser';
import { TetrisScene } from './scenes/TetrisScene';
import { GAME_CONSTANTS } from './config/constants';

// Get device pixel ratio for high-DPI support (cap at 3 for performance)
const pixelRatio = Math.min(window.devicePixelRatio || 1, 3);

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  width: GAME_CONSTANTS.DESIGN_WIDTH * pixelRatio,
  height: GAME_CONSTANTS.DESIGN_HEIGHT * pixelRatio,
  backgroundColor: GAME_CONSTANTS.BACKGROUND_COLOR,
  parent: 'game-container',
  scene: [TetrisScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_CONSTANTS.DESIGN_WIDTH,
    height: GAME_CONSTANTS.DESIGN_HEIGHT,
  },
  render: {
    antialias: false, // False for crisp pixels
    antialiasGL: false,
    pixelArt: false,
    roundPixels: false,
    powerPreference: 'high-performance',
    mipmapFilter: 'LINEAR_MIPMAP_LINEAR'
  },
  callbacks: {
    postBoot: (game: Phaser.Game) => {
      // Set canvas to use physical pixels for sharp rendering
      const canvas = game.canvas;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.imageRendering = 'auto';
    }
  }
};

const game = new Phaser.Game(config);

// Force texture quality for all loaded textures
game.events.once('ready', () => {
  const textures = game.textures;
  textures.on('addtexture', (_key: string, texture: Phaser.Textures.Texture) => {
    // Set LINEAR filter mode for smooth scaling on high-DPI
    texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
  });
});