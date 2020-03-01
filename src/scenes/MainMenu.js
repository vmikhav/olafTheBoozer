import Phaser from 'phaser'
import config from '../config';
import Button from '../components/button'
import {getCurrentLevel, resetGameStat, showMap} from '../utils'

export default class extends Phaser.Scene {
  logo;
  startButton;
  moveDistance;
  backgroundMask;

  isStarting;

  viking;
  fixedElements;

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
    this.fixedElements = [];

    const camera = this.cameras.main;
    const worldView = {top: 0, left: 0, bottom: camera.height, right: camera.width, centerX: camera.width / 2, centerY: camera.height / 2};
    this.backgroundMask = this.add
      .rectangle(0, 0, config.gameOptions.maxWidth, config.gameOptions.maxHeight, 0x000000)
      .setOrigin(0)
      .setAlpha(1)
      .setScrollFactor(0);

    this.isStarting = false;

    this.tweens.add({
      targets: this.backgroundMask,
      alpha: 0.35,
      ease: 'Sine.easeOut',
      duration: 1500,
      delay: 0,
      onComplete: () => {
        this.moveDistance = (worldView.centerY - 200) - (worldView.top - 500);
        this.logo = this.add.image(worldView.centerX, worldView.top - 600, 'logo');
        this.startButton = new Button(this, worldView.centerX, worldView.top - 400, 400, 125, config.lang.play, 'buttonLong_brown', () => this.start());
        this.add.existing(this.startButton);
        this.logo.setScrollFactor(0, 0, true);
        this.startButton.setScrollFactor(0, 0, true);
        this.tweens.add({
          targets: [this.logo, this.startButton],
          y: '+=' + this.moveDistance,
          ease: 'Sine.easeOut',
          duration: 1000,
        });
        this.input.keyboard.on('keyup-SPACE', event => { this.start() });
      }
    });

    this.time.addEvent({
      delay: 2000,
      callback: () => {
        this.fixedElements = [this.logo, this.startButton];
        this.onResize();
      }
    });
  }

  update(args) {
  }

  onResize() {
    let i;
    for (i = 0; i < this.fixedElements.length; i++) {
      if (this.fixedElements[i]) {this.fixedElements[i].setScrollFactor(0, 0, true);}
    }
  }

  start() {
    if (this.isStarting) {return;}
    this.isStarting = true;
    if (!config.musicMuted && !config.soundsMuted) {
      this.sound.play('beep', config.soundParams);
    }
    config.gameStat.currentGroup = parseInt(localStorage[config.localStorageName + '.currentGroup'] || '0');
    config.gameStat.currentLevel = parseInt(localStorage[config.localStorageName + '.currentLevel'] || '0');
    config.gameStat.score = parseInt(localStorage[config.localStorageName + '.score'] || '0');
    this.tweens.add({
      targets: [this.logo, this.startButton],
      y: '-=' + this.moveDistance,
      ease: 'Sine.easeIn',
      duration: 1000,
    });
    this.tweens.add({
      targets: this.backgroundMask,
      alpha: 1,
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
