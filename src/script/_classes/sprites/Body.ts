/// <reference path="../../_d.ts/phaser/phaser.d.ts"/>
"use strict";
import GameState  = require("../states/GameState");
import MapSprite = require("../lib/MapSprite");
import joypad    = require("../lib/joypad");

/**
 * Body class
 */

class Body extends MapSprite {
  public gun:Phaser.Particles.Arcade.Emitter;
  public possesed:boolean;

  constructor(mapState:GameState, object:any) {
    super(mapState, object);
    var chans = Phaser.ArrayUtils.shuffle([0, 1, 2]);
    var tint=0;
    for (var chan of chans) {
      tint *= 256;
      switch (chan) {
        case 0:
          tint += 127;
          break;
        case 1:
          tint += Math.floor(Math.random()*127)+127;
          break;
        case 2:
          tint += 255;
          break;
      }
    }
    this.tint = tint;
    this.moveAnchor(.5, 1);
    this.possesed = !!(this.getProperty("possesed"));

    this.body.setSize(16, 32);
    this.scale.set(2);
    this.body.bounce.set(.1);

    this.animations.add("idle",   [0], 15, true);
    this.animations.add("walk",   [0, 1, 2, 1]), 6, true;
    this.animations.add("die",    [0, 1, 2, 3, 4, 5, 6, 7, 8], 15, false);
    this.animations.add("revive", [8, 7, 6, 5, 4, 3, 2, 1, 0], 15, false);

    this.mapState.addObjectType("bullet").add(this.gun = this.game.add.emitter(this.x, this.y, 10));
    this.gun.gravity = -2048;
    this.gun.setScale(.25, .25, .25, .25);
    this.gun.minParticleScale =
    this.gun.maxParticleScale = .25;
    this.gun.makeParticles("swatches_32x32", 2);

    this.body.velocity.x = Math.random() * 100;
    joypad.start();
  }

  update() {
    super.update();
    var dir = this.scale.x / Math.abs(this.scale.x);
    if (this.possesed) {
      this.body.velocity.x = joypad.x * 128;
      if (joypad.x < 0) {
        this.scale.x = -Math.abs(this.scale.x);
      } 
      if (joypad.x > 0) {
        this.scale.x = Math.abs(this.scale.x);
      } 

      if (joypad.deltaUp === 1) {
        this.body.velocity.y = -600;
      }
      if (joypad.deltaA === 1) {
        this.fire();
      }
    } else if (this.alive) {
      if (this.body.onWall()) {
        if (dir > 0) {
          this.scale.x = -Math.abs(this.scale.x);
          this.body.velocity.x = -64;
          this.body.velocity.x -= 64 * Math.random();
          if (this.body.onFloor()) {
            this.body.velocity.y = -600;
          }
        } else {
          this.scale.x = Math.abs(this.scale.x);
          this.body.velocity.x = 64;
          this.body.velocity.x += 64 * Math.random();
          if (this.body.onFloor()) {
            this.body.velocity.y = -600;
          }
        }
      }
    }

    if (this.y > this.game.world.height*2) {
      this.y = 0;
      this.body.velocity.y = -100 * Math.random();
    }
  }

  fire() {
    // this.gun.position.copyFrom(this.position);
    var dir = this.scale.x / Math.abs(this.scale.x);
    this.gun.x = this.x;
    this.gun.y = this.y - this.height/2;
    this.gun.setXSpeed(1600*dir, 1600*dir);
    this.gun.start(true, 1000, null, 1);
  }

  kill() {
    super.kill();
    this.exists =
    this.visible = true;
    this.possesed = false;
    this.play("die");
    this.body.velocity.set(0);
    return this;
  }

  revive(health=1) {
    super.revive(health);
    var _this = this;
    setTimeout(function(){
      _this.possesed = true;
    }, 100);
    (<GameState>this.mapState).leadingCamera.subject = this;
    this.play("revive");
    return this;
  }

}
export = Body;
