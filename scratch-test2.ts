const q = new URLSearchParams({
  startLat: "48.8945", startLng: "18.0443", startCity: "Trenčín",
  destLat: "49.1951", destLng: "16.6068", destCity: "Brno",
  travelDate: "2026-06-18T00:00:00Z"
});
const res = await fetch("http://localhost:3000/rides/search?" + q.toString());
console.log(res.status, await res.text());
