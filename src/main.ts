import Phaser from 'phaser';
import { TetrisScene } from './scenes/TetrisScene';
import { GAME_CONSTANTS } from './config/constants';

// Get device pixel ratio for high-DPI support (cap at 3 for performance)
const pixelRatio = Math.min(window.devicePixelRatio || 1, 3);

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,
  // Multiply by pixelRatio for true high-DPI rendering
  width: GAME_CONSTANTS.CANVAS_WIDTH * pixelRatio,
  height: GAME_CONSTANTS.CANVAS_HEIGHT * pixelRatio,
  backgroundColor: GAME_CONSTANTS.BACKGROUND_COLOR,
  parent: 'game-container',
  scene: [TetrisScene],

  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    zoom: 1 / pixelRatio, // Scale down to fit viewport
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
      // Set canvas CSS size to viewport size
      game.canvas.style.width = `${window.innerWidth}px`;
      game.canvas.style.height = `${window.innerHeight}px`;

      // Log configuration for debugging
      console.log('High-DPI Config:', {
        devicePixelRatio: window.devicePixelRatio,
        appliedPixelRatio: pixelRatio,
        canvasBufferSize: {
          width: game.canvas.width,
          height: game.canvas.height
        },
        cssSize: {
          width: game.canvas.style.width,
          height: game.canvas.style.height
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      });
    }
  }
};

const game = new Phaser.Game(config);

// Force texture quality for all loaded textures
game.events.once('ready', () => {
  const textures = game.textures;
  textures.on('addtexture', (_key: string, texture: Phaser.Textures.Texture) => {
    texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
  });
});
