import Phaser from 'phaser'
import config from "../config";
import {g2p} from "../utils";

export default class extends Phaser.GameObjects.Container {
  gridX;
  gridY;
  map;
  scene;

  sprite;
  hiccupText;
  hiccupSounds;
  actionSounds;
  orientation = 'left';

  cursorKeys;
  isKeyPressed = false;
  isMoving = false;
  canMove = true;
  stopped = false;

  puzzleLayer;

  callback;
  path;

  constructor(scene, map, x, y, callback = (total, collected, steps) => {}) {
    super(scene, x * config.gameOptions.tileSize, y * config.gameOptions.tileSize);

    this.callback = callback;

    scene.anims.create({
      key: 'viking_idle_left',
      frames: [ { key: 'viking', frame: 0 }, { key: 'viking', frame: 1 }, { key: 'viking', frame: 0 } ],
      frameRate: 5,
      repeatDelay: 1000,
      repeat: -1,
    });
    scene.anims.create({
      key: 'viking_idle_right',
      frames: [ { key: 'viking', frame: 3 }, { key: 'viking', frame: 2 }, { key: 'viking', frame: 3 } ],
      frameRate: 5,
      repeatDelay: 1000,
      repeat: -1,
    });

    this.scene  = scene;
    this.gridX  = x;
    this.gridY  = y;
    this.path   = [{x, y}];
    this.sprite = new Phaser.GameObjects.Sprite(scene, 0, 0, 'viking', 5);
    this.sprite.setDisplaySize(config.gameOptions.vikingSize, config.gameOptions.vikingSize);
    const origin = ((config.gameOptions.vikingSize - config.gameOptions.tileSize) / 2) / config.gameOptions.vikingSize
    this.sprite.setOrigin(origin, 0.1 + origin);
    this.map = map;

    const style = {fontSize: 16, fontFamily: '"Press Start 2P"'};
    this.hiccupText = new Phaser.GameObjects.Text(scene, 16, 0, '', style).setOrigin(0.5, 1).setAlpha(0);
    this.add([this.sprite, this.hiccupText]);

    this.hiccupSounds = [];
    for (const str of config.gameOptions.hiccupSounds) {
      this.hiccupSounds.push({str: str, sound: scene.sound.add(str, config.soundParams)});
    }

    this.actionSounds = {};
    for (const sound of config.gameOptions.actionSounds) {
      const name = sound.split('.')[0];
      this.actionSounds[name] = scene.sound.add(name, config.soundParams);
    }

    scene.add.existing(this);
    scene.add.existing(this.sprite);

    scene.time.addEvent({
      delay: config.gameOptions.hiccupDelay,
      callback: () => {
        if (Math.random() < 0.5) {
          return;
        }
        const n = Phaser.Math.Between(0, this.hiccupSounds.length - 1);
        this.hiccupText.setText('* ' + this.hiccupSounds[n].str + ' *');
        if (!config.musicMuted && !config.soundsMuted) {
          this.hiccupSounds[n].sound.play();
        }
        scene.tweens.add({
          targets: this.hiccupText,
          y: {from: 0, to: -32},
          alpha: {from: 1, to: 0},
          ease: 'Sine.easeOut',
          duration: config.gameOptions.hiccupTextDuration,
        });
      },
      loop: true,
    });

    this.sprite.anims.play('viking_idle_' + this.orientation);

    this.cursorKeys = scene.input.keyboard.createCursorKeys();

    this.puzzleLayer = this.map.getLayer('puzzle').tilemapLayer;
  }

  update(time, delta) {
    if (!this.isKeyPressed && !this.isMoving) {
      if (!this.isMoving) {
        let direction = {x: 0, y: 0};
        if (this.cursorKeys.up.isDown) {
          direction.y = -1;
        } else if (this.cursorKeys.down.isDown) {
          direction.y = 1;
        } else if (this.cursorKeys.left.isDown) {
          direction.x = -1;
        } else if (this.cursorKeys.right.isDown) {
          direction.x = 1;
        } else {
          this.isKeyPressed = false;
          return;
        }
        this.move(direction.x, direction.y);
        this.isKeyPressed = true;
      }
    } else {
      this.isKeyPressed = this.cursorKeys.up.isDown || this.cursorKeys.down.isDown || this.cursorKeys.right.isDown || this.cursorKeys.left.isDown;
    }
  }

