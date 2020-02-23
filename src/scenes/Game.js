import Phaser from 'phaser';
import config from '../config';
import {getCurrentLevel, resetGameStat, showMap} from '../utils'
import Button from '../components/button'
import Panel from '../components/panel'
import ImageButton from '../components/imageButton'
import Viking from "../sprites/Viking";

export default class extends Phaser.Scene {
  gameOver;
  backgroundMask;
  needBackground;
  isRestarting;

  viking;
  map;

  menuButton;
  muteButton;
  restartButton;
  backStepButton;
  upButton;
  downButton;
  leftButton;
  rightButton;
  panel;
  textPanel;

  level;
  params;

  fixedElements;
  buttonHideDuration = 500;

  constructor () {
    super({ key: 'GameScene' });
  }
  init () {}
  preload () {}

  create (params) {
    this.params = params;
    config.gameStat.currentGroup = params.group;
    config.gameStat.currentLevel = params.level;
    localStorage[config.localStorageName + '.currentGroup'] = params.group;
    localStorage[config.localStorageName + '.currentLevel'] = params.level;
    this.gameOver = params.group >= config.levelGroups.length || params.level >= config.levelGroups[params.group].length;
    this.level = getCurrentLevel();
    showMap(this, 'level' + this.level, this.gameOver, !this.gameOver);
    if (!this.gameOver) {
      this.viking.callback = (total, complete, steps) => {
        this.levelResult(total, complete, steps);
      };
      this.cameras.main.startFollow(this.viking, true, 0.05, 0.05);
    }
    this.isRestarting = false;
    this.fixedElements = [];

    if (!config.music) {
      config.music = this.sound.add('birds', config.musicParams);
      config.music.play();
      config.musicMuted = localStorage[config.localStorageName + '.muted'] === 'true';
      if (config.musicMuted) {
        this.changeMuteState(config.musicMuted);
      }
    }

    const camera = this.cameras.main;
    const worldView = {top: 0, left: 0, bottom: camera.height, right: camera.width, centerX: camera.width / 2, centerY: camera.height / 2};

    this.needBackground = true;

    this.time.addEvent({
      delay: 100,
      callback: () => {
        this.muteButton = new ImageButton(this, worldView.left + 60, worldView.top + 60, 80, 80, 'buttonSquare_brown',
          config.musicMuted ? 'musicOff' : 'musicOn', () => {this.changeMuteState(!config.musicMuted);}).setAlpha(0).setScrollFactor(0, 0, true);
        this.add.existing(this.muteButton);
        this.muteButton.show();
        this.input.keyboard.on('keyup-M', event => { this.muteButton.clickCallback(); });

        this.panel = new Panel(this, worldView.centerX, worldView.bottom - 125, 600, 160).setScrollFactor(0, 0, true);
        this.add.existing(this.panel);

        if (this.gameOver) {
          if (this.viking) {
            this.viking.canMove = false;
          }
          this.menuButton = new Button(this, worldView.centerX, worldView.top - 100, 300, 120, config.lang.menu, 'buttonLong_brown', () => this.openMenu());
          this.menuButton.setScrollFactor(0, 0, true);
          this.add.existing(this.menuButton);
          this.tweens.add({
            targets: this.menuButton,
            y: worldView.centerY - 200,
            ease: 'Sine.easeOut',
            duration: 1500,
          });
          const scoreLabel = '.high_score';
          let text = config.lang.score + ': ' + config.gameStat.score + '\n';
          if (config.gameStat.score > parseInt(localStorage[config.localStorageName + scoreLabel] || 0)) {
            localStorage[config.localStorageName + scoreLabel] = config.gameStat.score;
            text += config.lang.newHighScore + '!';
          } else {
            text += config.lang.highScore + ': ' + (localStorage[config.localStorageName + scoreLabel] || 0);
          }
          this.panel.show(null, text);
          this.input.keyboard.on('keyup-SPACE', event => { this.openMenu(); });
        } else {
          this.restartButton = new ImageButton(this, worldView.right - 60, worldView.top + 60, 80, 80,
            'buttonSquare_brown', 'restart', () => {this.restart();}).setAlpha(0).setScrollFactor(0, 0, true);
          this.backStepButton = new ImageButton(this, worldView.right - 170, worldView.top + 60, 80, 80,
            'buttonSquare_brown', 'backStep', () => {this.stepBack();}).setAlpha(0).setScrollFactor(0, 0, true);

          this.upButton = new ImageButton(this, worldView.right - 200, worldView.bottom - 310, 120, 120,
            'buttonSquare_brown', 'up', () => {this.viking.move(0, -1)}).setAlpha(0).setScrollFactor(0, 0, true);
          this.leftButton = new ImageButton(this, worldView.right - 315, worldView.bottom - 195, 120, 120,
            'buttonSquare_brown', 'left', () => {this.viking.move(-1, 0)}).setAlpha(0).setScrollFactor(0, 0, true);
          this.rightButton = new ImageButton(this, worldView.right - 85, worldView.bottom - 195, 120, 120,
            'buttonSquare_brown', 'right', () => {this.viking.move(1, 0)}).setAlpha(0).setScrollFactor(0, 0, true);
          this.downButton = new ImageButton(this, worldView.right - 200, worldView.bottom - 80, 120, 120,
            'buttonSquare_brown', 'down', () => {this.viking.move(0, 1)}).setAlpha(0).setScrollFactor(0, 0, true);

          this.textPanel = new Panel(this, worldView.centerX, worldView.bottom - 200, 600, 300).setScrollFactor(0, 0, true);
          this.add.existing(this.textPanel);

          this.viking.canMove = false;
          const showButtons = () => {
            this.viking.canMove = true;
            this.textPanel.hide();
            this.add.existing(this.restartButton); this.restartButton.show();
            this.add.existing(this.backStepButton); this.backStepButton.show();
            this.add.existing(this.upButton); this.upButton.show();
            this.add.existing(this.leftButton); this.leftButton.show();
            this.add.existing(this.rightButton); this.rightButton.show();
            this.add.existing(this.downButton); this.downButton.show();
          };

          const showDialog = index => {
            if (index && !config.musicMuted && !config.soundsMuted) {
              this.sound.play('beep', config.soundParams);
            }
            if (config.lang['level'+this.level].length > index) {
              this.textPanel.show(null,config.lang['level'+this.level][index], config.lang.next, () => showDialog(index + 1));
            } else {
              config.levelIntoShowed['level'+this.level] = true;
              showButtons();
            }
          };

          config.lang.hasOwnProperty('level'+this.level) && !config.levelIntoShowed['level'+this.level] ? showDialog(0) : showButtons();

          this.input.keyboard.on('keyup-R', event => { this.restart(); });
          this.input.keyboard.on('keyup-SPACE', event => {
            if (this.textPanel.isShowed) {this.textPanel.clickCallback();}
            else if (this.panel.isShowed) {this.panel.clickCallback();}
          });
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
        duration: 500,
        onComplete: () => {

        }
      });
    }

    this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.fixedElements = [
          this.muteButton, this.restartButton, this.backStepButton, this.menuButton,
          this.upButton, this.leftButton, this.rightButton, this.downButton,
          this.panel, this.textPanel,
        ];
        this.onResize();
      }
    });
  }

  update(time, delta) {
    if (this.viking) {
      this.viking.update(time, delta);
    }
  }

  onResize() {
    let i;
    for (i = 0; i < this.fixedElements.length; i++) {
      if (this.fixedElements[i]) {this.fixedElements[i].setScrollFactor(0, 0, true);}
    }
  }

  stepBack() {
    this.viking.restorePath(false);
  }

  levelResult(total, completed, steps) {
    this.backStepButton.hide(this.buttonHideDuration);
    this.upButton.hide(this.buttonHideDuration);
    this.downButton.hide(this.buttonHideDuration);
    this.leftButton.hide(this.buttonHideDuration);
    this.rightButton.hide(this.buttonHideDuration);
    if (this.viking) {
      this.viking.canMove = false;
      this.viking.restorePath();
    }
    const progress = completed / total;
    const levels = JSON.parse(localStorage[config.localStorageName + '.levels'] || '{}');
    if (!levels.hasOwnProperty(this.level)) {
      levels[this.level] = {score: 0, steps: 0};
    }
    if (!config.musicMuted && !config.soundsMuted) {
      this.sound.play(progress < 1 ? 'tada' : 'fanfare', config.soundParams);
    }
    const score = Math.floor(this.map.properties.score * progress);
    let text = config.lang.score + ': ' + score + ' (' + Math.floor(100 * progress) + '%)';
    if (progress === 1) {
      text += '\n' + config.lang.steps + ': ' + steps;
      if (levels[this.level].steps && levels[this.level].steps !== steps) {
        text += ' (' + levels[this.level].steps + ')';
      }
    }
    this.panel.show(null, text, config.lang.next, ()  => {
      if (this.isRestarting) {return;}
      this.isRestarting = true;
      if (levels[this.level].score < score) {
        config.gameStat.score += score - levels[this.level].score;
        levels[this.level].score = score;
      }
      if (progress === 1) {
        levels[this.level].steps = levels[this.level].steps ? Math.min(steps, levels[this.level].steps) : steps;
      }
      localStorage[config.localStorageName + '.score'] = config.gameStat.score;
      localStorage[config.localStorageName + '.levels'] = JSON.stringify(levels);
      if (this.viking) {
        this.viking.stopped = true;
      }
      this.restart(true);
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

  restart(otherLevel = false) {
    if (this.isRestarting && !otherLevel) {return;}
    this.isRestarting = true;
    if (!config.musicMuted && !config.soundsMuted) {
      this.sound.play('beep', config.soundParams);
    }
    this.muteButton.hide(this.buttonHideDuration);
    this.panel.hide(this.buttonHideDuration);
    this.backStepButton.hide(this.buttonHideDuration);
    this.restartButton.hide(this.buttonHideDuration);
    this.upButton.hide(this.buttonHideDuration);
    this.downButton.hide(this.buttonHideDuration);
    this.leftButton.hide(this.buttonHideDuration);
    this.rightButton.hide(this.buttonHideDuration);
    this.tweens.add({
      targets: this.backgroundMask,
      alpha: 1,
      ease: 'Sine.easeOut',
      duration: 500,
      delay: 250,
      onComplete: () => {
        if (!otherLevel) {
          this.scene.restart(this.params);
        } else {
          if (this.params.rolling) {
            if (this.params.level === config.levelGroups[this.params.group].length - 1) {
              //TODO open group selector
              this.params.group++;
              this.params.level = 0;
              this.scene.restart(this.params);
            } else {
              this.params.level++;
              this.scene.restart(this.params);
            }
          } else {
            //TODO open level selector
            this.scene.start('MainMenuScene');
          }
        }
      }
    });
  }

  openMenu() {
    if (this.isRestarting) {return;}
    this.isRestarting = true;
    if (!config.musicMuted && !config.soundsMuted) {
      this.sound.play('beep', config.soundParams);
    }
    resetGameStat();
    localStorage[config.localStorageName + '.score'] = 0;
    this.menuButton.hide(this.buttonHideDuration);
    this.muteButton.hide(this.buttonHideDuration);
    this.panel.hide(this.buttonHideDuration);
    this.tweens.add({
      targets: this.backgroundMask,
      alpha: 1,
      ease: 'Sine.easeOut',
      duration: 500,
      delay: 250,
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
