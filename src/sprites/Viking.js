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
  status = 'idle';

  cursorKeys;
  wasdKeys;
  isKeyPressed = false;
  isMoving = false;
  canMove = true;
  stopped = false;

  puzzleLayer;
  behindLayer;
  frontLayer;

  callback;
  path;

  trails = [614, 615, 647, 646];

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
    scene.anims.create({
      key: 'viking_naked_left',
      frames: [ { key: 'viking', frame: 4 }, { key: 'viking', frame: 5 }, { key: 'viking', frame: 4 } ],
      frameRate: 5,
      repeatDelay: 1000,
      repeat: -1,
    });
    scene.anims.create({
      key: 'viking_naked_right',
      frames: [ { key: 'viking', frame: 7 }, { key: 'viking', frame: 6 }, { key: 'viking', frame: 7 } ],
      frameRate: 5,
      repeatDelay: 1000,
      repeat: -1,
    });

    this.scene  = scene;
    this.gridX  = x;
    this.gridY  = y;
    this.path   = [{x, y, item: -1}];
    this.sprite = new Phaser.GameObjects.Sprite(scene, 0, 0, 'viking', 5);
    this.sprite.setDisplaySize(config.gameOptions.vikingSize, config.gameOptions.vikingSize);
    const origin = ((config.gameOptions.vikingSize - config.gameOptions.tileSize) / 2) / config.gameOptions.vikingSize;
    this.sprite.setOrigin(origin, 0.175 + origin);
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
    this.checkStatus();

    this.sprite.anims.play('viking_' + this.status + '_' + this.orientation);

    this.cursorKeys = scene.input.keyboard.createCursorKeys();
    this.wasdKeys = scene.input.keyboard.addKeys('W,S,A,D');
  }

  checkLayers() {
    this.puzzleLayer = this.map.getLayer('puzzle').tilemapLayer;
    this.behindLayer = this.map.getLayer('behindViking').tilemapLayer;
    this.frontLayer = this.map.getLayer('frontViking').tilemapLayer;
  }

  update(time, delta) {
    if (!this.isKeyPressed && !this.isMoving) {
      if (!this.isMoving) {
        let direction = {x: 0, y: 0};
        if (this.cursorKeys.up.isDown || this.wasdKeys.W.isDown) {
          direction.y = -1;
        } else if (this.cursorKeys.down.isDown || this.wasdKeys.S.isDown) {
          direction.y = 1;
        } else if (this.cursorKeys.left.isDown || this.wasdKeys.A.isDown) {
          direction.x = -1;
        } else if (this.cursorKeys.right.isDown || this.wasdKeys.D.isDown) {
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
      if (!this.isKeyPressed) {
        this.isKeyPressed = this.wasdKeys.W.isDown || this.wasdKeys.S.isDown || this.wasdKeys.A.isDown || this.wasdKeys.D.isDown;
      }
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
    const goodItem   = this.map.getLayer('good_items').data[tmpY][tmpX].index;
    const badItem    = this.map.getLayer('bad_items').data[tmpY][tmpX].index;
    const actualItem = this.map.getLayer('puzzle').data[tmpY][tmpX].index;
    const wallItem   = this.map.getLayer('walls').data[tmpY][tmpX].index;
    this.sprite.anims.play('viking_' + this.status +'_' + this.orientation, true);
    if (actualItem === 500) { this.status = 'idle'; }
    if (
      (wallItem !== -1 && actualItem !== 391) || (badItem !== -1 && goodItem !== -1 && actualItem !== badItem) ||
      (this.status === 'naked' && [459, 460, 490, 684, 685, 686, 687].includes(actualItem) || !this.canStepOnTrail(tmpX, tmpY, actualItem))
    ) {
      if (!config.musicMuted && !config.soundsMuted) {
        this.actionSounds['bump'].play();
      }
      return;
    }
    this.isMoving = true;
    this.gridX = tmpX;
    this.gridY = tmpY;
    this.path.push({x: tmpX, y: tmpY, item: actualItem === badItem ? actualItem : -1});
    let overlapItem = this.map.getLayer('behindViking').data[tmpY][tmpX].index;
    if (overlapItem && y !== -1) {
      this.frontLayer.putTileAt(overlapItem, tmpX, tmpY);
    }
    this.frontLayer.putTileAt(-1, tmpX, tmpY - 1);
    const newCoords = g2p(tmpX, tmpY);
    this.scene.tweens.add({
      targets: this,
      x: newCoords.x,
      y: newCoords.y,
      ease: 'Sine.easeInOut',
      duration: config.gameOptions.moveDuration,
      onComplete: () => {
        if (actualItem === 500) {
          this.sprite.anims.play('viking_' + this.status + '_' + this.orientation, true);
        }
        if (overlapItem && y === -1) {
          this.frontLayer.putTileAt(overlapItem, tmpX, tmpY);
        }
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
          this.behindLayer.putTileAt(this.map.getLayer('overlap_items').data[tmpY - 1][tmpX].index, tmpX, tmpY - 1);
        } else {
          if (!config.musicMuted && !config.soundsMuted) {
            this.actionSounds['step'].play();
          }
        }
        this.isMoving = false;
      }
    });
  }

  restorePath(chain = true) {
    if (this.stopped || !this.path.length) {
      return;
    }
    if (!chain && this.path.length < 2) {return;}
    const pos = this.path.pop();
    const tmpX = pos.x, tmpY = pos.y, item = pos.item;
    let newCoords;
    if (chain) {
      newCoords = g2p(tmpX, tmpY);
      if (tmpX > this.gridX) {
        this.orientation = 'right';
      } else if (tmpX < this.gridX) {
        this.orientation = 'left';
      }
      this.gridX = tmpX;
      this.gridY = tmpY;
    } else {
      const xPos = this.path[this.path.length - 1];
      const xTmpX = xPos.x, xTmpY = xPos.y;
      newCoords = g2p(xTmpX, xTmpY);
      if (xTmpX > this.gridX) {
        this.orientation = 'left';
      } else if (xTmpX < this.gridX) {
        this.orientation = 'right';
      }
      this.gridX = xTmpX;
      this.gridY = xTmpY;
    }
    if (item !== -1) {
      if (item !== 500 && !this.trails.includes(item)) {
        this.puzzleLayer.putTileAt(item, tmpX, tmpY);
      }
      this.behindLayer.putTileAt(-1, tmpX, tmpY - 1);
      if (item === 500) { this.status = 'naked'; }
    }
    let overlapItem = this.map.getLayer('behindViking').data[tmpY][tmpX].index;
    if (overlapItem) {
      this.frontLayer.putTileAt(overlapItem, tmpX, tmpY);
    }
    this.frontLayer.putTileAt(-1, tmpX, tmpY - 1);
    if (!config.musicMuted && !config.soundsMuted) {
      if (item !== -1) {
        const goodItem = this.map.getLayer('good_items').data[tmpY][tmpX].index;
        let i;
        for (i = 0; i < config.soundsMap.length; i++) {
          if (config.soundsMap[i].items.includes(goodItem) || config.soundsMap[i].items.includes(item)) {
            break;
          }
        }
        this.actionSounds[i === config.soundsMap.length ? 'break' : config.soundsMap[i].sound].play();
      } else {
        this.actionSounds['step'].play();
      }
    }
    this.sprite.anims.play('viking_' + this.status +'_' + this.orientation, true);
    this.scene.tweens.add({
      targets: this,
      x: newCoords.x,
      y: newCoords.y,
      ease: 'Sine.easeInOut',
      duration: config.gameOptions.moveDuration,
      onComplete: () => {
        if (item !== -1) {
          this.puzzleLayer.putTileAt(item, tmpX, tmpY);
        }
        if (chain) {
          setTimeout(() => this.restorePath(), 50);
        }
      }
    });
  }

  checkStatus() {
    let x, y;
    const badItems = this.map.getLayer('bad_items').data;
    for (y = 0; y < this.scene.puzzleLayer.layer.height; y++) {
      for (x = 0; x < this.scene.puzzleLayer.layer.width; x++) {
        if (badItems[y][x].index === 500) {
          y = this.scene.puzzleLayer.layer.height;
          this.status = 'naked';
          break;
        }
      }
    }
  }

  canStepOnTrail(x, y, actual) {
    const pos = this.trails.indexOf(actual);
    const data = this.map.getLayer('puzzle').data;
    if (pos === -1) {
      const currentPoint = this.path[this.path.length - 1];
      const currentItem = currentPoint.item;
      if (this.trails.includes(currentItem)) {
        const t = this.trails;
        const cx = currentPoint.x, cy = currentPoint.y;
        const offset = this.getNextTrailPosOffset(currentItem);
        const neighbour = (t.includes(data[cy - 1][cx].index) || t.includes(data[cy + 1][cx].index) || t.includes(data[cy][cx - 1].index) || t.includes(data[cy][cx + 1].index));
        return !neighbour && x === (cx - offset.fx) && y === (cy - offset.fy);
      }
      return true;
    }
    // check if can start trail
    const offset = this.getNextTrailPosOffset(actual);

    const hasNextTrailTile = this.trails.includes(data[y + offset.fy][x + offset.fx].index);

    return !hasNextTrailTile;
  }

  getNextTrailPosOffset(item) {
    const pos = this.trails.indexOf(item);
    const offset = -1 + ((pos % 2) * 2);
    let fx = 0, fy = 0;
    if (pos > 1) {
      fx += offset;
    } else {
      fy += offset;
    }
    return {fx, fy};
  }
}
