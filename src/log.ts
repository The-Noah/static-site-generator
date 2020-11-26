/**
 * Logging interface
 */
export interface ILogger{
  /**
   * @property Level of logging to display
   */
  level: number;
  /**
   * @param message - Message to display
   */
  info: (message: any) => void;
  /**
   * @param message - Message to display
   */
  success: (message: any) => void;
  /**
   * @param message - Message to display
   */
  error: (message: any) => void;
  /**
   * @param message - Message to display
   */
  warn: (message: any) => void;
}

const RESET = "\x1b[0m";

/**
 * Provides a basic implementation of ILogger
 */
class Logger implements ILogger{
  level: number = 0;
  /**
   * Output information
   * @param message - Output
   */
  info(message: any): void{
    if(this.level > 0){
      return;
    }

    console.log(`[\x1b[36mi${RESET}]`, message);
  }

  /**
   * Output a success
   * @param message - Output
   */
  success(message: any): void{
    if(this.level > 1){
      return;
    }

    console.log(`[\x1b[32m+${RESET}]`, message);
  }

  /**
   * Output an error
   * @param message - Output
   */
  error(message: any): void{
    if(this.level > 2){
      return;
    }

    console.error(`[\x1b[31m-${RESET}]`, message);
  }

  /**
   * Output a warning
   * @param message - Output
   */
  warn(message: any): void{
    if(this.level > 3){
      return;
    }

    console.log(`[\x1b[33m!${RESET}]`, message);

  }
}

const logger = new Logger();
export default logger;
