/// <reference path="../../_d.ts/node.d.ts"/>
"use strict";
import url = require("url");

/**
 * StorageFile class
 * 
 * @date 23-04-2016
 */

class StorageFile {
  public url:string;
  public storage:Storage;

  constructor(uri:string, public data={}) {
    this.url = url.resolve(location.pathname, uri);
    if (this.url.indexOf("#") === -1) {
      this.storage = localStorage;
    } else {
      this.storage = sessionStorage;
    }
    this.load();
  }

  load() {
    if (this.storage.getItem(this.url)) {
      try {
        this.data = JSON.parse(this.storage.getItem(this.url));
      } catch (err) {
        this.data = this.storage.getItem(this.url);
      }
    }
    return this.data;
  }

  save(data?:any) {
    if (data !== undefined) {
      this.data = data;
    }
    return this.storage.setItem(this.url, JSON.stringify(this.data));
  }

  delete(data={}) {
    this.data = data;
    this.storage.removeItem(this.url);
  }

  get(key:string) {
    this.load();
    return this.data[key];
  }

  set(key:string, value:any) {
    this.data[key] = value
    return this.save();
  }

  list() {
    var list:string[] = [], i:number, key:string;
    for (i = 0; i < this.storage.length; i++) {
      key = this.storage.key(i);
      if (key.substr(0, this.url.length) === this.url) {
        key = key.substr(this.url.length);
        if (key.indexOf("/") !== -1) {
          key = key.substr(0, key.indexOf("/")+1);
        }
        if (key.indexOf("#") !== -1) {
          key = key.substr(0, key.indexOf("#")+1);
        }
        if (list.indexOf(key) === -1) {
          list.push(key);
        }
      }
    }
    return list;
  }

  open(uri:string) {
    return new StorageFile(url.resolve(this.url, uri));
  }
}
export = StorageFile;
