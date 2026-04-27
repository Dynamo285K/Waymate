export type AvailableRide = {
    id: number;
    from: string;
    to: string;
    date: Date;
    seatsLeft: number;
    driverName: string;
    driverRating: number;
    price: number;
};

export const AVAILABLE_RIDES: AvailableRide[] = [
    {
        id: 1,
        from: "Martin",
        to: "Brno",
        date: new Date(2026, 2, 15, 8, 0),
        seatsLeft: 2,
        driverName: "Sarah Johnson",
        driverRating: 4.9,
        price: 10,
    },
    {
        id: 2,
        from: "Zilina",
        to: "Praha",
        date: new Date(2026, 2, 15, 10, 0),
        seatsLeft: 1,
        driverName: "Mike Chen",
        driverRating: 4.8,
        price: 21,
    },
    {
        id: 3,
        from: "Brno",
        to: "Bratislava",
        date: new Date(2026, 2, 15, 9, 0),
        seatsLeft: 3,
        driverName: "Emma Wilson",
        driverRating: 5,
        price: 6,
    },
    {
        id: 4,
        from: "Brno",
        to: "Banska Bystrica",
        date: new Date(2026, 2, 15, 15, 0),
        seatsLeft: 2,
        driverName: "David Brown",
        driverRating: 4.7,
        price: 15,
    },
];
