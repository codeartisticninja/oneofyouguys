/// <reference path="../../_d.ts/phaser/phaser.d.ts"/>
"use strict";
import MapState     = require("./MapState");
import StorageFile  = require("./StorageFile");


/**
 * MapButton class
 *
 * @date 07-06-2016
 */

class MapButton extends Phaser.Button {
  public command:string;
  public arguments:any;
  public file:StorageFile;
  private _firstFrame:number;
  private _adjusting=false;

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
    if (["delete", "set", "setStr", "setInt", "setFloat", "toggle", "adjust"].indexOf(this.command) !== -1) {
      this.file = new StorageFile(this.arguments.file||this.arguments[0]);
      if (this.command === "toggle" && this.file.get(this.arguments.key || this.arguments[1])) {
        this._firstFrame += 3;
        this.frame = this._firstFrame;
      }
      if (this.command === "adjust") {
        this.scale.x = 1;
        this.setSlider(this.file.get(this.arguments.key || this.arguments[1]));
        this.input.enableDrag();
      }
    }
    this.onInputOut.add(this.blur, this);
    this.onInputOver.add(this.focus, this);
    this.onInputDown.add(this.push, this);
    this.onInputUp.add(this.release, this);
  }

  update() {
    if (this.command === "adjust") {
      this.setSlider(this.clamp(this.readSlider(), this.arguments.min, this.arguments.max));
    }
  }

  blur() {
    this.mapState.focusedButton = -1;
    this.frame = this._firstFrame + 0;
    if (this.command === "adjust") {
      this.setSlider(this.file.get(this.arguments.key || this.arguments[1]));
    }
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
  	var val:any;
    if (this.frame == this._firstFrame + 2) {
      if (this.file) {
        switch (this.command) {
          case "delete":
            this.file.delete();
            break;
          
          case "set":
            val = this.arguments.value || this.arguments[2];
            this.file.set(this.arguments.key || this.arguments[1], val);
            break;
          
          case "setStr":
            val = prompt(this.arguments.prompt, this.file.get(this.arguments.key || this.arguments[1]));
            this.file.set(this.arguments.key || this.arguments[1], val);
            break;
          
          case "setInt":
            val = parseInt(prompt(this.arguments.prompt, this.file.get(this.arguments.key || this.arguments[1])));
            val = Math.round(this.clamp(val, this.arguments.min, this.arguments.max, this.arguments.step));
            this.file.set(this.arguments.key || this.arguments[1], val);
            break;
          
          case "setFloat":
            val = parseFloat(prompt(this.arguments.prompt, this.file.get(this.arguments.key || this.arguments[1])));
            val = this.clamp(val, this.arguments.min, this.arguments.max, this.arguments.step);
            this.file.set(this.arguments.key || this.arguments[1], val);
            break;
          
          case "toggle":
            val = !(this.file.get(this.arguments.key || this.arguments[1]));
            this.file.set(this.arguments.key || this.arguments[1], val);
            if (this.file.get(this.arguments.key || this.arguments[1])) {
              this._firstFrame += 3;
            } else {
              this._firstFrame -= 3;
            }
            break;
          
          case "adjust":
            val = this.readSlider();
            val = this.clamp(val, this.arguments.min, this.arguments.max, this.arguments.step);
            this.file.set(this.arguments.key || this.arguments[1], val);
            this.setSlider(val);
            break;
          
          default:
            val = JSON.parse(prompt(this.arguments.prompt, this.file.get(this.arguments.key || this.arguments[1])));
            val = this.clamp(val, this.arguments.min, this.arguments.max, this.arguments.step);
            this.file.set(this.arguments.key || this.arguments[1], val);
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

  setSlider(val:number) {
    var perc = (val-this.arguments.min) / (this.arguments.max - this.arguments.min);
    this.position.x = this.object.x + perc*this.object.width;
    this.position.y = this.object.y;
  }

  readSlider() {
    var perc = (this.position.x-this.object.x)/this.object.width;
    return this.arguments.min + perc*(this.arguments.max-this.arguments.min);
  }

  clamp(val:number, min:number, max:number, step?:number) {
    if (typeof step === "number") {
      val = Math.round(val/step)*step;
    }
    if (typeof min === "number") {
      val = Math.max(val, min);
    }
    if (typeof max === "number") {
      val = Math.min(val, max);
    }
    return val;
  }
}
export = MapButton;
