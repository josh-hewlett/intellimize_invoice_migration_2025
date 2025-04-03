import winston from 'winston';
import path from 'path';

const logger = {
    info: (message: string, ...args: any[]) => {
        console.log(message, ...args);
    },
    error: (message: string, ...args: any[]) => {
        console.error(message, ...args);
    }
}

export { logger };
