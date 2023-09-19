import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";

import sampleData from "../../sample_data.json";
import { connectToDB, disconnectFromDb } from "../dbsetup.js";
import { setupServer } from "../index.js";

const api_key_header = "x-api-key";
const api_key = "test_key";

let app: any = null;

describe("fuel station API", () => {
    beforeAll(async () => {
        const mongoServer = await MongoMemoryServer.create();
        await connectToDB(mongoServer.getUri(), "testFuelStationAPI");

        app = setupServer();

        // clean up function, called once after all tests run
        return async () => {
            disconnectFromDb();
            await mongoServer.stop();
        };
    });

    it("should return an error when no api key is provided", async () => {
        const response = await request(app).get("/fuel-stations").expect(403);

        expect(response.body.error.code).toBe(403);
    });

    it("should return an empty array when no fuel stations are present", async () => {
        const response = await request(app)
            .get("/fuel-stations")
            .set(api_key_header, api_key)
            .expect(200);

        expect(response.body).toStrictEqual([]);
    });

    it("should fail to create a new fuel station with invalid data", async () => {
        await request(app)
            .post("/fuel-stations")
            .set(api_key_header, api_key)
            .send({ name: "Test Station" })
            .expect(400);
    });

    it("should create a new fuel station", async () => {
        const response = await request(app)
            .post("/fuel-stations")
            .set(api_key_header, api_key)
            .send(sampleData[0])
            .expect(201);

        expect(response.body.name).toBe(sampleData[0].name);
    });

    it("should retrieve all fuel stations", async () => {
        const response = await request(app)
            .get("/fuel-stations")
            .set(api_key_header, api_key)
            .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
    });

    it("should retrieve a fuel station by ID", async () => {
        const testID = sampleData[0].id;
        const response = await request(app)
            .get(`/fuel-stations/${testID}`)
            .set(api_key_header, api_key)
            .expect(200);

        expect(response.body.id).toBe(testID);
    });

    it("should update the name of a fuel station", async () => {
        const testID = sampleData[0].id;
        const updatedName = "Updated Test Station";

        const response = await request(app)
            .patch(`/fuel-stations/${testID}/name`)
            .set(api_key_header, api_key)
            .send({ name: updatedName })
            .expect(200);

        expect(response.body.name).toBe(updatedName);
    });

    it("should update the pump price of a fuel station", async () => {
        const sampleStation = sampleData[0];
        const testID = sampleStation.id;
        const updatedPrice = sampleStation.pumps[0].price + 1;

        const testPump = [
            {
                id: sampleStation.pumps[0].id,
                price: updatedPrice,
            },
        ];

        const response = await request(app)
            .patch(`/fuel-stations/${testID}/pump-price`)
            .set(api_key_header, api_key)
            .send(testPump)
            .expect(200);

        expect(response.body.pumps[0].price).toBe(updatedPrice);
    });
});
