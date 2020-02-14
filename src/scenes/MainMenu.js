import Phaser from 'phaser'
import config from '../config';
import Button from '../components/button'
import {getCurrentLevel, resetGameStat, showMap} from '../utils'

export default class extends Phaser.Scene {
  startButton;
  moveDistance;
  backgroundMask;

  viking;

  constructor() {
    super({key: 'MainMenuScene'});
  }

  init() {
  }

  preload() {
  }

  create() {
    const level = getCurrentLevel();
    showMap(this, 'level' + level, true, false);

    const worldView = this.cameras.main.worldView;
    this.backgroundMask = this.add
      .rectangle(0, 0, config.gameOptions.maxWidth, config.gameOptions.maxHeight, 0x000000)
      .setOrigin(0)
      .setAlpha(1)
      .setScrollFactor(0);

    this.tweens.add({
      targets: this.backgroundMask,
      alpha: 0.35,
      ease: 'Sine.easeOut',
      duration: 1500,
      delay: 0,
      onComplete: () => {
        this.moveDistance = (worldView.centerY - 200) - (worldView.top - 500);
        this.startButton = new Button(this, worldView.centerX, worldView.top - 500, 500, 150, config.lang.play, 'buttonLong_brown', () => this.start());
        this.add.existing(this.startButton);
        this.tweens.add({
          targets: [this.startButton],
          y: '+=' + this.moveDistance,
          ease: 'Sine.easeOut',
          duration: 1000,
        });
      }
    });

    this.cursorKeys = this.input.keyboard.createCursorKeys();
  }

  update(args) {
  }

  start() {
    if (!config.musicMuted && !config.soundsMuted) {
      this.sound.play('beep');
    }
    config.gameStat.currentGroup = parseInt(localStorage[config.localStorageName + '.currentGroup'] || '0');
    config.gameStat.currentLevel = parseInt(localStorage[config.localStorageName + '.currentLevel'] || '0');
    config.gameStat.score = parseInt(localStorage[config.localStorageName + '.score'] || '0');
    this.tweens.add({
      targets: [this.startButton],
      y: '-=' + this.moveDistance,
      ease: 'Sine.easeIn',
      duration: 1000,
    });
    this.tweens.add({
      targets: this.backgroundMask,
      alpha: 0,
      ease: 'Sine.easeOut',
      duration: 1500,
      delay: 500,
      onComplete: () => {
        if (config.gameStat.currentGroup === config.levelGroups.length) {
          resetGameStat();
        }
        if (config.tutorialFinished) {
          this.scene.start('GameScene', {group: config.gameStat.currentGroup, level: config.gameStat.currentLevel, rolling: true});
        } else {
          resetGameStat();
          this.scene.start('IntroScene');
        }
      }
    });
  }

}
