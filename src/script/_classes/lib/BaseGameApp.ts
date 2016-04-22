/// <reference path="../../_d.ts/phaser/phaser.d.ts"/>
"use strict";
import GameState = require("../states/GameState");

/**
 * BaseGameApp class
 * 
 * @date 22-04-2016
 */

class BaseGameApp {
  public eng:Phaser.Game;
  public container:HTMLElement;
  public currentLevel:number;
  public music:Phaser.Sound;
  public loadedAll=false;

  constructor(containerId:string, fullScreen?:boolean) {
    var maps:string[];
    this.container = document.getElementById(containerId);
    this.eng = new Phaser.Game(800, 450, Phaser.AUTO, containerId);
    this.eng.antialias = false;
    if (fullScreen) {
      setTimeout(this._initFS.bind(this), 256);
    }
    window.addEventListener("hashchange", this.hashChange.bind(this));

  }

  hashChange() {
    // TODO
  }

  goFullScreen() {
    this.eng.scale.startFullScreen();
  }

  loadAllStates() {
    if (this.loadedAll) return;
    for (var stateName in this.eng.state.states) {
      if (stateName !== this.eng.state.current) {
        this.loadedAll = true;
        this.eng.state.states[stateName].preload(false);
      }
    }
  }

  playMusic(key:string, volume=.5, loop=true) {
    if (!this.music) {
      this.music = this.eng.add.sound(null);
    }
    this.music.volume = volume;
    this.music.loop = loop;
    if (this.music.key !== key) {
      this.music.stop();
    }
    if (this.eng.cache.checkSoundKey(key) && !this.music.isPlaying) {
      this.music.key = key;
      this.music.play();
    }
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

  private _wakeCursor() {
    clearTimeout(this._cursorTO);
    this.container.style.cursor = "auto";
    this._cursorTO = setTimeout(this._hideCursor, 500);
  }

  private _hideCursor() {
    this.container.style.cursor = "none";
  }

}
export = BaseGameApp;
