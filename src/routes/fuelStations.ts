import express from "express";
import { z } from "zod";

import { getDb } from "../dbsetup.js";
import { FuelStationService } from "../domain/fuelStationService.js";
import { validateBody, validateParams } from "../zod.js";

const FuelStationCreateSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    address: z.string().min(1),
    city: z.string().min(1),
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    pumps: z.array(
        z.object({
            id: z.coerce.number(),
            fuel_type: z.union([
                z.literal("BENZIN_95"),
                z.literal("BENZIN_98"),
                z.literal("DIESEL"),
            ]),
            price: z.coerce.number().min(0),
            available: z.boolean(),
        })
    ),
});

export default function fuelStationRouter() {
    const router = express.Router();
    const fuelStationService: FuelStationService = new FuelStationService(getDb()!.collection("fuelStation"));

    router
        .route("/")
        .get(async (_, res) => {
            const fuelStations = await fuelStationService.getFuelStations();

            res.json(fuelStations);
        })
        .post(
            validateBody(FuelStationCreateSchema), 
            async (req, res) => {
                const fuelStation = await fuelStationService.createFuelStation(req.body);

                res.status(201).json(fuelStation);
            }
        );

    router
        .route("/:fuelStationId")
        .all(validateParams({ fuelStationId: z.string() }))
        .get(async (req, res) => {
            const fuelStation = await fuelStationService.getFuelStationById(req.params.fuelStationId);

            if (!fuelStation) {
                return res
                    .status(404)
                    .send(`Fuel station with ID ${req.params.fuelStationId} not found.`);
            }

            res.json(fuelStation);
        })
        .delete(async (req, res) => {
            await fuelStationService.deleteFuelStation(req.params.fuelStationId);

            res.sendStatus(204);
        });

    router
        .route("/:fuelStationId/name")
        .all(validateParams({ fuelStationId: z.string() }))
        .patch(
            validateBody(z.object({ name: z.string() })), 
            async (req, res) => {
                const fuelStation = await fuelStationService.updateFuelStationName(
                    req.params.fuelStationId,
                    req.body.name
                );

                if (!fuelStation) {
                    return res
                        .status(404)
                        .send(`Fuel station with ID ${req.params.fuelStationId} not found.`);
                }

                res.json(fuelStation);
            }
        );

    router
        .route("/:fuelStationId/pump-price")
        .all(validateParams({ fuelStationId: z.string() }))
        .patch(
            validateBody(
                z.array(
                    z.object({ 
                        id: z.number(),
                        price: z.number().min(0) 
                    })
                )
            ),
            async (req, res) => {
                const fuelStation = await fuelStationService.updateFuelStationPumpPrices(
                    req.params.fuelStationId,
                    req.body
                );

                if (!fuelStation) {
                    return res
                        .status(404)
                        .send(`Fuel station with ID ${req.params.fuelStationId} not found.`); //JSON
                }

                res.json(fuelStation);
            }
        );

    return router;
}
