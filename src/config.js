import Phaser from 'phaser'
import lang from './lang'

const DEFAULT_WIDTH = 640;
const DEFAULT_HEIGHT = 1136;
const MAX_WIDTH = 960;
const MAX_HEIGHT = 1400;

export default {
  type: Phaser.AUTO,
  parent: 'content',
  scale: {
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    mode: Phaser.Scale.NONE,
    parent: 'content',
  },
  webfonts: ['Press Start 2P'],
  gameOptions: {
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    maxWidth: MAX_WIDTH,
    maxHeight: MAX_HEIGHT,
    tileSize: 32,
    vikingSize: 48,
    hiccupDelay: 3500,
    hiccupTextDuration: 1000,
    moveDuration: 130,
    hiccupSounds: ['hrrng', 'hiccup', 'groan'],
    actionSounds: [
      'beep.wav', 'birds.mp3', 'break.wav', 'bump.wav', 'water-step.wav',
      'glass.wav', 'smash.wav', 'step.wav', 'vomit.wav', 'drink.wav', 'pickup.wav',
    ],
    finishSounds: ['fanfare.mp3', 'tada.mp3'],
  },
  lang: lang.en,
  tutorialFinished: false,
  levelGroups: [
    ['0', '1', '2', '3', '4'],
  ],
  gameStat: {
    started: new Date(),
    currentGroup: 0,
    currentLevel: 0,
    score: 0,
  },
  music: null,
  musicMuted: false,
  soundsMuted: false,
  musicParams: {
    mute: false,
    volume: .5,
    rate: 1,
    detune: 0,
    seek: 0,
    loop: true,
    delay: 500
  },
  soundParams: {
    volume: .5,
  },
  soundsMap: [
    {sound: 'smash', items: [431, 658, 659, 661, 662, 663, ]},
    {sound: 'glass', items: [391, 492, 632, ]},
    {sound: 'drink', items: [557, 589, ]},
    {sound: 'pickup', items: [500, ]},
    {sound: 'vomit', items: [621, ]},
  ],
  localStorageName: 'olaf_the_boozer_0'
}
