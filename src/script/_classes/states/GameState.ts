/// <reference path="../../_d.ts/phaser/phaser.d.ts"/>
"use strict";
import GameApp       = require("../GameApp");
import MapState      = require("../lib/MapState");
import MapSprite     = require("../lib/MapSprite");
import LeadingCamera = require("../lib/LeadingCamera");
import Player        = require("../sprites/Player");

/**
 * GameState class
 */
class GameState extends MapState {
  public leadingCamera:LeadingCamera;
  public playerPosition:Phaser.Point;

  constructor(gameApp:GameApp, mapName?:string, _url?:string) {
    super(gameApp, mapName, _url);
    this.objectClasses["player"]    = Player;
  }

  preload() {
    super.preload();
  }

  create() {
    super.create();

    this.physics.startSystem(Phaser.Physics.ARCADE);
    this.leadingCamera = new LeadingCamera(this.objectTypes["player"].getAt(0));
    this._timeInRoom = 0;
  }

  update() {
    super.update();
    this.leadingCamera.update();
    this.game.physics.arcade.collide(this.objectTypes["player"], this.layers["tiles"]);
    this.game.physics.arcade.overlap(this.objectTypes["player"], this.objectTypes["goal"], this._playerMeetsGoal, null, this);
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

  /**
   * Privates
   */
  private _timeInRoom=0;

  private _playerMeetsGoal(player:Player, goal:MapSprite) {
    this.gameApp.endGame();
  }

}
export = GameState;
