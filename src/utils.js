import config from './config'

export const showMap = (scene, name = 'base', drawRoof = false) => {
  scene.map = scene.add.tilemap(name + 'Map');
  const scale = Math.floor(config.gameOptions.tileSize / 16);
  const tileset = scene.map.addTilesetImage('base', 'Village_Tileset');
  scene.groundLayer = scene.map.createStaticLayer('ground', tileset);
  scene.groundLayer.scale = scale;
  scene.wallsLayer = scene.map.createStaticLayer('walls', tileset);
  scene.wallsLayer.scale = scale;
  scene.bedLayer = scene.map.createStaticLayer('bed', tileset);
  scene.bedLayer.scale = scale;
  scene.treesLayer = scene.map.createStaticLayer('trees', tileset);
  scene.treesLayer.scale = scale;
  scene.puzzleLayer = scene.map.createBlankDynamicLayer('puzzle', tileset);
  scene.puzzleLayer.scale = scale;
  scene.roofLayer = scene.map.createStaticLayer('roof', tileset);
  scene.roofLayer.scale = scale;
  if (!drawRoof) {
    scene.roofLayer.visible = false;
    scene.roofLayer.alpha = 0;
  }
  let x, y;
  x = Math.floor(scene.map.widthInPixels * config.gameOptions.tileSize / 32);
  y = Math.floor(scene.map.heightInPixels * config.gameOptions.tileSize / 32);
  scene.cameras.main.centerOn(x, y);
  let coords = null;
  const badItems = scene.map.getLayer(drawRoof ? 'good_items' : 'bad_items').data;
  for (y = 0; y < scene.bedLayer.layer.height; y++) {
    for (x = 0; x < scene.bedLayer.layer.width; x++) {
      if (badItems[y][x].index !== -1) {
        scene.puzzleLayer.putTileAt(badItems[y][x].index, x, y);
      }
      if (!coords && scene.bedLayer.getTileAt(x, y)) {
        coords = {x, y: y + 1};
      }
    }
  }
  return coords;
};

export const resetGameStat = () => {
  config.gameStat = {
    started: new Date(),
    completed: 0,
    failed: 0,
    score: 0,
  };
};

export const g2p = (x, y) => {
  return {x: Math.floor(x) * config.gameOptions.tileSize, y: Math.floor(y) * config.gameOptions.tileSize};
};

export const p2g = (pixel) => {
  return {
    x: Math.floor(pixel.x / config.gameOptions.tileSize),
    y: Math.floor(pixel.y / config.gameOptions.tileSize)
  };
};

