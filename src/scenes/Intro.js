import Phaser from 'phaser';
import config from '../config';
import { resetGameStat, showMap } from '../utils'
import Panel from '../components/panel'
import Button from '../components/button'
import Viking from "../sprites/Viking";

export default class extends Phaser.Scene {
  viking;
  skipButton;

  constructor () {
    super({ key: 'IntroScene' });
  }
  init () {}
  preload () {}

  create (params) {
    const startPosition = showMap(this, 'level0', false);
    this.viking = new Viking(this, this.map, startPosition.x, startPosition.y);

    const worldView = this.cameras.main.worldView;

    this.time.addEvent({
      delay: 100,
      callback: () => {
        this.skipButton = new Button(this, worldView.right - 135, worldView.top - 100, 250, 80, config.lang.skip, 'buttonLong_brown', () => this.startGame());
        this.add.existing(this.skipButton);
        this.tweens.add({
          targets: this.skipButton,
          y: worldView.top + 60,
          ease: 'Expo.easeOut',
          duration: 3000,
        });

        this.panel = new Panel(this, worldView.centerX, worldView.bottom - 200, 600, 300);
        this.add.existing(this.panel);

        this.introStep0();
      }
    });
  }

  update() {
  }

  introStep0() {
    this.panel.show(null, config.lang.intro0, config.lang.next, () => this.introStep1());
  }

  introStep1() {
    if (!config.musicMuted && !config.soundsMuted) {
      this.sound.play('beep');
    }
    this.panel.show(null, config.lang.intro1, config.lang.play, () => this.startGame());
  }

  startGame() {
    if (!config.musicMuted && !config.soundsMuted) {
      this.sound.play('beep');
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
        this.scene.start('GameScene', {level: config.gameStat.completed});
      }
    });
  }

}
