import Phaser from 'phaser'
import config from "../config";

export default class extends Phaser.Scene {
  percentText;

  constructor () {
    super({ key: 'SplashScene' })
  }

  preload () {
    this.load.image('Village_Tileset', 'assets/images/Village_Tileset.png');
    this.load.tilemapTiledJSON('baseMap', "assets/maps/base.json");
    for (let i = 0; i < config.levelCount; i++) {
      this.load.tilemapTiledJSON('level' + i, "assets/maps/level" + i + ".json");
    }
    this.load.atlasXML('ui', 'assets/images/uipack_rpg_sheet.png', 'assets/images/uipack_rpg_sheet.xml');
    this.load.image('musicOn', 'assets/images/musicOn.png');
    this.load.image('musicOff', 'assets/images/musicOff.png');
    this.load.image('restart', 'assets/images/restart.png');
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

    this.scene.start('MainMenuScene');
  }

  update () {}
}
