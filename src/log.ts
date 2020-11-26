import {isTemplateLiteral} from "typescript";
import {inherits} from "util";

export interface ILogger{
  level: number;
  info: (message: any) => void;
  success: (message: any) => void;
  error: (message: any) => void;
  warn: (message: any) => void;
}

const RESET = "\x1b[0m";
class Logger implements ILogger{
  level: number = 0;

  info(message: any): void{
    if(this.level > 0){
      return;
    }

    console.log(`[\x1b[36mi${RESET}]`, message);
  };

  success(message: any): void{
    if(this.level > 1){
      return;
    }

    console.log(`[\x1b[32m+${RESET}]`, message);
  };

  error(message: any): void{
    if(this.level > 2){
      return;
    }

    console.error(`[\x1b[31m-${RESET}]`, message);
  };

  warn(message: any): void{
    if(this.level > 3){
      return;
    }

    console.log(`[\x1b[33m!${RESET}]`, message);
  };
};

const logger = new Logger();
export default logger;
