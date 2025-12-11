declare module 'mongoose' {
  // Minimal surface used by ServiceMongoose; intentionally omits Schema types to avoid TS4109.
  export interface ConnectOptions {
    [key: string]: unknown;
  }

  export interface Mongoose {
    connect(uri: string, options?: ConnectOptions): Promise<Mongoose>;
    disconnect(): Promise<void>;
    set(key: string, value: unknown): Mongoose;
  }

  export namespace Types {
    // Placeholder only; the seedwork dist uses DocumentArray in types.
    export type DocumentArray<T = unknown> = Array<T>;
  }

  export const mongoose: Mongoose & {
    connect(uri: string, options?: ConnectOptions): Promise<Mongoose>;
  };

  export { ConnectOptions, Mongoose };
  export default mongoose;
}
