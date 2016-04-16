"use strict";
import GameApp  = require("./_classes/GameApp");
import joypad   = require("./_classes/lib/joypad");

/**
 * main.ts
 * Main script for Shapeshift
 */
var game: GameApp,
    gameContainer: HTMLElement,
    information: HTMLElement;

function init() {
  if (location.search !== "?debug") {
    location.assign("#start");
  }
  gameContainer = document.getElementById("game");
  information = document.getElementsByTagName("article")[0];
  toggleInfo();

  document.body.addEventListener("touchstart", setJoypad);
  // window.addEventListener("scroll", fixScroll);
  game = window["game"] = new GameApp("game", true);
  _initInfo();
}

function setJoypad(e:TouchEvent) {
  if (e.target === game.eng.canvas) {
    joypad.resume();
  } else if (e.target === information) {
    joypad.suspend();
  } else if (e.target instanceof HTMLButtonElement) {
    joypad.suspend();
  }
};

function toggleInfo() {
  gameContainer.classList.toggle("hidden");
  information.classList.toggle("hidden");
}

function _initInfo() {
  var btn:HTMLElement;
  
  btn = document.createElement("button");
  btn.classList.add("info");
  btn.setAttribute("title", "Information");
  btn.textContent = "Information";
  btn.addEventListener("click", toggleInfo);
  gameContainer.appendChild(btn);

  btn = document.createElement("button");
  btn.classList.add("play");
  btn.setAttribute("title", "Play");
  btn.textContent = "Play";
  btn.addEventListener("click", toggleInfo);
  information.appendChild(btn);
}

if (location.search === "?nojs") {
  let tags = document.getElementsByTagName("noscript");
  for (let i = 0; i < tags.length; i++) {
    let tag = document.createElement("span");
    tag.classList.add("noscript");
    tag.innerHTML = tags[i].innerHTML;
    tags[i].parentElement.insertBefore(tag, tags[i]);
  }
} else {
  addEventListener("DOMContentLoaded", init);
}
