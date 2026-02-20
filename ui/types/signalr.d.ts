// declare module '@microsoft/signalr' {
//   export interface HubConnection {
//     on(methodName: string, newMethod: (...args: any[]) => void): void;
//     off(methodName: string, method?: (...args: any[]) => void): void;
//     onclose(callback?: (error?: Error) => void): void;
//     onreconnecting(callback?: (error?: Error) => void): void;
//     onreconnected(callback?: () => void): void;
//     start(): Promise<void>;
//     stop(): Promise<void>;
//     invoke(methodName: string, ...args: any[]): Promise<any>;
//   }

//   export class HubConnectionBuilder {
//     withUrl(url: string, options?: any): HubConnectionBuilder;
//     withAutomaticReconnect(): HubConnectionBuilder;
//     build(): HubConnection;
//   }

//   export {};
// }
