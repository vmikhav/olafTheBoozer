import config from './config'

export const showMap = (scene, name = 'base', drawRoof = false) => {
  scene.map = scene.add.tilemap(name + 'Map');
  const properties = {};
  let i;
  for (i = 0; i < scene.map.properties.length; i++) {
    properties[scene.map.properties[i].name] = JSON.parse(scene.map.properties[i].value);
  }
  scene.map.properties = properties;
  const scale = Math.floor(config.gameOptions.tileSize / 16);
  const tileset = scene.map.addTilesetImage('base', 'Village_Tileset');
  scene.groundLayer = scene.map.createStaticLayer('ground', tileset);
  scene.groundLayer.scale = scale;
  scene.wallsLayer = scene.map.createStaticLayer('walls', tileset);
  scene.wallsLayer.scale = scale;
  scene.puzzleLayer = scene.map.createBlankDynamicLayer('puzzle', tileset);
  scene.puzzleLayer.scale = scale;
  scene.treesLayer = scene.map.createStaticLayer('trees', tileset);
  scene.treesLayer.scale = scale;
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
  const badItems = scene.map.getLayer(drawRoof ? 'good_items' : 'bad_items').data;
  for (y = 0; y < scene.puzzleLayer.layer.height; y++) {
    for (x = 0; x < scene.puzzleLayer.layer.width; x++) {
      if (badItems[y][x].index !== -1) {
        scene.puzzleLayer.putTileAt(badItems[y][x].index, x, y);
      }
    }
  }
  return scene.map.properties.startPos;
};

export const resetGameStat = () => {
  config.gameStat = {
    started: new Date(),
    currentGroup: 0,
    currentLevel: 0,
    score: 0,
  };
};

export const getCurrentLevel = () => {
  if (config.gameStat.currentGroup >= config.levelGroups.length) {
    const group = config.levelGroups[config.levelGroups.length - 1];
    return group[group.length - 1];
  } else {
    const group = config.levelGroups[config.gameStat.currentGroup];
    return group[Math.min(group.length - 1, config.gameStat.currentLevel)];
  }
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

