import { WEBGL, Game } from 'phaser';
import { TetrisScene } from '../scenes/TetrisScene';
import { GAME_CONSTANTS } from '../config/constants';

const config = {
    type: WEBGL,
    parent: 'game-container',

    //   width: 430*2,
    //   height: 1280,
    width: GAME_CONSTANTS.CANVAS_WIDTH,
    height: GAME_CONSTANTS.CANVAS_HEIGHT,

    backgroundColor: GAME_CONSTANTS.BACKGROUND_COLOR,
    scene: [TetrisScene],

    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },

    render: {
        antialias: true,
        antialiasGL: true,
        pixelArt: false,
        roundPixels: true,
        powerPreference: 'high-performance',
        desynchronized: false
    },
};


new Phaser.Game(config,);

const StartGame = (parent: string) => {

    return new Game({ ...config, parent });

}

export default StartGame;