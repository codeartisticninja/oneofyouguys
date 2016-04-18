/// <reference path="../../_d.ts/phaser/phaser.d.ts"/>
"use strict";
import MapSprite = require("../lib/MapSprite");
import MapState  = require("../lib/MapState");

/**
 * Door class
 */

class Door extends MapSprite {
  public clan:string;

  constructor(mapState:MapState, object:any) {
    super(mapState, object);
    this.clan = this.getProperty("clan") || Phaser.ArrayUtils.getRandomItem(["orange", "green", "purple"]);
    switch (this.clan) {
      case "orange":
        this.tint = 0xFF9200;
        break;
      case "green":
        this.tint = 0x74FF00;
        break;
      case "purple":
        this.tint = 0x6E01FF;
        break;
    }
    this.body.immovable = true;
  }

}
export = Door;
