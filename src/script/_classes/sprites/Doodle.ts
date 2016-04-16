/// <reference path="../../_d.ts/phaser/phaser.d.ts"/>
"use strict";
import MapState  = require("../lib/MapState");
import MapSprite = require("../lib/MapSprite");


/**
 * Doodle class
 */

class Doodle extends MapSprite {
  constructor(mapState:MapState, object:any) {
    super(mapState, object);
    this.moveAnchor(.5);

    if (this.getProperty("variants")) {
      this.frame = <number>this.frame + Math.floor(Math.random() * JSON.parse(this.getProperty("variants")));
    }
  }
}
export = Doodle;
