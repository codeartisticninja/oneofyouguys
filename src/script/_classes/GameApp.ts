/// <reference path="../_d.ts/phaser/phaser.d.ts"/>
"use strict";
import MapState  = require("./lib/MapState");
import GameState = require("./states/GameState");


/**
 * GameApp class
 */

class GameApp {
  public eng:Phaser.Game;
  public container:HTMLElement;
  public currentLevel:number;

  constructor(containerId:string, fullScreen?:boolean) {
    var maps:string[];
    this.container = document.getElementById(containerId);
    this.eng = new Phaser.Game(800, 450, Phaser.AUTO, containerId);
    this.eng.antialias = false;
    if (fullScreen) {
      setTimeout(this._initFS.bind(this), 256);
    }
    window.addEventListener("hashchange", this._hashChange.bind(this));

    this.currentLevel = 0;
    maps = [ "start", "end" ];
    for (var i in maps) {
      this.eng.state.add(maps[i] + "_state", new MapState(this, maps[i] + "_map", "assets/maps/" + maps[i] + ".json"));
    }
    maps = [ "home", "play", "art", "sound" ];
    for (var i in maps) {
      this.eng.state.add(maps[i] + "_room", new GameState(this, maps[i] + "_map", "assets/maps/" + maps[i] + ".json"));
    }

    this._hashChange();
  }

  goFullScreen() {
    this.eng.scale.startFullScreen();
  }

  gotoRoom(roomName:string) {
    this.eng.state.start(roomName+"_room");
  }

  endGame() {
    var maps = ["home", "play", "art", "sound" ];
    for(var map of maps) {
      this.eng.state.states[map+"_room"].playerPosition = null;
    }
    this.eng.state.start("end_state");
  }

  /**
   * Privates
   */
  private _cursorTO:any;

  private _initFS() {
    var btn = document.createElement("button");
    btn.classList.add("fs");
    btn.setAttribute("title", "Full screen");
    btn.textContent = "Full screen";
    btn.addEventListener("click", this.goFullScreen.bind(this));
    this.container.appendChild(btn);
    btn.focus();

    this._hideCursor = this._hideCursor.bind(this);
    this.container.addEventListener("mousemove", this._wakeCursor.bind(this));

    this.eng.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    this.eng.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
    // this.eng.scale.setResizeCallback(this._scaleDown, this);
  }

  private _scaleDown(scale:Phaser.ScaleManager, parentBounds:Phaser.Rectangle) {
    if (scale.isFullScreen) {
      return;
    }
    var factorX = parentBounds.width / scale.game.width;
    var facterY = parentBounds.height / scale.game.height;
    var factor = Math.min(1, factorX, facterY);
    scale.setUserScale(factor, factor);
    console.log(factor);
  }

  private _wakeCursor() {
    clearTimeout(this._cursorTO);
    this.container.style.cursor = "auto";
    this._cursorTO = setTimeout(this._hideCursor, 500);
  }

  private _hideCursor() {
    this.container.style.cursor = "none";
  }

  private _hashChange() {
    var hash = location.hash.replace("#", "");
    switch (hash) {
      case "game":
        this.gotoRoom("home");
        break;
      
      default:
        this.eng.state.start("start_state");
        break;
    }
  }
}
export = GameApp;