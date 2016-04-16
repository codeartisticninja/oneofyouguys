/// <reference path="../../_d.ts/phaser/phaser.d.ts"/>
"use strict";

/**
 * LeadingCamera class
 *
 * @date 15-04-2016
 */

class LeadingCamera {
  public camera:Phaser.Camera;

  private _lastPos:Phaser.Point;
  private _current:Phaser.Point;
  private _target:Phaser.Point;
  private _speed:Phaser.Point;
  private _direction:Phaser.Point;

  constructor(public subject: Phaser.Sprite, public xSight?:number, public ySight?:number) {
    // super(subject.game, subject.game.camera.id, subject.game.camera.x, subject.game.camera.y, subject.game.camera.width, subject.game.camera.height);
    this.camera = this.subject.game.camera;
    if (this.xSight == null) {
      this.xSight = this.camera.width/5;
    }
    if (this.ySight == null) {
      this.ySight = this.camera.height/5;
    }
    this._lastPos = new Phaser.Point(this.subject.x, this.subject.y);
    this._current = new Phaser.Point(this.subject.x, this.subject.y);
    this._target = new Phaser.Point(this.subject.x, this.subject.y);

    this._speed = new Phaser.Point(0, 0);
    this._direction = new Phaser.Point(0, 0);
  }

  update() {
    this._direction.copyFrom(this.subject.position);
    this._direction.subtract(this._lastPos.x, this._lastPos.y);

    /* if (this._direction.getMagnitude()) {
      this._direction.setMagnitude(this.xSight);
      this._direction.y *= this.xSight?(this.ySight/this.xSight):0;
      this._target.copyFrom(this.subject.position);
      this._target.add(this._direction.x, this._direction.y);
      this._target.subtract((this.subject.anchor.x-.5)*this.subject.width, (this.subject.anchor.y-.5)*this.subject.height);
    } */

    this._target.add(this._direction.x*2, this._direction.y*2);
    this._target.clampX(this.subject.position.x-this.xSight, this.subject.position.x+this.xSight);
    this._target.clampY(this.subject.position.y-this.ySight, this.subject.position.y+this.ySight);
    this._target.clampX(this.camera.bounds.left+this.camera.width/2,  this.camera.bounds.right -this.camera.width/2);
    this._target.clampY(this.camera.bounds.top +this.camera.height/2, this.camera.bounds.bottom-this.camera.height/2);

    if (this._target.x > this._current.x) {
      this._speed.x = Math.min(this._speed.x + .03, (this._target.x-this._current.x)*.05);
    }
    if (this._target.y > this._current.y) {
      this._speed.y = Math.min(this._speed.y + .03, (this._target.y-this._current.y)*.05);
    }
    if (this._target.x < this._current.x) {
      this._speed.x = Math.max(this._speed.x - .03, (this._target.x-this._current.x)*.05);
    }
    if (this._target.y < this._current.y) {
      this._speed.y = Math.max(this._speed.y - .03, (this._target.y-this._current.y)*.05);
    }

    this._lastPos.copyFrom(this.subject.position);
    this._current.add(this._speed.x, this._speed.y);
    this.camera.focusOnXY(this._current.x, this._current.y);
  }

  focusOn(p:Phaser.Point) {
    this._target.copyFrom(p);
    this._lastPos.copyFrom(this.subject.position);
  }
}

export = LeadingCamera;
