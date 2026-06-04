const fs = require('fs');
const path = './src/modules/admin/admin.repository.ts';

let content = fs.readFileSync(path, 'utf8');

// 1. Remove import
content = content.replace(/import \{ cities as citiesTable \} from "\.\.\/\.\.\/db\/schema\/city";\n/, '');

// 2. findRideList
content = content.replace(/const originCities = aliasedTable\(citiesTable, "admin_origin_cities"\);\n\s*const destCities = aliasedTable\(citiesTable, "admin_dest_cities"\);\n/g, '');
content = content.replace(/originCity: originCities\.name,\n\s*destinationCity: destCities\.name,/g, 'originCity: originStops.city,\n            destinationCity: destStops.city,');
content = content.replace(/\.innerJoin\(originCities, eq\(originCities\.id, originStops\.cityId\)\)\n\s*\.innerJoin\(lastStopOrders, eq\(lastStopOrders\.rideId, ridesTable\.id\)\)\n\s*\.innerJoin\(\n\s*destStops,\n\s*and\(\n\s*eq\(destStops\.rideId, ridesTable\.id\),\n\s*eq\(destStops\.stopOrder, lastStopOrders\.stopOrder\)\n\s*\)\n\s*\)\n\s*\.innerJoin\(destCities, eq\(destCities\.id, destStops\.cityId\)\)/g,
`.innerJoin(lastStopOrders, eq(lastStopOrders.rideId, ridesTable.id))
        .innerJoin(
            destStops,
            and(
                eq(destStops.rideId, ridesTable.id),
                eq(destStops.stopOrder, lastStopOrders.stopOrder)
            )
        )`);

// 3. findRideDetailById
content = content.replace(/city: citiesTable\.name,\n\s*countryCode: citiesTable\.countryCode,/g, 'city: rideStopsTable.city,\n                countryCode: rideStopsTable.countryCode,');
content = content.replace(/\.innerJoin\(citiesTable, eq\(citiesTable\.id, rideStopsTable\.cityId\)\)\n/g, '');

// 4. findReviewList
content = content.replace(/const originCities = aliasedTable\(citiesTable, "admin_rl_origin_cities"\);\n\s*const destCities = aliasedTable\(citiesTable, "admin_rl_dest_cities"\);\n/g, '');

// 5. findReviewDetailById
content = content.replace(/const originCities = aliasedTable\(\n\s*citiesTable,\n\s*"admin_review_detail_origin_cities"\n\s*\);\n\s*const destCities = aliasedTable\(\n\s*citiesTable,\n\s*"admin_review_detail_dest_cities"\n\s*\);\n/g, '');

// 6. findReportDetailById
content = content.replace(/const originCities = aliasedTable\(\n\s*citiesTable,\n\s*"admin_report_detail_origin_cities"\n\s*\);\n\s*const destCities = aliasedTable\(\n\s*citiesTable,\n\s*"admin_report_detail_dest_cities"\n\s*\);\n/g, '');

// 7. findDashboardStats
content = content.replace(/const originCities = aliasedTable\(citiesTable, "dash_origin_cities"\);\n\s*const destCities = aliasedTable\(citiesTable, "dash_dest_cities"\);\n/g, '');

// 8. Find any remaining innerJoin/leftJoin for cities and replace them
content = content.replace(/\.innerJoin\(originCities, eq\(originCities\.id, originStops\.cityId\)\)/g, '');
content = content.replace(/\.innerJoin\(destCities, eq\(destCities\.id, destStops\.cityId\)\)/g, '');
content = content.replace(/\.leftJoin\(originCities, eq\(originCities\.id, originStops\.cityId\)\)/g, '');
content = content.replace(/\.leftJoin\(destCities, eq\(destCities\.id, destStops\.cityId\)\)/g, '');

// Save
fs.writeFileSync(path, content, 'utf8');
console.log('admin.repository.ts updated successfully');
