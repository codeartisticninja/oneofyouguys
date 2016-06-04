/// <reference path="../../_d.ts/phaser/phaser.d.ts"/>
"use strict";
import MapState     = require("./MapState");
import StorageFile  = require("./StorageFile");


/**
 * MapButton class
 *
 * @date 03-06-2016
 */

class MapButton extends Phaser.Button {
  public command:string;
  public arguments:any;
  public file:StorageFile;
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

    this.command = this.getProperty("command");
    this.arguments = this.getProperty("arguments");
    if (typeof this.arguments !== "object") {
      this.arguments = [this.arguments];
    }

    if (this.getProperty("autofocus")) {
      mapState.buttonType = this.object.type;
      val = mapState.objectTypes[this.mapState.buttonType].length;
      setTimeout((function(){
        this.focus();
        mapState.focusedButton = val;
        mapState.joypad.start();
      }).bind(this), 256);
    }
    if (["setStr", "setInt", "setFloat", "toggle", "adjust"].indexOf(this.command) !== -1) {
      this.file = new StorageFile(this.arguments.file||this.arguments[0]);
      if (this.command === "toggle" && this.file.get(this.arguments.key || this.arguments[1])) {
        this._firstFrame += 3;
        this.frame = this._firstFrame;
      }
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
      if (this.file) {
        switch (this.command) {
          case "setStr":
            this.file.set(this.arguments.key || this.arguments[1], prompt(this.arguments.prompt, this.file.get(this.arguments.key || this.arguments[1])));
            break;
          
          case "setInt":
            this.file.set(this.arguments.key || this.arguments[1], parseInt(prompt(this.arguments.prompt, this.file.get(this.arguments.key || this.arguments[1]))));
            break;
          
          case "setFloat":
            this.file.set(this.arguments.key || this.arguments[1], parseFloat(prompt(this.arguments.prompt, this.file.get(this.arguments.key || this.arguments[1]))));
            break;
          
          case "toggle":
            this.file.set(this.arguments.key || this.arguments[1], !(this.file.get(this.arguments.key || this.arguments[1])));
            if (this.file.get(this.arguments.key || this.arguments[1])) {
              this._firstFrame += 3;
            } else {
              this._firstFrame -= 3;
            }
            break;
          
          default:
            this.file.set(this.arguments.key || this.arguments[1], JSON.parse(prompt(this.arguments.prompt, this.file.get(this.arguments.key || this.arguments[1]))));
            break;
        }
      }
      this.mapState.command(this.command, this.arguments);
      if (this.mapState.focusedButton === -1) {
        this.blur();
      } else {
        this.focus();
      }
    }
  }

  getProperty(key: string) {
    if (this.object.properties) {
      try {
        return JSON.parse(this.object.properties[key]);
      } catch (err) {
        return this.object.properties[key];
      }
    }
  }
}
export = MapButton;
