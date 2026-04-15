import "dotenv/config";

const PORT = Number(process.env.PORT ?? 3001);
const NODE_ENV = process.env.NODE_ENV ?? "development";
const JWT_SECRET = process.env.JWT_SECRET;

if (NODE_ENV === "production" && !JWT_SECRET) {
    throw new Error("JWT_SECRET must be set in production");
}

export const env = {
    PORT,
    NODE_ENV,
    JWT_SECRET: JWT_SECRET ?? "super-secret-dev-key",
};
