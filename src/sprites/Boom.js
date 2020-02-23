import Phaser from 'phaser'
import config from "../config";

export default class extends Phaser.GameObjects.Sprite {
  constructor (scene, x, y, size, autoplay = true) {
    super(scene, x + config.gameOptions.tileSize / 2, y + config.gameOptions.tileSize / 2, 'boom', 0);
    this.setDisplaySize(size, size);
    scene.add.existing(this);

    if (autoplay) {
      this.play('boom_creating');
    }
  }
}
