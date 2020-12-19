export interface IUtils{
  /**
 * Calls fileCallback for each file in the directory and subdirectories, and directoryCallback for each directory.
 * @param dir - Path of directory to recurse
 * @param fileCallback - File callback
 * @param directoryCallback - Directory callback
 */
  recurseDirectory: (dir: string, fileCallback?: (filePath: string) => void, directoryCallback?: (dirPath: string) => void) => Promise<void>;
  /**
   * Delete a directory recursively
   * @param dir - Path of directory to delete
   */
  deleteDirectory: (dir: string) => void;
  /**
   * Copy a directory recursively
   * @param source - Path of directory you wish to copy
   * @param target - Target path for copied directory
   */
  copyDirectory: (source: string, target: string) => void;
}

export interface IFS{
  /**
   * Reads file in as string
   * @param filePath Path of file to read
   */
  readTextFileSync: (filePath: string) => string;
  /**
   * Writes `text` to a file as a string
   * @param path Path of file to write
   * @param text String to write
   */
  writeTextFileSync: (path: string, text: string) => void;
  /**
   * Creates directory at `path`
   * @param path Path to directory to create
   */
  mkdirSync: (path: string) => void;
  /**
   * Checks if the specified path exists
   * @param filePath Path to check
   */
  existsSync: (filePath: string) => boolean;
  /**
   * Get all items in directory
   * @param dir Path to directory
   */
  readdirSync: (dir: string) => string[];
  /**
   * Check if path is a directory
   * @param path Path to check
   */
  isDirectory: (path: string) => boolean;
  /**
   * Copies file from `from` to `to`
   * @param from Path of file to copy
   * @param to Destination path
   */
  copyFileSync: (from: string, to: string) => void;
  /**
   * Watches `path` and all subdirectories, and calls `callback` on any event
   * @param path Path to watch
   * @param callback Callback on event
   */
  watch: (path: string, callback: () => void) => Promise<void>;
}

export interface IPath{
  join: (...paths: string[]) => string;
  parse: (p: string) => any;
  resolve: (...pathSegments: string[]) => string;
  cwd: () => string;
}

export interface IWebSocketServer{
  start: (port: number) => void;
  send: (message: string) => void;
}

export interface ILib{
  utils: IUtils;
  fs: IFS;
  path: IPath;
  wss: IWebSocketServer;
  /**
   * Parses `file` and returns JSON object
   * @param file File to parse
   */
  yaml: (file: string) => any;
  /**
   * Compresses HTML
   * @param text HTML to minify
   * @param compressionLevel Amount to compress HTML
   */
  htmlMinifier: (text: string, compressionLevel: number) => string;
}
