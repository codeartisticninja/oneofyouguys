/// <reference path="../_d.ts/phaser/phaser.d.ts"/>
"use strict";
import BaseGameApp  = require("./lib/BaseGameApp");
import MapState = require("./lib/MapState");
import GameState = require("./states/GameState");

/**
 * GameApp class
 */

class GameApp extends BaseGameApp {
  constructor(containerId: string, fullScreen?: boolean) {
    super(containerId, fullScreen);
    var maps = [ "start", "lose", "win" ];
    for (var i in maps) {
      this.eng.state.add(maps[i] + "_state", new GameState(this, maps[i] + "_map", "assets/maps/" + maps[i] + ".json"));
    }
    maps = [ "tutorial", "friends", "spies", "tower", "test" ];
    for (var i in maps) {
      this.eng.state.add(maps[i] + "_room", new GameState(this, maps[i] + "_map", "assets/maps/" + maps[i] + ".json"));
    }

    this.hashChange();
  }

  hashChange() {
    var hash = location.hash.replace("#", "");
    switch (hash) {
      case "game":
        this.gotoRoom(this.saveFile.get("room") || "tutorial");
        break;

      case "test":
        this.gotoRoom("test");
        break;

      case "lose":
        this.eng.state.start("lose_state");
        break;

      default:
        this.eng.state.start("start_state");
        break;
    }
  }

  gotoRoom(roomName: string) {
    if (this.eng.state.checkState(roomName + "_room")) {
      this.eng.state.start(roomName + "_room");
      this.saveFile.set("room", roomName);
    } else {
      this.endGame(true);
    }
  }

  endGame(win: boolean) {
    if (win) {
      this.eng.state.start("win_state");
      this.saveFile.set("room", null);
    } else {
      location.assign("#lose");
    }
  }

}
export = GameApp;
