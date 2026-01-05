export class RunnerException extends Error {
    public name: string;
    public message: string;
    public cause: any;

    constructor(name: string, message: string, cause?: any) {
        super();

        this.name = name;
        this.message = message;
        this.cause = cause;
        
        Object.setPrototypeOf(this, RunnerException.prototype);
    }
}