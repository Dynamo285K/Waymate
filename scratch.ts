import { db } from "./apps/api/src/db";
import { rideStops } from "./apps/api/src/db/schema";
const stops = await db.select().from(rideStops);
console.log(stops.map(s => ({ city: s.city, order: s.stopOrder, arr: s.plannedArrivalAt, dep: s.plannedDepartureAt })));
process.exit(0);
