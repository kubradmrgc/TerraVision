import {
  HubConnection,
  HubConnectionBuilder,
  HttpTransportType,
  LogLevel
} from '@microsoft/signalr';

export interface BuildHubConnectionOptions {
  hubUrl: string;
  transport: HttpTransportType;
  getAccessToken: () => string | null | Promise<string | null>;
  /** When omitted, uses SignalR default automatic reconnect schedule. */
  automaticReconnectDelays?: readonly number[];
  registerHandlers: (connection: HubConnection) => void;
}

export function buildHubConnection(options: BuildHubConnectionOptions): HubConnection {
  let builder = new HubConnectionBuilder()
    .withUrl(options.hubUrl, {
      accessTokenFactory: async () => {
        const token = await options.getAccessToken();
        return token ?? '';
      },
      transport: options.transport
    })
    .configureLogging(LogLevel.Warning);

  if (options.automaticReconnectDelays !== undefined) {
    builder = builder.withAutomaticReconnect([...options.automaticReconnectDelays]);
  } else {
    builder = builder.withAutomaticReconnect();
  }

  const connection = builder.build();
  options.registerHandlers(connection);
  return connection;
}
