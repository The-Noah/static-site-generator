import {IUtils} from "../lib.js";

import * as _fs from "fs";

import fs from "./fs.js";
import path from "./path.js";

const recurseDirectory = async (dir: string, fileCallback?: (filePath: string) => void, directoryCallback?: (dirPath: string) => void): Promise<void> => {
  for(const file of fs.readdirSync(dir)){
    const currentPath = path.join(dir, file);

    if(fs.isDirectory(currentPath)){
      if(directoryCallback){
        directoryCallback(currentPath);
      }

      recurseDirectory(currentPath, fileCallback, directoryCallback);
    }else if(fileCallback){
      fileCallback(currentPath);
    }
  }
};

const deleteDirectory = (dir: string): void => {
  const dirsToRemove: string[] = [];

  recurseDirectory(dir, (file) => {
    _fs.unlinkSync(file);
  }, (_dir) => {
    dirsToRemove.push(_dir);
  });

  for(const dirToRemove of dirsToRemove){
    _fs.rmdirSync(dirToRemove);
  }

  _fs.rmdirSync(dir);
};

const copyDirectory = (source: string, target: string): void => {
  if(!fs.existsSync(target)){
    fs.mkdirSync(target);
  }

  recurseDirectory(source, (file) => {
    fs.copyFileSync(file, path.join(target, file.split(source)[1]));
  }, (dir) => {
    const newDir = path.join(target, dir.split(source)[1]);

    if(!fs.existsSync(newDir)){
      fs.mkdirSync(newDir);
    }
  });
};

export default {
  recurseDirectory,
  deleteDirectory,
  copyDirectory
} as IUtils;
