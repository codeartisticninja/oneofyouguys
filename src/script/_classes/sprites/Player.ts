/// <reference path="../../_d.ts/phaser/phaser.d.ts"/>
"use strict";
import GameState  = require("../states/GameState");
import MapSprite = require("../lib/MapSprite");
import joypad    = require("../lib/joypad");
import Doodle    = require("./Doodle");

/**
 * Player class
 */

class Player extends MapSprite {
  public withinGrasp:Doodle;
  public withinGraspDist:number;
  public grasp:Doodle;

  constructor(mapState:GameState, object:any) {
    super(mapState, object);
    this.tint = 0xFF9700;
    this.moveAnchor(.5, 1);
    this.body.setSize(32, 32);
    this.animations.add("idle", [0], 15, true);
    this.animations.add("walk", [1, 2, 3, 4, 5, 6, 7, 8], 15, true);
    console.log(this.mapState.mapName);
    if (this.mapState.mapName === "home_map" && (<GameState>this.mapState).playerPosition) {
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
    if (joypad.deltaFire === 1) {
      if (this.grasp) {
        this.putDown();
      } else if (this.withinGrasp) {
        this.pickUp();
      }
    }
    if (joypad.deltaB === -1) {
      this.putDown();
    }

    // Animation
    if (len) {
      this.animations.play("walk");
      this.animations.currentAnim.speed = len * 12;
    } else {
      this.animations.play("idle");
    }
    if (this.grasp && len) {
      this.grasp.position.copyFrom(this.position);
      this.grasp.position.add(this.scale.x*32, 0);
    }
    if (joypad.x > 0) {
      this.scale.set(1, 1);
    } else if (joypad.x < 0) {
      this.scale.set(-1, 1);
    }
  }

  pickUp(graspable=this.withinGrasp) {
    var scale:number;
    if (this.grasp || !graspable) {
      return this.grasp;
    }
    this.grasp = graspable;
    this.withinGrasp = null;
    if (this.grasp) {
      this.grasp.body.enable = false;
      this.grasp.bringToTop();
      scale = 32/this.grasp.width;
      this.game.add.tween(this.grasp.scale).to( { x: scale, y: scale }, 1000, Phaser.Easing.Exponential.Out, true);
      this.game.add.tween(this.grasp.position).to( { x: this.position.x, y: this.position.y }, 100, "Linear", true);
    }
    return graspable;
  }

  putDown(graspable=this.grasp) {
    if (graspable) {
      graspable.body.enable = true;
      this.game.add.tween(graspable.scale).to({ x: 1, y: 1 }, 1000, Phaser.Easing.Exponential.Out, true);
      this.game.add.tween(graspable.position).to({
        x: Math.round(graspable.position.x / 32) * 32,
        y: Math.round(graspable.position.y / 32) * 32
      }, 1000, Phaser.Easing.Exponential.Out, true);
      this.mapState.objectTypes["doodle"].sort("y");
      if (this.grasp === graspable) {
        this.grasp = null;
      }
      return true;
    }
    return false;
  }

  copyGrasp() {
    var source:Doodle,
        dest:Doodle;
    if (this.grasp) {
      source = this.grasp;
    } else if (this.withinGrasp) {
      source = this.withinGrasp;
    } else {
      return false;
    }
    dest = this.mapState.addObject(JSON.parse(JSON.stringify(source.object)));
    dest.position.copyFrom(source.position);
    dest.scale.copyFrom(source.scale);
    if (this.grasp) {
      this.putDown(dest);
    } else {
      this.pickUp(dest);
    }
  }
}
export = Player;
