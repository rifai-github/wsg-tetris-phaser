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
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },

  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: false
  },

  // 👇 ini kunci tajam (lewati typings)
  resolution: pixelRatio
} as Phaser.Types.Core.GameConfig as any;


const game = new Phaser.Game(config);

// Force texture quality for all loaded textures
game.events.once('ready', () => {
  const textures = game.textures;
  textures.on('addtexture', (_key: string, texture: Phaser.Textures.Texture) => {
    texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
  });
});
