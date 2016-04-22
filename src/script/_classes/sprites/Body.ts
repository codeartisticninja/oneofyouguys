/// <reference path="../../_d.ts/phaser/phaser.d.ts"/>
"use strict";
import GameState  = require("../states/GameState");
import MapSprite = require("../lib/MapSprite");
import joypad    = require("../lib/joypad");

/**
 * Body class
 */

class Body extends MapSprite {
  public jumps:number;
  public gun:Phaser.Particles.Arcade.Emitter;
  public possessed:boolean;
  public clan:string;
  public traitor=false;
  public sfx:Phaser.Sound;
  public inSight:Body;
  public carry:Body;

  constructor(mapState:GameState, object:any) {
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
    this.moveAnchor(.5, 1);
    this.possessed = !!(this.getProperty("possessed"));

    this.body.setSize(16, 32);
    this.scale.set(2);
    this.body.bounce.set(.1);

    this.animations.add("idle",   [0], 15, true);
    this.animations.add("walk",   [0, 1, 2, 1]), 6, true;
    this.animations.add("die",    [0, 1, 2, 3, 4, 5, 6, 7, 8], 15, false);
    this.animations.add("revive", [8, 7, 6, 5, 4, 3, 2, 1, 0], 15, false);

    this.sfx = this.game.add.audio("body_sfx");
    this.sfx.addMarker("jump",   0.0, 0.25);
    this.sfx.addMarker("fire",   0.5, 0.25);
    this.sfx.addMarker("damage", 1.0, 0.25);
    this.sfx.addMarker("posses", 1.5, 1.8);

    this.mapState.objectType("bullet").add(this.gun = this.game.add.emitter(this.x, this.y, 10));
    this.gun["owner"] = this;
    this.gun.gravity = -2048;
    this.gun.setScale(.25, .25, .25, .25);
    this.gun.minParticleScale =
    this.gun.maxParticleScale = .25;
    this.gun.makeParticles("swatches_32x32", 2, 10, true);

    this.body.velocity.x = 50 + Math.random() * 50;
    joypad.start();
  }

  update() {
    super.update();
    var dir = this.scale.x / Math.abs(this.scale.x);
    if (this.body.onFloor()) {
      this.jumps = 1;
    }

    this.inSight = null;
    if (this.alive && !this.possessed) {
      this.mapState.objectTypes["body"].forEachAlive(function(other:Body){
        if (other === this) return;
        if (Math.abs(this.y - other.y) < 32) {
          if (other.traitor && Math.abs(this.x - other.x) < 400) {
            this.trator = false;
            if (dir < 0 && other.x > this.x) {
              dir = 1;
              this.scale.x = Math.abs(this.scale.x);
              this.body.velocity.x = 128 * Math.random();
              if (this.body.onFloor()) {
                this.jump();
              }
            }
            if (dir > 0 && other.x < this.x) {
              dir = -1;
              this.scale.x = -Math.abs(this.scale.x);
              this.body.velocity.x = -128 * Math.random();
              if (this.body.onFloor()) {
                this.jump();
              }
            }
          }
          if (Math.abs(this.x - other.x) < (this.inSight ? Math.abs(this.x - this.inSight.x) : 200)) {
            if (dir < 0 && other.x < this.x) {
              this.inSight = other;
            }
            if (dir > 0 && other.x > this.x) {
              this.inSight = other;
            }
          }
        }
      }, this);
    }

    if (this.possessed) {
      this.body.velocity.x = joypad.x * 256;
      if (joypad.x < 0) {
        this.scale.x = -Math.abs(this.scale.x);
      } 
      if (joypad.x > 0) {
        this.scale.x = Math.abs(this.scale.x);
      } 

      if (joypad.deltaUp === 1) {
        this.jump();
      }
      if (joypad.deltaA === 1) {
        this.fire();
      }
      if (joypad.b) {
        this.possess();
      }
    } else if (this.alive) {
      if (this.body.onWall()) {
        if (dir > 0) {
          this.scale.x = -Math.abs(this.scale.x);
          this.body.velocity.x = -64;
          this.body.velocity.x -= 64 * Math.random();
        } else {
          this.scale.x = Math.abs(this.scale.x);
          this.body.velocity.x = 64;
          this.body.velocity.x += 64 * Math.random();
        }
      }
      if (this.inSight) {
        if (this.inSight.traitor) {
          if (Math.random() < (5 / 60)) this.fire();
        }
        if (this.clan === "orange" && this.inSight.clan === "purple") {
          if (Math.random() < (1 / 60)) this.fire();
        }
        if (this.clan === "green" && this.inSight.clan === "orange") {
          if (Math.random() < (1.5 / 60)) this.fire();
        }
        if (this.clan === "purple" && this.inSight.clan === "green") {
          if (Math.random() < (2 / 60)) this.fire();
        }
      }
    } else if (this.carry) {
      this.position.set(this.carry.x, this.carry.y-this.carry.height);
      this.body.velocity.set(0);
    }

    if (this.y > this.game.world.height*2) {
      this.y = 0;
      this.body.velocity.y = -100 * Math.random();
    }
  }

  jump() {
    if (this.jumps > 0) {
      this.jumps--;
      this.body.velocity.y = -650;
      this.sfx.play("jump");
    }
  }

  fire() {
    if (this.carry) return this.drop();
    var dir = this.scale.x / Math.abs(this.scale.x);
    this.gun.x = this.x;
    this.gun.y = this.y - this.height/2;
    this.gun.setXSpeed(1600*dir, 1600*dir);
    this.gun.start(true, 200, null, 1);
    this.sfx.play("fire");
  }

  kill(pos=false) {
    super.kill();
    if (this.carry && !this.carry.alive) {
      this.drop();
    }
    if (this.possessed && !pos) {
      setTimeout(() => {
        this.mapState.gameApp.endGame(false);
      }, 1024);
    };
    this.exists =
    this.visible = true;
    this.possessed =
    this.traitor = false;
    this.play("die");
    this.body.velocity.set(0);
    return this;
  }

  revive(health=1) {
    super.revive(health);
    setTimeout(() => {
      if (this.alive) {
        this.possessed = true;
      } else {
        this.mapState.gameApp.endGame(false);
      }
    }, 1000);
    (<GameState>this.mapState).leadingCamera.subject = this;
    this.play("revive");
    return this;
  }

  drop() {
    if (this.carry) {
      var carry = this.carry;
      this.carry = null;
      carry.drop();
    }
  }

  pickup(carry:Body) {
    if (this.carry !== carry) {
      this.drop();
      this.carry = carry;
      carry.pickup(this);
    }
  }

  possess() {
    if (!this.possessed) return;
    if (!this.carry) return;
    this.carry.revive();
    this.kill(true);
    this.sfx.play("posses");
  }

}
export = Body;
