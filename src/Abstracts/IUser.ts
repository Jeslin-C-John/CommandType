export interface IUser {
    name: string;
    email: string;
    password: string;
    isPasswordRequired: boolean;
    clientID: string;
    groupName: string;
    profile: {
        imagUrl: string;
        thumbNailUrl: string;
    };
    allowMultiple: boolean;
    sessionID:string;
    sessions: [{
        validAt: Date;
    }]
}