import { WEBGL, Game } from 'phaser';
import { TetrisScene } from '../scenes/TetrisScene';
import { GAME_CONSTANTS } from '../config/constants';

/**
 * Tunggu font Nunito selesai loading sebelum memulai game
 * Ini mencegah race condition dimana text dirender SEBELUM font siap
 */
function waitForFontLoad(): Promise<void> {
    return new Promise((resolve) => {
        // Cek apakah document.fonts tersedia (modern browsers)
        if ('fonts' in document) {
            document.fonts.load('400 16px Nunito').then(() => {
                console.log('✅ Font Nunito 400 loaded');
                return document.fonts.load('700 16px Nunito');
            }).then(() => {
                console.log('✅ Font Nunito 700 loaded');
                resolve();
            }).catch(() => {
                console.warn('⚠️ Font loading timeout, using fallback');
                resolve();
            });
        } else {
            // Fallback untuk browser lama
            setTimeout(() => {
                console.log('✅ Font fallback timeout completed');
                resolve();
            }, 1000);
        }
    });
}

const pixelRatio = Math.min(window.devicePixelRatio || 1, 3);
const config = {
    type: WEBGL,
    parent: 'game-container',

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
        roundPixels: false, // Disable untuk smooth rendering (tidak pixelated)
        powerPreference: 'high-performance',
        desynchronized: false
    },
    resolution: pixelRatio,
};

const StartGame = async (parent: string) => {
    // Tunggu font loading SEBELUM initialize Phaser
    await waitForFontLoad();

    return new Game({ ...config, parent });
}

export default StartGame;