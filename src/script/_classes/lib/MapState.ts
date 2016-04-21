/// <reference path="../../_d.ts/phaser/phaser.d.ts"/>
"use strict";
import GameApp    = require("../GameApp");
import MapSprite  = require("./MapSprite");
import MapButton  = require("./MapButton");
import joypad     = require("./joypad");


/**
 * MapState class
 * 
 * @date 21-04-2016
 */

class MapState extends Phaser.State {
  public objectClasses:Object;
  public loaded:Object;
  public mapData:any;
  public mapFolder:string;
  public layers:Object;
  public objectTypes:Object;
  public map:Phaser.Tilemap;
  public buttonType:string;
  public focusedButton:number;
  public joypad=joypad;

  constructor(public gameApp:GameApp, public mapName?:string, private _url?:string) {
    super();
    this.objectClasses = {
      "sprite": MapSprite,
      "button": MapButton
    };
    this.loaded = {};
  }

  loadMap(mapName:string) {
    this.game.state.start(this.key, true, false, mapName);
  };

  init(mapName?:string) {
    if (mapName) {
      this.mapName = mapName;
    }
    this.mapData = null;
    if (this.cache.checkTilemapKey(this.mapName)) {
      this.mapData = this.cache.getTilemapData(this.mapName).data;
      this._url = null;
    }
  };

  preload() {
    var txt:Phaser.Text;
    if (!(this.mapName) || this.loaded[this.mapName]) {
      return;
    }
    this.game.stage.backgroundColor = 0;
    txt = this.add.text(0, this.stage.height, "0%", {
      fill: "white"
    });
    txt.anchor.set(0, 1);
    this.load.onFileComplete.add(function(progress:number, key:string) {
      if (key === this.mapName) {
        this.loadAssets();
      } else {
        txt.anchor.x = progress / 100;
        txt.position.x = txt.anchor.x * txt.game.width;
        txt.text = progress + "%";
      }
    }, this);
    if (this._url) {
      this.load.tilemap(this.mapName, this._url, null, Phaser.Tilemap.TILED_JSON);
      this._url = null;
    }
  };

  loadAssets() {
    var layer:any, tileset:any, url:string;
    if (!this.cache.checkTilemapKey(this.mapName)) {
      return;
    }
    url = this.cache.getTilemapData(this.mapName).url;
    this.mapFolder = url.substr(0, url.lastIndexOf("/") + 1);
    this.mapData = this.cache.getTilemapData(this.mapName).data;
    for (tileset of this.mapData.tilesets) {
      this.load.spritesheet(tileset.name, this.mapFolder + tileset.image, tileset.tilewidth, tileset.tileheight, tileset.tilecount, tileset.margin, tileset.spacing);
    }
    for (layer of this.mapData.layers) {
      if (layer.type === "imagelayer") {
        this.load.image(this.mapName + "_" + layer.name, this.mapFolder + layer.image);
      }
    }
    if (this.getProperty("musicKey") && this.getProperty("musicUrl")) {
      this.load.audio(this.getProperty("musicKey"), this.mapFolder + this.getProperty("musicUrl"));
    }
  };

  create() {
    var layer:any,
        object:any,
        tileset:any;
    if (!this.mapName) { return; }
    this.loaded[this.mapName] = true;
    this.world.removeChildren();
    this.game.canvas.style.cursor = "inherit";
    this.game.world.setBounds(0, 0, this.stage.width, this.stage.height);
    this.game.stage.backgroundColor = this.mapData.backgroundcolor;
    this.layers = {};
    this.objectTypes = {};
    this.buttonType = "button";
    this.focusedButton = -1;
    this.map = this.add.tilemap(this.mapName);
    for (tileset of this.mapData.tilesets) {
      this.map.addTilesetImage(tileset.name);
    }
    this.game.world.setBounds(0, 0,
      Math.max(this.world.width,  this.map.widthInPixels),
      Math.max(this.world.height, this.map.heightInPixels)
    );
    for (layer of this.mapData.layers) {
      switch (layer.type) {
        case "imagelayer":
          if (layer.properties && JSON.parse(layer.properties.tiled)) {
            this.layers[layer.name] = this.add.tileSprite(0, 0, this.world.width, this.world.height, this.mapName + "_" + layer.name);
            this.layers[layer.name].tilePosition.set(layer.offsetx, layer.offsety);
          } else {
            this.layers[layer.name] = this.add.sprite(layer.offsetx, layer.offsety, this.mapName + "_" + layer.name);
          }
          this.layers[layer.name].alpha = layer.opacity;
        break;
        case "tilelayer":
          this.map.setCollisionByExclusion([]);
          this.layers[layer.name] = this.map.createLayer(layer.name);
          // this.layers[layer.name].resizeWorld();
        break;
        case "objectgroup":
          for (object of layer.objects) {
            this.addObject(object, layer.name);
          };
        break;
      }
    }
    if (this.getProperty("musicKey")) {
      this.gameApp.playMusic(this.getProperty("musicKey"), this.getProperty("musicVolume"), this.getProperty("musicLoop"));
    }
  };

  update() {
    joypad.update();
    var fb:number = this.focusedButton;
    if (fb > -1) {
      if (Math.round(joypad.x) !== 0 || Math.round(joypad.y) !== 0) {
        this.objectTypes[this.buttonType].getAt(fb).blur();
        if (joypad.deltaDown === 1 || joypad.deltaRight === 1) {
          fb++;
        }
        if (joypad.deltaUp === 1 || joypad.deltaLeft === 1) {
          fb--;
        }
        if (fb >= this.objectTypes[this.buttonType].length) {
          fb = 0;
        }
        if (fb < 0) {
          fb = this.objectTypes[this.buttonType].length-1;
        }
        this.objectTypes[this.buttonType].getAt(fb).focus();
      }
      if (joypad.deltaFire === 1) {
        this.objectTypes[this.buttonType].getAt(fb).push();
      }
      if (joypad.deltaFire === -1) {
        this.objectTypes[this.buttonType].getAt(fb).release();
      }
      this.focusedButton = fb;
    }
    super.update();
  }

  shutdown() {
    super.shutdown();
  }

  addObject(object:any, layerName?:string) {
    var type = object.type || "sprite";
    this.objectType(type, layerName);
    if (this.objectClasses[type] != null) {
      return this.objectTypes[type].add(new this.objectClasses[type](this, object));
    } else if (this.objectClasses["sprite"] != null) {
      return this.objectTypes[type].add(new this.objectClasses["sprite"](this, object));
    }
  }

  objectLayer(layerName:string) {
    if (this.layers[layerName] == null) {
      this.layers[layerName] = this.add.group(this.world, layerName);
    }
    return this.layers[layerName];
  }

  objectType(type:string, layerName="objects") {
    if (this.objectTypes[type] == null) {
      this.objectLayer(layerName);
      this.objectTypes[type] = this.add.group(this.layers[layerName], type);
    }
    return this.objectTypes[type];
  }

  command(command:string, args:any):boolean {
    switch (command) {
      case "url":
        location.assign(args.href || args[0]);
        break;

      case "back":
        history.back();
        break;

      case "state":
        this.game.state.start(args.key || args[0], args.clearWorld, args.clearCache, args.args);
        break;
      
      case "restart":
        this.game.state.restart(args.clearWorld, args.clearCache);
        break;
      
      default:
        console.log("Unknown command:", command, args);
        return false;
    }
    return true;
  }

  getProperty(key: string) {
    if (this.mapData.properties) {
      try {
        return JSON.parse(this.mapData.properties[key]);
      } catch (err) {
        return this.mapData.properties[key];
      }
    }
  }
}
export = MapState;
