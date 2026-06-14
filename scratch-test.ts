const q = new URLSearchParams({
  startLat: "48.7", startLng: "19.1", destLat: "49.2", destLng: "18.7", travelDate: "2026-06-18T00:00:00Z"
});
const res = await fetch("http://localhost:3000/rides/search?" + q.toString());
console.log(res.status, await res.text());
