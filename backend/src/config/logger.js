import env from "./env.js";

const shouldLogDebug = env.nodeEnv !== "test";

const logger = {
  info: (...args) => {
    if (shouldLogDebug) console.log(...args);
  },
  warn: (...args) => {
    if (shouldLogDebug) console.warn(...args);
  },
  error: (...args) => {
    console.error(...args);
  },
};

export default logger;
