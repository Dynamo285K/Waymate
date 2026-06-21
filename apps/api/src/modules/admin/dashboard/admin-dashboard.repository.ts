import {
    aliasedTable,
    and,
    desc,
    eq,
    gte,
    inArray,
    isNull,
    sql,
} from "drizzle-orm";
import type { AdminDashboardResponse } from "@repo/shared";
import type { Executor } from "../../../db";
import { users as usersTable } from "../../../db/schema/user";
import { rides as ridesTable } from "../../../db/schema/ride";
import { rideStops as rideStopsTable } from "../../../db/schema/ride_stop";
import { bookings as bookingsTable } from "../../../db/schema/booking";
import { cars as carsTable } from "../../../db/schema/car";

const getDashboardMetrics = async (
    executor: Executor
): Promise<AdminDashboardResponse> => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const originStops = aliasedTable(rideStopsTable, "dash_origin_stops");
    const destStops = aliasedTable(rideStopsTable, "dash_dest_stops");

    const lastStopOrders = executor
        .select({
            rideId: rideStopsTable.rideId,
            stopOrder: sql<number>`MAX(${rideStopsTable.stopOrder})`.as(
                "stopOrder"
            ),
        })
        .from(rideStopsTable)
        .groupBy(rideStopsTable.rideId)
        .as("dash_last_stops");

    const [weeklyRides, weeklyRevenue, popularRoutes, userCounts, driverCount] =
        await Promise.all([
            executor
                .select({
                    date: sql<string>`to_char(${ridesTable.createdAt}, 'YYYY-MM-DD')`,
                    count: sql<number>`COUNT(*)::int`,
                })
                .from(ridesTable)
                .where(
                    and(
                        gte(ridesTable.createdAt, sevenDaysAgo),
                        isNull(ridesTable.deletedAt)
                    )
                )
                .groupBy(sql`to_char(${ridesTable.createdAt}, 'YYYY-MM-DD')`)
                .orderBy(sql`to_char(${ridesTable.createdAt}, 'YYYY-MM-DD')`),

            executor
                .select({
                    date: sql<string>`to_char(${bookingsTable.createdAt}, 'YYYY-MM-DD')`,
                    totalCents: sql<number>`COALESCE(SUM(${bookingsTable.priceAmount}), 0)::int`,
                })
                .from(bookingsTable)
                .where(
                    and(
                        gte(bookingsTable.createdAt, sevenDaysAgo),
                        inArray(bookingsTable.bookingStatus, [
                            "CONFIRMED",
                            "COMPLETED",
                        ]),
                        isNull(bookingsTable.deletedAt)
                    )
                )
                .groupBy(sql`to_char(${bookingsTable.createdAt}, 'YYYY-MM-DD')`)
                .orderBy(
                    sql`to_char(${bookingsTable.createdAt}, 'YYYY-MM-DD')`
                ),

            executor
                .select({
                    originCity: originStops.city,
                    destinationCity: destStops.city,
                    count: sql<number>`COUNT(${ridesTable.id})::int`,
                })
                .from(ridesTable)
                .innerJoin(
                    originStops,
                    and(
                        eq(originStops.rideId, ridesTable.id),
                        eq(originStops.stopOrder, 0)
                    )
                )

                .innerJoin(
                    lastStopOrders,
                    eq(lastStopOrders.rideId, ridesTable.id)
                )
                .innerJoin(
                    destStops,
                    and(
                        eq(destStops.rideId, ridesTable.id),
                        eq(destStops.stopOrder, lastStopOrders.stopOrder)
                    )
                )

                .where(isNull(ridesTable.deletedAt))
                .groupBy(originStops.city, destStops.city)
                .orderBy(desc(sql`COUNT(${ridesTable.id})`))
                .limit(5),

            executor
                .select({
                    totalRegistered: sql<number>`COUNT(CASE WHEN ${usersTable.userRole} = 'USER' AND ${usersTable.deletedAt} IS NULL THEN 1 END)::int`,
                    activeInLast24h: sql<number>`COUNT(CASE WHEN ${usersTable.userRole} = 'USER' AND ${usersTable.deletedAt} IS NULL AND ${usersTable.lastActiveAt} >= NOW() - INTERVAL '24 hours' THEN 1 END)::int`,
                    pendingVerification: sql<number>`COUNT(CASE WHEN ${usersTable.userRole} = 'USER' AND ${usersTable.deletedAt} IS NULL AND ${usersTable.userStatus} = 'PENDING' THEN 1 END)::int`,
                    bannedAccounts: sql<number>`COUNT(CASE WHEN ${usersTable.userRole} = 'USER' AND ${usersTable.deletedAt} IS NULL AND ${usersTable.userStatus} = 'BANNED' THEN 1 END)::int`,
                })
                .from(usersTable),

            executor
                .select({
                    count: sql<number>`COUNT(DISTINCT ${carsTable.ownerId})::int`,
                })
                .from(carsTable)
                .where(isNull(carsTable.deletedAt)),
        ]);

    const metrics = userCounts[0] ?? {
        totalRegistered: 0,
        activeInLast24h: 0,
        pendingVerification: 0,
        bannedAccounts: 0,
    };
    const drivers = driverCount[0]?.count ?? 0;

    return {
        weeklyRides,
        weeklyRevenue,
        popularRoutes,
        userMetrics: {
            ...metrics,
            drivers,
            passengers: Math.max(0, metrics.totalRegistered - drivers),
        },
    };
};

export const AdminDashboardRepository = {
    getDashboardMetrics,
};
