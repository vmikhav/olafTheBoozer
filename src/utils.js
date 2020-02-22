import config from './config'
import Viking from "./sprites/Viking";

export const showMap = (scene, name = 'base', drawRoof = false, addViking = true) => {
  scene.map = scene.add.tilemap(name + 'Map');
  const properties = {};
  let i;
  for (i = 0; i < scene.map.properties.length; i++) {
    properties[scene.map.properties[i].name] = JSON.parse(scene.map.properties[i].value);
  }
  scene.map.properties = properties;
  const startPosition = scene.map.properties.startPos;
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
  scene.behindLayer = scene.map.createBlankDynamicLayer('behindViking', tileset);
  scene.behindLayer.scale = scale;
  if (addViking) {
    scene.viking = new Viking(scene, scene.map, startPosition[0].x, startPosition[0].y);
  }
  scene.roofLayer = scene.map.createStaticLayer('roof', tileset);
  scene.roofLayer.scale = scale;
  scene.frontLayer = scene.map.createBlankDynamicLayer('frontViking', tileset);
  scene.frontLayer.scale = scale;
  if (addViking) {
    scene.viking.checkLayers();
  }
  if (!drawRoof) {
    scene.roofLayer.visible = false;
    scene.roofLayer.alpha = 0;
  }
  const width  = scene.map.widthInPixels * (config.gameOptions.tileSize / 16);
  const height = scene.map.heightInPixels * (config.gameOptions.tileSize / 16);
  scene.cameras.main.setBounds(0, 0, width, height);
  let x, y;
  if (drawRoof) {
    x = Math.floor(width / 2);
    y = Math.floor(height / 2);
    scene.cameras.main.centerOn(x, y);
  }
  const showedItems = scene.map.getLayer(drawRoof ? 'good_items' : 'bad_items').data;
  const badItems = scene.map.getLayer('bad_items').data;
  const overlapItems = scene.map.getLayer('overlap_items').data;
  for (y = 0; y < scene.puzzleLayer.layer.height; y++) {
    for (x = 0; x < scene.puzzleLayer.layer.width; x++) {
      if (showedItems[y][x].index !== -1) {
        scene.puzzleLayer.putTileAt(showedItems[y][x].index, x, y);
      }
      if (y > 0 && badItems[y][x].index === -1 && overlapItems[y - 1][x].index !== -1) {
        scene.behindLayer.putTileAt(overlapItems[y - 1][x].index, x, y - 1);
      }
    }
  }
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

