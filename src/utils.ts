import * as fs from "fs";
import * as path from "path";

/**
 * Calls fileCallback for each file in the directory and subdirectories, and directoryCallback for each directory.
 * @param dir - Path of directory to recurse
 * @param fileCallback - File callback
 * @param directoryCallback - Directory callback
 */
export const recurseDirectory = async (dir: string, fileCallback?: (filePath: string) => void, directoryCallback?: (dirPath: string) => void): Promise<void> => {
  for(const file of fs.readdirSync(dir)){
    const currentPath = path.join(dir, file);

    if(fs.lstatSync(currentPath).isDirectory()){
      if(directoryCallback){
        directoryCallback(currentPath);
      }

      recurseDirectory(currentPath, fileCallback, directoryCallback);
    }else if(fileCallback){
      fileCallback(currentPath);
    }
  }
};

/**
 * Delete a directory recursively
 * @param dir - Path of directory to delete
 */
export const deleteDirectory = (dir: string): void => {
  const dirsToRemove: string[] = [];

  recurseDirectory(dir, (file) => {
    fs.unlinkSync(file);
  }, (_dir) => {
    dirsToRemove.push(_dir);
  });

  for(const dirToRemove of dirsToRemove){
    fs.rmdirSync(dirToRemove);
  }

  fs.rmdirSync(dir);
};

/**
 * Copy a directory recursively
 * @param source - Path of directory you wish to copy
 * @param target - Target path for copied directory
 */
export const copyDirectory = (source: string, target: string): void => {
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
