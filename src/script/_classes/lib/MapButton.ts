/// <reference path="../../_d.ts/phaser/phaser.d.ts"/>
"use strict";
import MapState = require("./MapState");

/**
 * MapButton class
 *
 * @date 15-04-2016
 */

class MapButton extends Phaser.Button {
  public command:string;
  public arguments:any;
  private _firstFrame:number;

  constructor(public mapState:MapState, public object:any) {
    super(mapState.game, object.x, object.y);
    var tileset:any,
        key:string,
        val:any,
        subkey:string;
    if (this.object.gid != null) {
      for (tileset of this.mapState.mapData.tilesets) {
        if (tileset.firstgid <= this.object.gid) {
          this._firstFrame = this.object.gid - tileset.firstgid;
          this.loadTexture(tileset.name, this._firstFrame);
        }
      }
      this.anchor.set(0, 1);
    }
    this.width = this.object.width;
    this.height = this.object.height;
    this.rotation = this.object.rotation * (Math.PI / 180);
    this.name = this.object.name;

    this.command = this.object.properties.command;
    try {
      this.arguments = JSON.parse(this.object.properties.arguments);
    } catch (err) {
      this.arguments = this.object.properties.arguments;
    }
    if (typeof this.arguments !== "object") {
      this.arguments = [this.arguments];
    }

    if (JSON.parse(this.object.properties.autofocus || "false")) {
      mapState.buttonType = this.object.type;
      val = mapState.objectTypes[this.mapState.buttonType].length;
      setTimeout((function(){
        this.focus();
        mapState.focusedButton = val;
        mapState.joypad.start();
      }).bind(this), 256);
    }
    this.onInputOut.add(this.blur, this);
    this.onInputOver.add(this.focus, this);
    this.onInputDown.add(this.push, this);
    this.onInputUp.add(this.release, this);
  }

  blur() {
    this.mapState.focusedButton = -1;
    this.frame = this._firstFrame + 0;
  }

  focus() {
    if (this.mapState.focusedButton > -1) {
      this.mapState.objectTypes[this.mapState.buttonType].getAt(this.mapState.focusedButton).blur();
    }
    this.frame = this._firstFrame + 1;
  }

  push() {
    this.focus();
    this.frame = this._firstFrame + 2;
  }

  release() {
  	var args:any;
    if (this.frame == this._firstFrame + 2) {
      this.mapState.command(this.command, this.arguments);
      if (this.mapState.focusedButton === -1) {
        this.blur();
      } else {
        this.focus();
      }
    }
  }
}
export = MapButton;
