export interface Car {
    id: string;
    ownerId: string;
    modelId: number;
    spz: string;
    countryCode: string;
    color:
        | "WHITE"
        | "BLACK"
        | "SILVER"
        | "GRAY"
        | "RED"
        | "BLUE"
        | "BROWN"
        | "GREEN"
        | "YELLOW"
        | "ORANGE"
        | "OTHER"
        | null;
    seatsTotal: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
}

export interface CreateCarBody {
    modelId: number;
    spz: string;
    countryCode: string;
    color?:
        | "WHITE"
        | "BLACK"
        | "SILVER"
        | "GRAY"
        | "RED"
        | "BLUE"
        | "BROWN"
        | "GREEN"
        | "YELLOW"
        | "ORANGE"
        | "OTHER"
        | null;
    seatsTotal: number;
}

export interface CarModel {
    id: number;
    brand: string;
    modelName: string;
}
