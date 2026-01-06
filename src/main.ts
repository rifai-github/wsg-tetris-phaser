import Phaser from 'phaser';
import { TetrisScene } from './scenes/TetrisScene';
import { GAME_CONSTANTS } from './config/constants';

// Get device pixel ratio for high-DPI support
const pixelRatio = window.devicePixelRatio || 1;

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  width: GAME_CONSTANTS.CANVAS_WIDTH * pixelRatio,
  height: GAME_CONSTANTS.CANVAS_HEIGHT * pixelRatio,
  backgroundColor: GAME_CONSTANTS.BACKGROUND_COLOR,
  parent: 'game-container',
  scene: [TetrisScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    zoom: 1 / pixelRatio // Scale down to fit screen
  },
  render: {
    antialias: true,
    antialiasGL: true,
    pixelArt: false,
    roundPixels: false,
    powerPreference: 'high-performance',
    mipmapFilter: 'LINEAR_MIPMAP_LINEAR'
  },
  callbacks: {
    postBoot: (game: Phaser.Game) => {
      // Set canvas CSS size to logical pixels for sharp rendering
      game.canvas.style.width = `${GAME_CONSTANTS.CANVAS_WIDTH}px`;
      game.canvas.style.height = `${GAME_CONSTANTS.CANVAS_HEIGHT}px`;
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