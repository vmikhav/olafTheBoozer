export default class ImageButton extends Phaser.GameObjects.Container {
  callback;
  callbackInterval;
  callbackTimeout;

  constructor(scene, x, y, width, height, frame, image, callback = () => {}, earlyFire = false) {
    super(scene, x, y);

    this.callback = callback;
    this.frame = frame;
    this.buttonHeight = height;
    this.button = new Phaser.GameObjects.Image(scene, 0, 0, 'ui', this.frame + '.png');
    this.button.setDisplaySize(width, height).setInteractive({ useHandCursor: true });
    if (earlyFire) {
      const restore = () => {
        this.enterButtonNormalState();
        clearTimeout(this.callbackTimeout);
        clearInterval(this.callbackInterval);
      };
      this.button
        .on('pointerdown', () => {
          this.enterButtonActiveState();
          this.clickCallback();
          clearTimeout(this.callbackTimeout);
          clearInterval(this.callbackInterval);
          this.callbackTimeout = setTimeout(() => {
            this.callbackInterval = setInterval(() => this.clickCallback(), 175);
          }, 150);
        })
        .on('pointerout', restore)
        .on('pointerup', restore);
    } else {
      this.button
        .on('pointerdown', () => this.enterButtonActiveState())
        .on('pointerout', () => this.enterButtonNormalState())
        .on('pointerup', () => {
          this.enterButtonNormalState();
          this.clickCallback();
        });
    }

    this.image = new Phaser.GameObjects.Image(scene, 0, 0, image).setDisplaySize(width - 30, height - 30);

    this.add([this.button, this.image]);
    this.isShowed = true;
  }

  setImage(image, frame = null) {
    this.image.setTexture(image, frame);
  }

  clickCallback() {
    this.callback();
  }

  enterButtonNormalState() {
    this.button.setFrame(this.frame + '.png');
    this.image.setY(0);
  }

  enterButtonActiveState() {
    this.button.setFrame(this.frame + '_pressed.png');
    this.image.setY(Math.floor(this.buttonHeight / 25));
  }

  show(duration = 1000) {
    this.isShowed = true;
    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      ease: 'Sine.easeOut',
      duration: duration,
    });
  }

  hide(duration = 1000) {
    if (!this.isShowed) {return;}
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      ease: 'Sine.easeOut',
      duration: duration,
      onComplete: () => {
        this.isShowed = false;
      }
    });
  }
}
