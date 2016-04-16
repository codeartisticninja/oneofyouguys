/// <reference path="../../_d.ts/phaser/phaser.d.ts"/>
"use strict";
import GameState  = require("../states/GameState");
import MapSprite = require("../lib/MapSprite");
import joypad    = require("../lib/joypad");

/**
 * Player class
 */

class Player extends MapSprite {
  constructor(mapState:GameState, object:any) {
    super(mapState, object);
    this.tint = 0xFF9700;
    this.moveAnchor(.5, 1);
    if ((<GameState>this.mapState).playerPosition) {
      this.position.copyFrom((<GameState>this.mapState).playerPosition);
    }
    (<GameState>this.mapState).playerPosition = this.position;

    joypad.start();
  }

  update() {
    var len:number;
    super.update();
    len = Math.sqrt(Math.pow(Math.abs(joypad.x), 2) + Math.pow(Math.abs(joypad.y), 2));
    this.body.velocity.x = joypad.x * 128;
    this.body.velocity.y = joypad.y * 128;

  }

}
export = Player;
