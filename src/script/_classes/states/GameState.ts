/// <reference path="../../_d.ts/phaser/phaser.d.ts"/>
"use strict";
import GameApp       = require("../GameApp");
import MapState      = require("../lib/MapState");
import MapSprite     = require("../lib/MapSprite");
import LeadingCamera = require("../lib/LeadingCamera");
import Player        = require("../sprites/Player");
import Doodle        = require("../sprites/Doodle");
import Character     = require("../sprites/Character");

/**
 * GameState class
 */
class GameState extends MapState {
  public leadingCamera:LeadingCamera;
  public playerPosition:Phaser.Point;

  constructor(gameApp:GameApp, mapName?:string, _url?:string) {
    super(gameApp, mapName, _url);
    this.objectClasses["player"]    = Player;
    this.objectClasses["doodle"]    = Doodle;
    this.objectClasses["character"] = Character;
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
    this.game.physics.arcade.collide(this.objectTypes["player"], this.objectTypes["border"]);
    // this.game.physics.arcade.collide(this.objectTypes["doodle"], this.objectTypes["doodle"]);
    // this.game.physics.arcade.collide(this.objectTypes["player"], this.layers["tiles"]);
    /* this.objectTypes["player"].forEach(function(player:Player){
      player.withinGrasp = null;
      player.withinGraspDist = 1024;
    });
    this.game.physics.arcade.overlap(this.objectTypes["doodle"], this.objectTypes["doodle"], this._doodleMeetsDoodle, null, this); */
    this.game.physics.arcade.overlap(this.objectTypes["player"], this.objectTypes["goal"], this._playerMeetsGoal, null, this);
    this.game.physics.arcade.overlap(this.objectTypes["player"], this.objectTypes["door"], this._playerMeetsDoor, null, this);
    this.game.physics.arcade.collide(this.objectTypes["player"], this.objectTypes["door"]);
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

  private _playerMeetsDoor(player:Player, door:MapSprite) {
    if (this._timeInRoom < 10) {
      this._timeInRoom = 0;
    } else {
      this.gameApp.gotoRoom(door.getProperty("destination"));
    }
  }

  private _playerMeetsDoodle(player:Player, doodle:Doodle) {
    var dist = player.position.distance(doodle.position);
    if (dist < player.withinGraspDist) {
      player.withinGrasp = doodle;
      player.withinGraspDist = dist;
    }
  }

  private _doodleMeetsDoodle(doodle1:Doodle, doodle2:Doodle) {
    var doodle3:Doodle;
    if (doodle1 === doodle2) {
      return;
    }
    if (doodle1.getProperty("reaction") === "erase") {
      this.game.add.tween(doodle2.scale).to({
        x: 0, y: 0
      }, 1000, Phaser.Easing.Exponential.Out, true);
      setTimeout(function(){
        doodle2.destroy();
      }, 2000);
    }
    if (doodle1.getProperty("reaction") === "copy") {
      doodle3 = this.addObject(JSON.parse(JSON.stringify(doodle2.object)));
      doodle3.position.copyFrom(doodle2.position);
      doodle1.object.properties.reaction += "-";
      doodle2.object.properties.reaction += "-";
      doodle3.object.properties.reaction += "-";
      this.game.add.tween(doodle2.position).to({
        x: doodle1.x - 128
      }, 1000, Phaser.Easing.Exponential.Out, true);
      this.game.add.tween(doodle3.position).to({
        x: doodle1.x + 128
      }, 1000, Phaser.Easing.Exponential.Out, true);
      setTimeout(function() {
        doodle1.object.properties.reaction = doodle1.object.properties.reaction.replace("-", "");
        doodle2.object.properties.reaction = doodle2.object.properties.reaction.replace("-", "");
        doodle3.object.properties.reaction = doodle3.object.properties.reaction.replace("-", "");
      }, 2000);
    }
  }

}
export = GameState;
