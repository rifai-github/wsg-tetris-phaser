import Phaser from 'phaser';
import { TetrisScene } from './scenes/TetrisScene';
import { GAME_CONSTANTS } from './config/constants';

// Get device pixel ratio for high-DPI support
const pixelRatio = Math.min(window.devicePixelRatio || 1, 3); // Cap at 3x for performance

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL, // Force WebGL for better performance
  width: GAME_CONSTANTS.DESIGN_WIDTH * pixelRatio, // Multiply by pixel ratio for hires
  height: GAME_CONSTANTS.DESIGN_HEIGHT * pixelRatio, // Multiply by pixel ratio for hires
  backgroundColor: GAME_CONSTANTS.BACKGROUND_COLOR,
  parent: 'game-container',
  scene: [TetrisScene],
  scale: {
    mode: Phaser.Scale.FIT, // Use FIT mode to maintain aspect ratio
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_CONSTANTS.DESIGN_WIDTH, // Logical width
    height: GAME_CONSTANTS.DESIGN_HEIGHT, // Logical height
    zoom: pixelRatio // Set zoom to pixel ratio for hires rendering
  },
  render: {
    antialias: true,
    antialiasGL: true,
    pixelArt: false, // Use smooth scaling for hires
    roundPixels: false,
    powerPreference: 'high-performance',
    mipmapFilter: 'LINEAR_MIPMAP_LINEAR'
  },
  callbacks: {
    postBoot: (game: Phaser.Game) => {
      // Set canvas resolution for high-DPI after boot
      game.scale.setZoom(pixelRatio);
      game.canvas.style.width = `${GAME_CONSTANTS.DESIGN_WIDTH}px`;
      game.canvas.style.height = `${GAME_CONSTANTS.DESIGN_HEIGHT}px`;
    }
  }
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