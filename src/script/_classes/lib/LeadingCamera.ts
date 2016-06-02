/// <reference path="../../_d.ts/phaser/phaser.d.ts"/>
"use strict";

/**
 * LeadingCamera class
 *
 * @date 02-06-2016
 */

class LeadingCamera {
  public camera:Phaser.Camera;

  private _lastPos:Phaser.Point;
  private _current:Phaser.Point;
  private _subjectCenter:Phaser.Point;
  private _speed:Phaser.Point;
  private _direction:Phaser.Point;

  constructor(public subject: Phaser.Sprite, public xSight?:number, public ySight?:number, public xSpeed=2, public ySpeed=xSpeed) {
    // super(subject.game, subject.game.camera.id, subject.game.camera.x, subject.game.camera.y, subject.game.camera.width, subject.game.camera.height);
    this.camera = this.subject.game.camera;
    if (this.xSight == null) {
      this.xSight = this.camera.width/5;
    }
    if (this.ySight == null) {
      this.ySight = this.camera.height/5;
    }
    this._lastPos       = new Phaser.Point(this.subject.x, this.subject.y);
    this._current       = new Phaser.Point(this.subject.x, this.subject.y);
    this._subjectCenter = new Phaser.Point(this.subject.x, this.subject.y);

    this._speed = new Phaser.Point(0, 0);
    this._direction = new Phaser.Point(0, 0);
  }

  update() {
    if (this.subject) {
      this._direction.copyFrom(this.subject.position);
      this._direction.subtract(this._lastPos.x, this._lastPos.y);
      this._subjectCenter.set((this.subject.left + this.subject.right) / 2, (this.subject.top + this.subject.bottom) / 2);
      this._current.clampX(this._subjectCenter.x - this.xSight, this._subjectCenter.x + this.xSight);
      this._current.clampY(this._subjectCenter.y - this.ySight, this._subjectCenter.y + this.ySight); 
      this._lastPos.copyFrom(this.subject.position);
    }

    if (Math.abs(this._speed.x) < Math.abs(this._direction.x*this.xSpeed)) {
      this._speed.x = this._direction.x * this.xSpeed;
    } else {
      this._speed.x *= .97;
    }
    if (Math.abs(this._speed.y) < Math.abs(this._direction.y*this.ySpeed)) {
      this._speed.y = this._direction.y * this.ySpeed;
    } else {
      this._speed.y *= .97;
    }

    this._current.add(this._speed.x, this._speed.y);
    this.camera.focusOnXY(this._current.x, this._current.y);
  }

  follow(subject:Phaser.Sprite) {
    this.subject = subject;
    if (this.subject) {
      this._lastPos.copyFrom(this.subject.position);
    } else {
      this._speed.set(0);
      this._direction.set(0);
    }
  }
}

export = LeadingCamera;
