/// <reference types="node" />
import assert from "node:assert/strict";
import test from "node:test";
import { ROUTE_ITINERARIES, getRouteItinerary } from "./route-itineraries";
import { TRANSPORTE_RUTAS } from "./transporte-routes";

test("official itineraries cover all six routes in the supplied schedules", () => {
  const expectedStops = [15, 19, 10, 11, 11, 12];

  TRANSPORTE_RUTAS.forEach((route, index) => {
    const itinerary = getRouteItinerary(route);
    assert.ok(itinerary, route);
    assert.equal(itinerary.stops.length, expectedStops[index], route);
    assert.equal(itinerary.stops[itinerary.stops.length - 1]?.neighborhood, "VIÑOPLASTIC", route);
    itinerary.stops.forEach((stop) => {
      assert.equal(stop.times.length, itinerary.shifts.length, route);
    });
  });

  assert.equal(getRouteItinerary("Unknown route"), undefined);
  assert.equal(Object.keys(ROUTE_ITINERARIES).length, TRANSPORTE_RUTAS.length);
});

test("repeated neighborhoods remain separate ordered stops with their own times", () => {
  const r5 = getRouteItinerary(TRANSPORTE_RUTAS[4]);
  assert.ok(r5);
  assert.equal(r5.stops[1].neighborhood, "PROL. BERNARDO QUINTANA");
  assert.equal(r5.stops[1].times[0], "04:50");
  assert.equal(r5.stops[2].neighborhood, "PROL. BERNARDO QUINTANA");
  assert.equal(r5.stops[2].times[0], "04:53");
});

test("R2 retains third-shift-only stops and R3 has two shifts", () => {
  const r2 = getRouteItinerary(TRANSPORTE_RUTAS[1]);
  const r3 = getRouteItinerary(TRANSPORTE_RUTAS[2]);
  assert.ok(r2);
  assert.ok(r3);
  assert.deepEqual(r2.stops[12].times, [null, null, "21:10"]);
  assert.deepEqual(r2.stops[17].times, [null, null, "21:45"]);
  assert.deepEqual(r3.shifts, ["1", "2"]);
  assert.deepEqual(r3.stops[r3.stops.length - 1]?.times, ["05:50", "13:50"]);
});
