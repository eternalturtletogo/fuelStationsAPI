import { MongoMemoryServer } from "mongodb-memory-server";
import { beforeAll, describe, expect, it } from "vitest";

import { connectToDB, disconnectFromDb, getDb } from "../dbsetup.js";
import { FuelStationService } from "./fuelStationService.js";

import sampleData from "../../sample_data.json";

let fuelStationService: FuelStationService | null = null;

describe("Fuel Station Service", () => {
    beforeAll(async () => {
        const mongoServer = await MongoMemoryServer.create();
        await connectToDB(mongoServer.getUri(), "testFuelStationService");

        fuelStationService = new FuelStationService(getDb()!.collection("fuelStation"));

        // clean up function, called once after all tests run
        return async () => {
            disconnectFromDb();
            await mongoServer.stop();
        };
    });

    it("should return an empty array when no fuel stations are present", async () => {
        const fuelStations = await fuelStationService!.getFuelStations();

        expect(fuelStations).toStrictEqual([]);
    });

    it("should create a fuel station", async () => {
        const fuelStation = await fuelStationService!.createFuelStation(sampleData[0]);

        expect(fuelStation).toStrictEqual(sampleData[0]);
    });

    it("should return a fuel station by id", async () => {
        const fuelStation = await fuelStationService!.getFuelStationById(sampleData[0].id);

        expect(fuelStation).toStrictEqual(sampleData[0]);
    });

    it("should return all fuel stations", async () => {
        const fuelStations = await fuelStationService!.getFuelStations();

        expect(fuelStations).toStrictEqual([sampleData[0]]);
    });

    it("should update a fuel station name", async () => {
        const newName = "New Name";

        const updatedFuelStation = await fuelStationService!.updateFuelStationName(
            sampleData[0].id,
            newName
        );

        expect(updatedFuelStation).toStrictEqual({
            ...sampleData[0],
            name: newName,
        });
    });

    it("should update fuel station pump prices", async () => {
        const updatedPrice = sampleData[0].pumps[0].price + 1;

        const testPump = [
            {
                id: sampleData[0].pumps[0].id,
                price: updatedPrice,
            },
        ];

        const updatedFuelStation = await fuelStationService!.updateFuelStationPumpPrices(
            sampleData[0].id,
            testPump
        );

        expect(updatedFuelStation).not.toBeNull();
        expect(updatedFuelStation!.pumps[0].price).toBe(updatedPrice);
    });

    it("should delete a fuel station", async () => {
        await fuelStationService!.deleteFuelStation(sampleData[0].id);

        const fuelStations = await fuelStationService!.getFuelStations();

        expect(fuelStations).toStrictEqual([]);
    });
});
