/// <reference path="../../_d.ts/phaser/phaser.d.ts"/>
"use strict";
import MapState  = require("../lib/MapState");
import MapSprite = require("../lib/MapSprite");


/**
 * Character class
 */

class Character extends MapSprite {
  public diaFont:Phaser.RetroFont;
  public diaImg:Phaser.Image;

  constructor(mapState:MapState, object:any) {
    super(mapState, object);
    this.moveAnchor(.5);
    this.diaFont = this.game.add.retroFont("font", 32, 32, Phaser.RetroFont.TEXT_SET2, 8);
    this.diaImg  = this.game.add.image(this.x-256, this.y+128, this.diaFont);
    this.diaFont.multiLine = true;
    this.diaFont.text = this.wordWrap(this.getProperty("dialog"));
  }

  update() {
    if (this.inCamera) {

    }
  }

  wordWrap(txt:string, width=16):string {
    var words = txt.split(" "),
        out = "", pos=0;
    for (var word of words) {
      if (pos+word.length+1 > width) {
        out += "\n" + word;
        pos = word.length;
      } else {
        out += " " + word;
        pos += word.length+1;
      }
    }
    return out.trim();
  }
}
export = Character;
