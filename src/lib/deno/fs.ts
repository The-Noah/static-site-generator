import {IFS} from "../lib.ts";

const readTextFileSync = (filePath: string): string => Deno.readTextFileSync(filePath);

const writeTextFileSync = (path: string, text: string): void => {
  const encoder = new TextEncoder();
  Deno.writeFileSync(path, encoder.encode(text));
};

const mkdirSync = (path: string): void => Deno.mkdirSync(path);

const existsSync = (filePath: string): boolean => {
  try{
    Deno.lstatSync(filePath);
    return true;
  }catch(err){
    if(err instanceof Deno.errors.NotFound){
      return false;
    }

    throw err;
  }
};

const readdirSync = (dir: string): string[] => {
  const paths: string[] = [];

  for(const _dir of Deno.readDirSync(dir)){
    paths.push(_dir.name);
  }

  return paths;
};

const isDirectory = (path: string): boolean => Deno.lstatSync(path).isDirectory;

const copyFileSync = (from: string, to: string): void => Deno.copyFileSync(from, to);

const watch = async (path: string, callback: () => void): Promise<void> => {
  const watcher = Deno.watchFs(path);
  for await(const event of watcher){
    callback();
  }
};

export default {
  readTextFileSync,
  writeTextFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
  isDirectory,
  copyFileSync,
  watch
} as IFS;
