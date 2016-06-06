/// <reference path="../../_d.ts/phaser/phaser.d.ts"/>
"use strict";
import StorageFile = require("./StorageFile");

/**
 * BaseGameApp class
 * 
 * @date 06-06-2016
 */

class BaseGameApp {
  public eng:Phaser.Game;
  public container:HTMLElement;
  public musicTracks = {};
  public currentMusicTrack:string;
  public music:HTMLMediaElement;
  public loadedAll=false;
  public saveFile = new StorageFile("save.json");
  public prefs = new StorageFile("/prefs.json");
  public history:string[] = [];


  constructor(containerId:string, fullScreen?:boolean) {
    var maps:string[];
    this.container = document.getElementById(containerId);
    this.eng = new Phaser.Game(800, 450, Phaser.AUTO, containerId);
    if (fullScreen) {
      setTimeout(this._initFS.bind(this), 256);
    }
    window.addEventListener("hashchange", this.hashChange.bind(this));

    this.prefs.onSet("music", () => {
      if (this.music) {
        if (this.prefs.get("music.enabled") && this.prefs.get("music.volume")) {
          this.music.muted = false;
          this.music.volume = this.prefs.get("music.volume");
          this.music.play();
        } else {
          this.music.pause();
        }
      }
    });
    this.prefs.set("music.enabled", true, true);
    this.prefs.set("music.volume", 0.5, true);
    this.prefs.set("sfx.enabled", true, true);
    this.prefs.set("sfx.volume", 1, true);

    setTimeout(()=>{
      this.hashChange();
    });
  }

  hashChange() {
    var hash = location.hash.replace("#", ""),
        state = this.eng.state.current;
    if (location.search === "?debug") {
      if (hash) {
        state = hash;
      } else {
        state = "start_state";
      }
    } else {
      if (this.history.length === 0) {
        return this.goTo("start_state");
      }
      while (hash.length < this.history.length) {
        this.history.pop();
      }
      state = this.history[this.history.length-1];
    }
    if (state !== this.eng.state.current) {
      this.eng.state.start(state);
    }
  }

  setHash() {
    var hash = location.hash.replace("#", "");
    if (location.search === "?debug") {
      hash = this.eng.state.current;
    } else {
      while (hash.length < this.history.length) {
        hash += hash.charAt(0) || "~";
      }
      hash = hash.substr(0, this.history.length);
    }
    if (location.hash.replace("#", "") === hash) {
      this.hashChange();
    } else {
      location.hash = hash;
    }
  }

  goBack() {
    history.back();
  }

  goTo(state:string) {
    var back = 0;
    if (location.search === "?debug") {
      location.assign("#"+state);
    } else {
      if (this.history.indexOf(state) === -1) {
        this.history.push(state);
        this.setHash();
      } else {
        while (this.history[this.history.length - 1] !== state) {
          this.history.pop();
          back--;
        }
        history.go(back);
      }
    }
  }

  switchTo(state:string) {
    if (location.search === "?debug") {
      location.replace("#"+state);
    } else {
      this.history.pop();
      this.goTo(state);
    }
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

  loadMusic(key:string, url:string) {
    this.musicTracks[key] = new Audio(url);
    if (!this.prefs.get("music.enabled")) {
      this.musicTracks[key].preload = "none";
      this.musicTracks[key].muted = true;
    }
    this.musicTracks[key].addEventListener("stalled", () => {
      if (this.musicTracks[key].currentTime > 1) {
        this.musicTracks[key].muted = true;
      }
    });
    this.musicTracks[key].addEventListener("canplaythrough", () => {
      this.musicTracks[key].muted = false;
    });
    this.musicTracks[key].addEventListener("error", () => {
      if (this.musicTracks[key].src.indexOf(".ogg") !== -1) {
        this.musicTracks[key].src = this.musicTracks[key].src.replace(".ogg", ".mp3");
      }
    });
  }

  playMusic(key:string, loop=true, volume=this.prefs.get("music.volume")) {
    if (!this._addedMusicEvents) {
      this.eng.onPause.add(this._onPause, this);
      this.eng.onResume.add(this._onResume, this);
      this._addedMusicEvents = true
    };
    if (this.music && this.currentMusicTrack !== key) {
      this.music.pause();
      this.music.currentTime = 0;
    }
    this.music = this.musicTracks[this.currentMusicTrack = key];
    if (!this.music) return;
    if (!this.prefs.get("music.enabled")) return;
    if (!volume) return;
    this.music.volume = volume;
    this.music.loop = loop;
    if (this.music.paused) {
      this.music.play();
      if(this.music.paused) {
        var cb = () => {
          this.music.play();
          document.body.removeEventListener("touchstart", cb);
        };
        document.body.addEventListener("touchstart", cb);
      }
    }
  }

  /**
   * Privates
   */
  private _cursorTO:any;
  private _addedMusicEvents=false;

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

  private _onPause() {
    if (this.music) this.music.pause();
  }

  private _onResume() {
    if (this.music && this.prefs.get("music.enabled")) this.music.play();
  }

}
export = BaseGameApp;
