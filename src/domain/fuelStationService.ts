import { Collection } from "mongodb";

export type Pump = {
    id: number;
    fuel_type: string;
    price: number;
    available: boolean;
};

export type FuelStationDTO = {
    _id?: string;
    id: string;
    name: string;
    address: string;
    city: string;
    latitude: number;
    longitude: number;
    pumps: Pump[];
};

export class FuelStationService {

    constructor(private fuelStationDB: Collection<FuelStationDTO>) {
        fuelStationDB.createIndex({ id: 1 }, { unique: true, background: true });
    }

    async getFuelStations(): Promise<FuelStationDTO[]> {
        return this.fuelStationDB.find().toArray();
    }

    async getFuelStationById(fuelStationId: string): Promise<FuelStationDTO | null> {
        return this.fuelStationDB.findOne({ id: fuelStationId });
    }

    async createFuelStation(fuelStationDTO: FuelStationDTO): Promise<FuelStationDTO> {
        const insertResult = await this.fuelStationDB.insertOne(fuelStationDTO);
        fuelStationDTO._id = insertResult.insertedId;

        return fuelStationDTO;
    }

    async updateFuelStationName(
        fuelStationId: string,
        name: string
    ): Promise<FuelStationDTO | null> {
        const updatedFuelStationDTO = await this.fuelStationDB.findOneAndUpdate(
            { id: fuelStationId },
            { $set: { name } },
            {
                returnDocument: "after",
            }
        );

        return updatedFuelStationDTO;
    }

    async updateFuelStationPumpPrices(
        fuelStationId: string,
        priceUpdateArray: { id: number; price: number }[]
    ): Promise<FuelStationDTO | null> {
        const setOps: { [key: string]: number } = {};
        const arrayFilters: { [key: string]: number }[] = [];

        priceUpdateArray.forEach((update, index) => {
            const identifier = `pump${index}`;
            setOps[`pumps.$[${identifier}].price`] = update.price;
            arrayFilters.push({ [identifier + ".id"]: update.id });
        });

        const updatedFuelStationDTO = await this.fuelStationDB.findOneAndUpdate(
            { id: fuelStationId },
            { $set: setOps },
            {
                arrayFilters: arrayFilters,
                returnDocument: "after",
            }
        );

        return updatedFuelStationDTO;
    }

    async deleteFuelStation(fuelStationId: string): Promise<void> {
        await this.fuelStationDB.deleteOne({ id: fuelStationId });
    }
}
