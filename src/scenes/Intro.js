import Phaser from 'phaser';
import config from '../config';
import { resetGameStat, showMap } from '../utils'
import Panel from '../components/panel'
import Button from '../components/button'
import Viking from "../sprites/Viking";

export default class extends Phaser.Scene {
  viking;
  skipButton;
  backgroundMask;
  needBackground;

  fixedElements;

  constructor () {
    super({ key: 'IntroScene' });
  }
  init () {}
  preload () {}

  create (params) {
    showMap(this, 'level0', false, true);
    this.cameras.main.startFollow(this.viking, true, 0.05, 0.05);
    this.needBackground = true;
    this.fixedElements = [];

    const camera = this.cameras.main;
    const worldView = {top: 0, left: 0, bottom: camera.height, right: camera.width, centerX: camera.width / 2, centerY: camera.height / 2};

    this.time.addEvent({
      delay: 100,
      callback: () => {
        this.skipButton = new Button(this, worldView.right - 135, worldView.top - 100, 250, 80, config.lang.skip, 'buttonLong_brown', () => this.startGame());
        this.add.existing(this.skipButton);
        this.skipButton.setScrollFactor(0, 0, true);
        this.tweens.add({
          targets: this.skipButton,
          y: worldView.top + 60,
          ease: 'Expo.easeOut',
          duration: 3000,
        });

        this.panel = new Panel(this, worldView.centerX, worldView.bottom - 200, 600, 300).setScrollFactor(0, 0, true);
        this.add.existing(this.panel);

        this.introStep0();
        this.input.keyboard.on('keyup-SPACE', event => { if (this.panel.isShowed) {this.panel.clickCallback();} });
      }
    });

    this.backgroundMask = this.add
      .rectangle(0, 0, config.gameOptions.maxWidth, config.gameOptions.maxHeight, 0x000000)
      .setOrigin(0)
      .setAlpha(this.needBackground ? 1 : 0)
      .setScrollFactor(0);

    if (this.needBackground) {
      this.tweens.add({
        targets: [this.backgroundMask],
        alpha: { from: 1, to: 0 },
        ease: 'Sine.easeOut',
        duration: 1000,
      });
    }

    this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.fixedElements = [this.skipButton, this.panel];
        this.onResize();
      }
    });
  }

  update() {
  }

  onResize() {
    let i;
    for (i = 0; i < this.fixedElements.length; i++) {
      if (this.fixedElements[i]) {this.fixedElements[i].setScrollFactor(0, 0, true);}
    }
  }

  introStep0() {
    this.panel.show(null, config.lang.intro0, config.lang.next, () => this.introStep1());
  }

  introStep1() {
    if (!config.musicMuted && !config.soundsMuted) {
      this.sound.play('beep', config.soundParams);
    }
    this.panel.show(null, config.lang.intro1, config.lang.play, () => this.startGame());
  }

  startGame() {
    if (!config.musicMuted && !config.soundsMuted) {
      this.sound.play('beep', config.soundParams);
    }
    config.tutorialFinished = true;
    localStorage[config.localStorageName + '.tutorialFinished'] = config.tutorialFinished;
    this.panel.hide();
    this.tweens.add({
      targets: this.skipButton,
      alpha: 0,
      ease: 'Sine.easeOut',
      duration: 800,
      onComplete: () => {
        resetGameStat();
        this.scene.start('GameScene', {group: config.gameStat.currentGroup, level: config.gameStat.currentLevel, rolling: true});
      }
    });
  }

}
