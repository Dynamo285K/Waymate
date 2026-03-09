import "dotenv/config";

const PORT = Number(process.env.PORT ?? 3001);
const NODE_ENV = process.env.NODE_ENV ?? "development";

export const env = {
  PORT,
  NODE_ENV,
};
