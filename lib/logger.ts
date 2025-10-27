// lib/logger.ts
interface LogMetadata {
  userId?: string;
  userRol?: string;
  duration?: number;
  error?: string;
  stack?: string;
  [key: string]: any;
}

export const logger = {
  error: (message: string, metadata: LogMetadata = {}) => {
    console.error(
      JSON.stringify({
        level: "error",
        message,
        timestamp: new Date().toISOString(),
        ...metadata,
      })
    );
  },

  info: (message: string, metadata: LogMetadata = {}) => {
    console.log(
      JSON.stringify({
        level: "info",
        message,
        timestamp: new Date().toISOString(),
        ...metadata,
      })
    );
  },

  warn: (message: string, metadata: LogMetadata = {}) => {
    console.warn(
      JSON.stringify({
        level: "warn",
        message,
        timestamp: new Date().toISOString(),
        ...metadata,
      })
    );
  },

  debug: (message: string, metadata: LogMetadata = {}) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(
        JSON.stringify({
          level: "debug",
          message,
          timestamp: new Date().toISOString(),
          ...metadata,
        })
      );
    }
  },
};