  move(x, y) {
    if (this.isMoving || !this.canMove) {return;}
    const tmpX = this.gridX + x;
    const tmpY = this.gridY + y;
    if (x > 0) {
      this.orientation = 'right';
    } else if (x < 0) {
      this.orientation = 'left';
    }
    this.sprite.anims.play('viking_idle_' + this.orientation, true);
    const goodItem   = this.map.getLayer('good_items').data[tmpY][tmpX].index;
    const badItem    = this.map.getLayer('bad_items').data[tmpY][tmpX].index;
    const actualItem = this.map.getLayer('puzzle').data[tmpY][tmpX].index;
    const wallItem   = this.map.getLayer('walls').data[tmpY][tmpX].index;
    if ((wallItem !== -1 && actualItem !== 391) || (badItem !== -1 && goodItem !== -1 && actualItem !== badItem)) {
      if (!config.musicMuted && !config.soundsMuted) {
        this.actionSounds['bump'].play();
      }
      return;
    }
    this.isMoving = true;
    this.gridX = tmpX;
    this.gridY = tmpY;
    this.path.push({x: tmpX, y: tmpY});
    const newCoords = g2p(tmpX, tmpY);
    this.scene.tweens.add({
      targets: this,
      x: newCoords.x,
      y: newCoords.y,
      ease: 'Sine.easeInOut',
      duration: config.gameOptions.moveDuration,
      onComplete: () => {
        if (this.gridX === this.map.properties.endPos.x && this.gridY === this.map.properties.endPos.y) {
          let total = 0, completed = 0;
          const badItems    = this.map.getLayer('bad_items').data;
          const puzzleItems = this.map.getLayer('puzzle').data;
          for (y = 0; y < this.scene.puzzleLayer.layer.height; y++) {
            for (x = 0; x < this.scene.puzzleLayer.layer.width; x++) {
              if (badItems[y][x].index !== -1) {
                total++;
                if (badItems[y][x].index !== puzzleItems[y][x].index) {
                  completed++;
                }
              }
            }
          }
          this.callback(total, completed, this.path.length - 1);
        }
        if (badItem !== -1 && actualItem !== -1) {
          if (!config.musicMuted && !config.soundsMuted) {
            let i;
            for (i = 0; i < config.soundsMap.length; i++) {
              if (config.soundsMap[i].items.includes(goodItem) || config.soundsMap[i].items.includes(badItem)) {
                break;
              }
            }
            this.actionSounds[i === config.soundsMap.length ? 'break' : config.soundsMap[i].sound].play();
          }

          this.puzzleLayer.putTileAt(goodItem, tmpX, tmpY);
          const newGoodItem = this.map.getLayer('good_items').data[tmpY - 1][tmpX].index;
          const newBadItem = this.map.getLayer('bad_items').data[tmpY - 1][tmpX].index;
          if (newBadItem === -1 && newGoodItem !== -1) {
            this.puzzleLayer.putTileAt(newGoodItem, tmpX, tmpY - 1);
          }
        } else {
          if (!config.musicMuted && !config.soundsMuted) {
            this.actionSounds['step'].play();
          }
        }
        this.isMoving = false;
      }
    });
  }

  restorePath() {
    if (this.stopped || !this.path.length) {
      return;
    }
    const pos = this.path.pop();
    const tmpX = pos.x, tmpY = pos.y;
    const newCoords = g2p(tmpX, tmpY);
    if (tmpX > this.gridX) {
      this.orientation = 'right';
    } else if (tmpX < this.gridX) {
      this.orientation = 'left';
    }
    this.sprite.anims.play('viking_idle_' + this.orientation, true);
    this.gridX = tmpX;
    this.gridY = tmpY;
    const goodItem = this.map.getLayer('good_items').data[tmpY][tmpX].index;
    const badItem = this.map.getLayer('bad_items').data[tmpY][tmpX].index;
    const actualItem = this.map.getLayer('puzzle').data[tmpY][tmpX].index;
    if (badItem !== -1) {
      this.puzzleLayer.putTileAt(badItem, tmpX, tmpY);
      const newGoodItem = this.map.getLayer('good_items').data[tmpY - 1][tmpX].index;
      const newBadItem = this.map.getLayer('bad_items').data[tmpY - 1][tmpX].index;
      if (newBadItem === -1 && newGoodItem !== -1) {
        this.puzzleLayer.putTileAt(-1, tmpX, tmpY - 1);
      }
    }
    if (!config.musicMuted && !config.soundsMuted) {
      if (badItem !== -1 && actualItem !== badItem) {
        let i;
        for (i = 0; i < config.soundsMap.length; i++) {
          if (config.soundsMap[i].items.includes(goodItem) || config.soundsMap[i].items.includes(badItem)) {
            break;
          }
        }
        this.actionSounds[i === config.soundsMap.length ? 'break' : config.soundsMap[i].sound].play();
      } else {
        this.actionSounds['step'].play();
      }
    }
    this.scene.tweens.add({
      targets: this,
      x: newCoords.x,
      y: newCoords.y,
      ease: 'Sine.easeInOut',
      duration: config.gameOptions.moveDuration,
      onComplete: () => {
        setTimeout(() => this.restorePath(), 50);
      }
    });
  }
}
