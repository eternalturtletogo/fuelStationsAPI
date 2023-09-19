import express from "express";
import "express-async-errors";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import { MongoMemoryServer } from "mongodb-memory-server";

import { connectToDB, disconnectFromDb } from "./dbsetup.js";
import fuelStationRouter from "./routes/fuelStations.js";

const handleErrors: express.ErrorRequestHandler = (err, req, res, next) => {
  res.status(500).json(process.env.NODE_ENV === "production" ? "Internal Server Error" : err);
};

(async () => {
  const mongoServer = await MongoMemoryServer.create();
  await connectToDB(mongoServer.getUri(), "fuelStationsDatabase");

  const app = setupServer();

  const port = process.env.PORT || 3300;
  app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
})();

export function setupServer() {
    const app = express();

    app.use(helmet());
    app.use(cors());
    app.use(express.json());
    app.use(morgan("dev"));

    app.use((req, res, next) => {
        let apiKey = req.header("x-api-key");

        if (!apiKey || apiKey !== "test_key") {
            return res.status(403).send({ error: { code: 403, message: "Stop right there." } });
        }

        next();
    });

    app.use("/fuel-stations", fuelStationRouter());
    app.use(handleErrors);

    return app;
}

process.on("SIGINT", () => {
    disconnectFromDb();
    process.exit();
});

process.on("SIGTERM", () => {
    disconnectFromDb();
    process.exit();
});
