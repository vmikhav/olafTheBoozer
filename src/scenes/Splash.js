import Phaser from 'phaser'
import config from "../config";

export default class extends Phaser.Scene {
  percentText;

  constructor () {
    super({ key: 'SplashScene' })
  }

  preload () {
    let i, j, k;
    this.load.image('Village_Tileset', 'assets/images/Village_Tileset.png');
    for (i = 0; i < config.levelGroups.length; i++) {
      for (j = 0; j < config.levelGroups[i].length; j++) {
        k = config.levelGroups[i][j];
        this.load.tilemapTiledJSON('level' + k + 'Map', "assets/maps/level" + k + ".json");
      }
    }
    this.load.atlasXML('ui', 'assets/images/uipack_rpg_sheet.png', 'assets/images/uipack_rpg_sheet.xml');
    this.load.image('musicOn', 'assets/images/musicOn.png');
    this.load.image('musicOff', 'assets/images/musicOff.png');
    this.load.image('restart', 'assets/images/restart.png');
    this.load.image('backStep', 'assets/images/backStep.png');
    this.load.image('up', 'assets/images/up.png');
    this.load.image('down', 'assets/images/down.png');
    this.load.image('left', 'assets/images/left.png');
    this.load.image('right', 'assets/images/right.png');
    this.load.spritesheet('portraits', 'assets/images/portraits.png', {frameWidth: 32, frameHeight: 32});
    this.load.spritesheet('viking', 'assets/images/viking.png', {frameWidth: 16, frameHeight: 16});
    this.load.spritesheet('clouds', 'assets/images/clouds.png', {frameWidth: 400, frameHeight: 166});
    this.load.spritesheet('boom', 'assets/images/boom.png', {frameWidth: 128, frameHeight: 128});
    for (let sound of config.gameOptions.hiccupSounds) {
      this.load.audio(sound, 'assets/sounds/' + sound + '.wav');
    }
    for (let sound of config.gameOptions.actionSounds) {
      const name = sound.split('.')[0];
      this.load.audio(name, 'assets/sounds/' + sound);
    }
    for (let sound of config.gameOptions.finishSounds) {
      const name = sound.split('.')[0];
      this.load.audio(name, 'assets/sounds/' + sound);
    }

    this.percentText = this.make.text({
      x: this.cameras.main.width / 2,
      y: this.cameras.main.height / 2 - 5,
      text: '0%',
      style: {
        fontFamily: '"Press Start 2P"',
        fontSize: '24px',
        fill: '#ffffff'
      }
    });
    this.percentText.setOrigin(0.5, 0.5);
    this.load.on('progress', (value) => {
      this.percentText.setText(parseInt(value * 100) + '%');
    });
  }

  create () {
    this.percentText.destroy();
    this.textures.get('Village_Tileset').setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.textures.get('ui').setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.textures.get('portraits').setFilter(Phaser.Textures.FilterMode.NEAREST);
    this.textures.get('viking').setFilter(Phaser.Textures.FilterMode.NEAREST);

    this.anims.create({
      key: 'boom_creating',
      frames: this.anims.generateFrameNumbers('boom', { start: 0, end: 14 }),
      frameRate: 30,
      repeat: 0
    });
    this.anims.create({
      key: 'viking_idle_left',
      frames: [ { key: 'viking', frame: 0 }, { key: 'viking', frame: 1 }, { key: 'viking', frame: 0 } ],
      frameRate: 5,
      repeatDelay: 1000,
      repeat: -1,
    });
    this.anims.create({
      key: 'viking_idle_right',
      frames: [ { key: 'viking', frame: 3 }, { key: 'viking', frame: 2 }, { key: 'viking', frame: 3 } ],
      frameRate: 5,
      repeatDelay: 1000,
      repeat: -1,
    });
    this.anims.create({
      key: 'viking_naked_left',
      frames: [ { key: 'viking', frame: 4 }, { key: 'viking', frame: 5 }, { key: 'viking', frame: 4 } ],
      frameRate: 5,
      repeatDelay: 1000,
      repeat: -1,
    });
    this.anims.create({
      key: 'viking_naked_right',
      frames: [ { key: 'viking', frame: 7 }, { key: 'viking', frame: 6 }, { key: 'viking', frame: 7 } ],
      frameRate: 5,
      repeatDelay: 1000,
      repeat: -1,
    });

    this.scene.start('MainMenuScene');
  }

  update () {}
}
