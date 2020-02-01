import Phaser from 'phaser';
import config from '../config';
import {resetGameStat, showMap} from '../utils'
import Button from '../components/button'
import Panel from '../components/panel'
import ImageButton from '../components/imageButton'
import Cloud from '../sprites/Cloud'
import Viking from "../sprites/Viking";

export default class extends Phaser.Scene {
  gameOver;
  backgroundMask;
  needBackground;

  viking;
  map;

  clouds;

  menuButton;
  muteButton;
  restartButton;
  upButton;
  downButton;
  leftButton;
  rightButton;

  countPanel;

  constructor () {
    super({ key: 'GameScene' });
  }
  init () {}
  preload () {}

  create (params) {
    this.gameOver = config.gameStat.completed === config.levelCount;
    const startPosition = showMap(this, 'base', this.gameOver);
    this.viking = new Viking(this, this.map, startPosition.x, startPosition.y, (total, complete) => {this.levelResult(total, complete);});

    if (!config.music) {
      //config.music = this.sound.add('music', config.musicParams);
      //config.music.play();
      config.musicMuted = localStorage[config.localStorageName + '.muted'] === 'true';
      if (config.musicMuted) {
        this.changeMuteState(config.musicMuted);
      }
    }
    this.clouds = [];
    for (let i = 0; i < 1; i++) {
      this.clouds.push(new Cloud(this, i + 1));
      this.add.existing(this.clouds[i]);
    }

    const worldView = this.cameras.main.worldView;

    this.needBackground = config.gameStat.completed > 0;

    this.time.addEvent({
      delay: 100,
      callback: () => {
        this.muteButton = new ImageButton(this, worldView.left + 60, worldView.top + 60, 80, 80,
          'buttonSquare_brown', config.musicMuted ? 'musicOff' : 'musicOn', () => {this.changeMuteState(!config.musicMuted);}).setAlpha(0);
        this.add.existing(this.muteButton);
        this.muteButton.show();

        this.panel = new Panel(this, worldView.centerX, worldView.bottom - 200, 600, 300);
        this.add.existing(this.panel);

        if (this.gameOver) {
          this.viking.canMove = false;
          this.menuButton = new Button(this, worldView.centerX, worldView.top - 100, 300, 120, config.lang.menu, 'buttonLong_brown', () => this.openMenu());
          this.add.existing(this.menuButton);
          this.tweens.add({
            targets: this.menuButton,
            y: worldView.centerY - 200,
            ease: 'Sine.easeOut',
            duration: 1500,
          });
          const scoreLabel = '.high_score';
          let text = config.lang.score + ': ' + config.gameStat.score + '\n\n';
          if (config.gameStat.score > parseInt(localStorage[config.localStorageName + scoreLabel] || 0)) {
            localStorage[config.localStorageName + scoreLabel] = config.gameStat.score;
            text += config.lang.newHighScore + '!';
          } else {
            text += config.lang.highScore + ': ' + (localStorage[config.localStorageName + scoreLabel] || 0);
          }
          this.panel.show(null, text);
        } else {
          this.restartButton = new ImageButton(this, worldView.right - 60, worldView.top + 60, 80, 80,
            'buttonSquare_brown', 'restart', () => {this.restart();}).setAlpha(0);

          this.upButton = new ImageButton(this, worldView.right - 140, worldView.bottom - 240, 80, 80,
            'buttonSquare_brown', 'up', () => {this.viking.move(0, -1)}).setAlpha(0);
          this.downButton = new ImageButton(this, worldView.right - 140, worldView.bottom - 60, 80, 80,
            'buttonSquare_brown', 'down', () => {this.viking.move(0, 1)}).setAlpha(0);
          this.leftButton = new ImageButton(this, worldView.right - 220, worldView.bottom - 150, 80, 80,
            'buttonSquare_brown', 'left', () => {this.viking.move(-1, 0)}).setAlpha(0);
          this.rightButton = new ImageButton(this, worldView.right - 60, worldView.bottom - 150, 80, 80,
            'buttonSquare_brown', 'right', () => {this.viking.move(1, 0)}).setAlpha(0);

          this.add.existing(this.restartButton);this.restartButton.show();
          this.add.existing(this.upButton);this.upButton.show();
          this.add.existing(this.downButton);this.downButton.show();
          this.add.existing(this.leftButton);this.leftButton.show();
          this.add.existing(this.rightButton);this.rightButton.show();
        }
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
        onComplete: () => {

        }
      });
    }
  }

  update(args) {
    this.viking.update(args);
  }

  levelResult(total, completed) {
    this.upButton.hide();
    this.downButton.hide();
    this.leftButton.hide();
    this.rightButton.hide();
    this.viking.canMove = false;
    const progress = completed / total;
    if (!config.musicMuted && !config.soundsMuted) {
      this.sound.play(progress > .75 ? 'fanfare' : 'tada');
    }
    const score = Math.floor((config.gameStat.completed + 1) * 500 * progress);
    const text = config.lang.score + ': ' + score + ' (' + Math.floor(100 * progress) + '%)';
    this.panel.show(null, text, config.lang.next, ()  => {
      config.gameStat.completed++;
      config.gameStat.score += score;
      localStorage[config.localStorageName + '.score'] = config.gameStat.score;
      localStorage[config.localStorageName + '.level'] = config.gameStat.completed;
      this.restart();
    });
  }

  changeMuteState(status) {
    config.musicMuted = status;
    localStorage[config.localStorageName + '.muted'] = config.musicMuted;
    if (config.music) {
      config.music.setMute(config.musicMuted);
      if (config.musicMuted) {
        config.music.pause();
      } else {
        config.music.resume();
      }
    }
    if (this.muteButton) {
      this.muteButton.setImage(config.musicMuted ? 'musicOff' : 'musicOn');
    }
  }

  restart() {
    if (!config.musicMuted && !config.soundsMuted) {
      this.sound.play('beep');
    }
    this.muteButton.hide();
    this.panel.hide();
    this.restartButton.hide();
    this.upButton.hide();
    this.downButton.hide();
    this.leftButton.hide();
    this.rightButton.hide();
    this.tweens.add({
      targets: this.backgroundMask,
      alpha: 1,
      ease: 'Sine.easeOut',
      duration: 1500,
      delay: 500,
      onComplete: () => {
        this.scene.restart();
      }
    });
  }

  openMenu() {
    resetGameStat();
    localStorage[config.localStorageName + '.score'] = 0;
    localStorage[config.localStorageName + '.level'] = 0;
    this.menuButton.hide();
    this.muteButton.hide();
    this.panel.hide();
    this.tweens.add({
      targets: this.backgroundMask,
      alpha: 1,
      ease: 'Sine.easeOut',
      duration: 1500,
      delay: 500,
      onComplete: () => {
        if (config.music) {
          config.music.stop();
          config.music = null;
        }
        this.scene.start('MainMenuScene');
      }
    });
  }

}
