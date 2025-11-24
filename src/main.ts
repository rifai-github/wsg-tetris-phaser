import Phaser from 'phaser';
import { TetrisScene } from './scenes/TetrisScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 360,
  height: 720,
  backgroundColor: '#2a2a3e',
  scene: [TetrisScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: true,
    pixelArt: false
  }
};

new Phaser.Game(config);