// Lightweight mongoose typings to avoid pulling full schema generics during REST build.
export interface ConnectOptions {
    uri?: string;
    dbName?: string;
    user?: string;
    pass?: string;
    authSource?: string;
    authMechanism?: string;
    auth?: {
        username?: string;
        password?: string;
    };
    replicaSet?: string;
    ssl?: boolean;
    tls?: boolean;
    tlsCAFile?: string;
    tlsCertificateKeyFile?: string;
    tlsAllowInvalidCertificates?: boolean;
    readPreference?: string;
    connectTimeoutMS?: number;
    serverSelectionTimeoutMS?: number;
    socketTimeoutMS?: number;
    maxPoolSize?: number;
    minPoolSize?: number;
    heartbeatFrequencyMS?: number;
    w?: string | number;
    wtimeoutMS?: number;
    j?: boolean;
    retryWrites?: boolean;
    compressors?: string[];
    [key: string]: unknown;
}

export interface Mongoose {
    models: Record<string, unknown>;
    model: (name: string, schema?: unknown, collection?: unknown, options?: unknown) => unknown;
    connect(uri: string, options?: ConnectOptions): Promise<Mongoose>;
    disconnect(): Promise<void>;
    set?: (key: string, value: unknown) => Mongoose;
}

export type MongooseModule = {
    default?: Mongoose;
    connect?: Mongoose['connect'];
} & Mongoose;

declare const mongoose: MongooseModule;
export default mongoose;