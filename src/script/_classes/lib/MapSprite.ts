/// <reference path="../../_d.ts/phaser/phaser.d.ts"/>
"use strict";
import MapState = require("./MapState");

/**
 * MapSprite class
 *
 * @date 04-06-2016
 */

class MapSprite extends Phaser.Sprite {
  public sfx: Phaser.Sound;

  constructor(public mapState:MapState, public object:any) {
    super(mapState.game, object.x, object.y);
    var tileset:any,
        key:string,
        val:any,
        subkey:string;
    if (this.object.gid != null) {
      for (tileset of this.mapState.mapData.tilesets) {
        if (tileset.firstgid <= this.object.gid) {
          this.loadTexture(tileset.name, this.object.gid - tileset.firstgid);
        }
      }
      this.anchor.set(0, 1);
    }
    this.width = this.object.width;
    this.height = this.object.height;
    this.rotation = this.object.rotation * (Math.PI / 180);
    this.name = this.object.name;

    this.game.physics.enable(this);
    for ( key in this.object.properties ) {
      val = this.getProperty(key);
      if (this.body[key] != null) {
        if ( val instanceof Array ) {
          this.body[key].set.apply(this.body[key], val);
        } else if ( val instanceof Object ) {
          for (subkey in val) {
            this.body[key][subkey] = val[subkey];
          }
        } else {
          this.body[key] = val;
        }
      }
    }
  }

  moveAnchor(x:number, y?:number) {
    this.position.x -= this.width * this.anchor.x;
    this.position.y -= this.height * this.anchor.y;
    this.anchor.set(x, y);
    this.position.x += this.width * this.anchor.x;
    this.position.y += this.height * this.anchor.y;
  }

  getProperty(key:string) {
    if (this.object.properties) {
      try {
        return JSON.parse(this.object.properties[key]);
      } catch(err) {
        return this.object.properties[key];
      }
    }
  }

  playSound(marker?: string, position?: number, loop?: boolean, forceRestart?: boolean) {
    if (this.mapState.gameApp.prefs.get("sfx.enabled")) {
      this.sfx.play(marker, position, this.mapState.gameApp.prefs.get("sfx.volume"), loop, forceRestart);
    }
  }
}
export = MapSprite;
