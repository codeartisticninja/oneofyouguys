/// <reference path="../../_d.ts/phaser/phaser.d.ts"/>
"use strict";
import MapSprite = require("../lib/MapSprite");
import MapState  = require("../lib/MapState");
import joypad    = require("../lib/joypad");

/**
 * Text class
 */

class Text extends MapSprite {
  public print:Phaser.RetroFont;
  public device="input";

  constructor(mapState:MapState, object:any) {
    super(mapState, object);
    this.scale.set(this.getProperty("scale")||1);
    this.print = this.game.add.retroFont("font", 32, 32, Phaser.RetroFont.TEXT_SET1.trim(), 96, 4, 4, 4, 4);
    this.print.autoUpperCase = false;
    this.print.multiLine = true;
    if (this.getProperty("center")) {
      this.print.align = Phaser.RetroFont.ALIGN_CENTER;
    }
    this.setTexture(this.print);
    
    this.body.immovable = true;
    this.body.enable = false;
  }

  update() {
    super.update();
    if (joypad.device !== this.device) {
      var text = this.getProperty("text");
      if (typeof text === "string") {
        this.print.text = this.wordWrap(text, this.getProperty("cols"));
      } else {
        switch (joypad.device) {
          case "touch":
            this.print.text = this.wordWrap(text[1], this.getProperty("cols"));
            break;
          
          case "gamepad":
            this.print.text = this.wordWrap(text[2], this.getProperty("cols"));
            break;
          
          default:
            this.print.text = this.wordWrap(text[0], this.getProperty("cols"));
            break;
        }
      }
      this.device = joypad.device;
    }
  }

  wordWrap(txt: string, width=24): string {
    var lines = txt.split("\n"),
      out = "";
    for (var line of lines) {
      var words = line.split(" "),
        pos = 0;
      for (var word of words) {
        if (pos + word.length + 1 > width) {
          out += "\n" + word;
          pos = word.length;
        } else {
          out += " " + word;
          pos += word.length + 1;
        }
      }
      out += "\n";
    }
    return out.trim();
  }

}
export = Text;
