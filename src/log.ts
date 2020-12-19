/**  Logging interface */
export interface ILogger{
  /** Level of logging to display */
  level: number;
  /**
   * Output information
   * @param message - Message to display
   */
  info: (message: any) => void;
  /**
   * Output a success
   * @param message - Message to display
   */
  success: (message: any) => void;
  /**
   * Output an error
   * @param message - Message to display
   */
  error: (message: any) => void;
  /**
   * Output a warning
   * @param message - Message to display
   */
  warn: (message: any) => void;
}

const RESET = "\x1b[0m";

/** Provides a basic implementation of ILogger */
class Logger implements ILogger{
  level: number = 0;

  info(message: any): void{
    if(this.level > 0){
      return;
    }

    console.log(`[\x1b[36mi${RESET}]`, message);
  }

  success(message: any): void{
    if(this.level > 1){
      return;
    }

    console.log(`[\x1b[32m+${RESET}]`, message);
  }

  error(message: any): void{
    if(this.level > 2){
      return;
    }

    console.error(`[\x1b[31m-${RESET}]`, message);
  }

  warn(message: any): void{
    if(this.level > 3){
      return;
    }

    console.log(`[\x1b[33m!${RESET}]`, message);
  }
}

const logger = new Logger();
export default logger;
