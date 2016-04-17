/// <reference path="../../_d.ts/phaser/phaser.d.ts"/>
"use strict";
import GameApp       = require("../GameApp");
import MapState      = require("../lib/MapState");
import MapSprite     = require("../lib/MapSprite");
import LeadingCamera = require("../lib/LeadingCamera");

import Body          = require("../sprites/Body");

/**
 * GameState class
 */
class GameState extends MapState {
  public leadingCamera:LeadingCamera;
  public playerPosition:Phaser.Point;

  constructor(gameApp:GameApp, mapName?:string, _url?:string) {
    super(gameApp, mapName, _url);
    this.objectClasses["body"] = Body;
  }

  preload() {
    super.preload();
  }

  create() {
    super.create();

    this.physics.startSystem(Phaser.Physics.ARCADE);
    this.physics.arcade.gravity.y = 2048;
    this.leadingCamera = new LeadingCamera(this.objectTypes["body"].getAt(0));

    this._timeInRoom = 0;
  }

  update() {
    super.update();
    this.leadingCamera.update();
    this.game.physics.arcade.collide(this.objectTypes["body"], this.layers["tiles"]);
    this.game.physics.arcade.overlap(this.objectTypes["body"], this.addObjectType("goal"), this._bodyMeetsGoal, null, this);
    this.game.physics.arcade.overlap(this.objectTypes["bullet"], this.objectTypes["body"], this._bulletMeetsBody, null, this);
    this.game.physics.arcade.overlap(this.objectTypes["body"], this.objectTypes["body"], this._bodyMeetsBody, null, this);
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
    console.log(body, goal);
    body.scale.set(10);
    goal.scale.set(10);
    // this.gameApp.endGame();
  }

  private _bulletMeetsBody(bullet:Phaser.Particles.Arcade.Emitter, body:Body) {
    console.log("hit!");
    if (body.alive && !body.possesed) {
      bullet.kill();
      body.damage(.3);
    }
  }

  private _bodyMeetsBody(body1:Body, body2:Body) {
    if (this.joypad.deltaB === 1 && body1.possesed && !body2.alive) {
      body2.revive(body1.health);
      body1.kill();
    }
  }

}
export = GameState;
