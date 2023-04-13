import { CommandType } from "../Types/CommandType";

export interface ICommand {
    CommandType: CommandType;
    Data: any;
    Valid: boolean;
    execute(): void;
}