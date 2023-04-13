import { ClientBase } from './Abstracts/ClientBase'

export class BrowserClient implements ClientBase {
    ClientSocket: any;
    GroupName: string;
    name: string;
    clientID: string;
}