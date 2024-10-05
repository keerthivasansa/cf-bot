type Job = () => void;

export class QueuedTasker {
    tasks: Job[];
    __lastExecTime: number;
    sleepTime: number;
    currTimer: NodeJS.Timer | null;

    constructor(sleepTime: number) {
        this.sleepTime = sleepTime;
        this.tasks = [];
    }

    add(job: Job) {
        this.tasks.push(job);
        if (!this.currTimer)
            this.__tick();
    }

    __tick() {
        const date = Date.now();
        const diff = this.__lastExecTime + this.sleepTime - date;

        if (diff > 0) {
            this.currTimer = setTimeout(() => this.__tick(), diff);
            return;
        }

        if (this.tasks.length) {
            const job = this.tasks.shift()!;
            job();
        }

        this.__lastExecTime = date;
        this.currTimer = null;

        if (this.tasks.length)
            this.__tick();
    }

    __destroy() {
        if (this.currTimer)
            clearTimeout(this.currTimer);
    }

    waitForRelease() {
        return new Promise((res, rej) => this.add(() => res(0)));
    }
}