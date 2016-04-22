/// <reference path="../../_d.ts/phaser/phaser.d.ts"/>
"use strict";
import GameApp       = require("../GameApp");
import MapState      = require("../lib/MapState");
import MapSprite     = require("../lib/MapSprite");
import LeadingCamera = require("../lib/LeadingCamera");

import Body          = require("../sprites/Body");
import Text          = require("../sprites/Text");
import Door          = require("../sprites/Door");

/**
 * GameState class
 */
class GameState extends MapState {
  public leadingCamera:LeadingCamera;

  constructor(gameApp:GameApp, mapName?:string, _url?:string) {
    super(gameApp, mapName, _url);
    this.eng.antialias = false;
    this.objectClasses["body"] = Body;
    this.objectClasses["text"] = Text;
    this.objectClasses["door"] = Door;
  }

  preload(showProgress=true) {
    if (this.loaded) return;
    super.preload(showProgress);
    this.eng.load.audio("body_sfx", "./assets/sfx/body.ogg");
    this.eng.load.image("font", "./assets/gfx/VictoriaBold.png");
  }

  create() {
    super.create();

    this.physics.startSystem(Phaser.Physics.ARCADE);
    this.physics.arcade.gravity.y = 2048;
    this.leadingCamera = new LeadingCamera(this.objectTypes["body"].getAt(0), 160, 0, 6);

    this._timeInRoom = 0;
  }

  update() {
    super.update();
    this.leadingCamera.update();
    this.game.physics.arcade.collide(this.objectType("body"), this.layers["tiles"]);
    this.game.physics.arcade.collide(this.objectType("door"), this.layers["tiles"]);
    this.game.physics.arcade.collide(this.objectType("goal"), this.layers["tiles"]);
    this.game.physics.arcade.overlap(this.objectType("body"), this.objectType("goal"), this._bodyMeetsGoal, null, this);
    this.game.physics.arcade.overlap(this.objectType("bullet"), this.objectType("body"), this._bulletMeetsBody, null, this);
    this.game.physics.arcade.overlap(this.objectType("body"), this.objectType("body"), this._bodyMeetsBody, null, this);
    this.game.physics.arcade.overlap(this.objectType("body"), this.objectType("door"), this._bodyMeetsDoor, null, this);
    this._timeInRoom++;
  }

  command(command:string, args:any):boolean {
    switch (command) {
      case "noop":
        // code
        break;
      
      default:
        return super.command(command, args);
    }
    return true;
  }

  shutdown() {
    this.physics.arcade.gravity.y = 0;
    return super.shutdown();
  }

  /**
   * Privates
   */
  private _timeInRoom=0;

  private _bodyMeetsGoal(body:Body, goal:MapSprite) {
    if (body.possessed) {
      if (goal.getProperty("destination")) {
        this.gameApp.gotoRoom(goal.getProperty("destination"));
      } else {
        this.gameApp.endGame(true);
      }
    }
  }

  private _bulletMeetsBody(bullet:Phaser.Particle, body:Body) {
    var attacker = bullet.parent["owner"];
    if (body === attacker) return;
    if (body.alive) {
      bullet.kill();
      body.damage(.34);
      body.sfx.play("damage");
      
      if (attacker.clan === "orange") {
        attacker.traitor = body.clan !== "purple";
      }
      if (attacker.clan === "green") {
        attacker.traitor = body.clan !== "orange";
      }
      if (attacker.clan === "purple") {
        attacker.traitor = body.clan !== "green";
      }
      if (body.traitor) {
        attacker.traitor = false;
      }
    }
  }

  private _bodyMeetsBody(body1:Body, body2:Body) {
    if (body1 === body2) return;
    if (!body1.alive && !body2.alive) {
      var dist = body1.x - body2.x + Math.random();
      body1.x += dist / Math.abs(dist);
    }
    if (body1.possessed && !body2.alive) {
      if (this.joypad.deltaB === 1) {
        body1.pickup(body2);
      }
    }
  }

  private _bodyMeetsDoor(body:Body, door:Door) {
    if (!body.alive) return;
    if (body.clan !== door.clan) {
      // body.kill();
      this.physics.arcade.collide(body, door);
    }
  }

}
export = GameState;
