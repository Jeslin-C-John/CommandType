export abstract class ClientBase {
    name: string;
    clientID: string;
    GroupName: string;
    ClientSocket: any;
    constructor(name: string) {
        this.name = name;
    }
} 