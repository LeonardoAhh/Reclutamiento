import type { TransporteRuta } from "@/lib/transporte-routes";

interface RouteItineraryStop {
  neighborhood: string;
  reference: string;
  times: readonly (string | null)[];
}

type RouteItinerary = {
  shifts: readonly string[];
  stops: readonly RouteItineraryStop[];
};

// Transcription of the six official route schedules supplied by the user.
// A null time means that the source explicitly marks that shift as N/A.
export const ROUTE_ITINERARIES: Readonly<Record<TransporteRuta, RouteItinerary>> = {
  "R1- QUERETARO- PIE DE LA CUESTA": {
    shifts: ["1", "2", "3"],
    stops: [
      { neighborhood: "PIE DE LA CUESTA", reference: "TRÁNSITO, FRENTE AL OXXO", times: ["04:40", "12:40", "20:40"] },
      { neighborhood: "PIE DE LA CUESTA", reference: "EN EL CIDESI", times: ["04:42", "12:42", "20:42"] },
      { neighborhood: "PIE DE LA CUESTA", reference: "FRENTE AL ELEKTRA", times: ["04:43", "12:43", "20:43"] },
      { neighborhood: "TLÁLOC", reference: "ESQ. SOMBRERETE, EN EL PUESTO DE PERIÓDICOS", times: ["04:48", "12:48", "20:48"] },
      { neighborhood: "PIE DE LA CUESTA", reference: "ESQ. PASEO DE LA CONSTITUCIÓN, FARMACIA DIAGNÓSTICA", times: ["04:54", "12:54", "20:54"] },
      { neighborhood: "PIE DE LA CUESTA", reference: "EN LA BODEGA AURRERA", times: ["04:57", "12:57", "20:57"] },
      { neighborhood: "PIE DE LA CUESTA", reference: "ESQ. BLVD. DE LA NACIÓN, EN EL OXXO", times: ["05:01", "13:01", "21:01"] },
      { neighborhood: "PIE DE LA CUESTA", reference: "EN EL OXXO DE LOS PILARES", times: ["05:05", "13:05", "21:05"] },
      { neighborhood: "PIE DE LA CUESTA", reference: "ESQ. BELÉN, EN LA LLANTERA LOS VEGA / TIENDA NETO", times: ["05:09", "13:09", "21:09"] },
      { neighborhood: "PIE DE LA CUESTA", reference: "ESQ. CALLE DE LA AMARGURA, EN LA PANADERÍA LECAROZ", times: ["05:12", "13:12", "21:12"] },
      { neighborhood: "PIE DE LA CUESTA", reference: "ESQ. CONCORDIA, DONDE SALE LA RUTA L", times: ["05:16", "13:16", "21:16"] },
      { neighborhood: "PIE DE LA CUESTA", reference: "FRENTE A LA CARNICERÍA \"LOS PADILLAS\"", times: ["05:18", "13:18", "21:18"] },
      { neighborhood: "AV. PEDREGAL", reference: "SEGUNDA PARADA DE CAMIONES", times: ["05:20", "13:20", "21:20"] },
      { neighborhood: "KM. 15", reference: "PARADA DE CAMIONES", times: ["05:30", "13:30", "21:30"] },
      { neighborhood: "VIÑOPLASTIC", reference: "PLANTA", times: ["05:50", "13:50", "21:50"] },
    ],
  },
  "R2- SAN JOSE ITURBIDE": {
    shifts: ["1", "2", "3"],
    stops: [
      { neighborhood: "SAN JOSÉ ITURBIDE", reference: "PARADA EN LA ESCUELA 5 DE MAYO", times: ["04:40", "12:40", "20:10"] },
      { neighborhood: "SAN JOSÉ ITURBIDE", reference: "PARADA STEREN", times: ["04:45", "12:45", "20:15"] },
      { neighborhood: "SAN JOSÉ ITURBIDE", reference: "PRADOS DEL ROSARIO, PARADA EN LA ESCUELA", times: ["04:48", "12:48", "20:18"] },
      { neighborhood: "SAN JOSÉ ITURBIDE", reference: "CRUZ ROJA MEXICANA", times: ["04:55", "12:55", "20:25"] },
      { neighborhood: "SAN JOSÉ ITURBIDE", reference: "PARADA DE AUTOBUSES DE COPPEL", times: ["05:00", "13:00", "20:30"] },
      { neighborhood: "SAN JOSÉ ITURBIDE", reference: "PARADA DE LA ALAMEDA", times: ["05:02", "13:02", "20:32"] },
      { neighborhood: "SAN JOSÉ ITURBIDE", reference: "PARADA DE MA. TERESA", times: ["05:05", "13:05", "20:35"] },
      { neighborhood: "SAN JOSÉ ITURBIDE", reference: "PARADA EN EL MODELORAMA, SOBRE CARRETERA", times: ["05:08", "13:08", "20:38"] },
      { neighborhood: "PUERTO CARROZA", reference: "PARADA DE AUTOBUSES, SOBRE CARRETERA", times: ["05:18", "13:18", "20:48"] },
      { neighborhood: "OJO DE AGUA", reference: "PARADA ENTRADA A LA COMUNIDAD, SOBRE CARRETERA", times: ["05:23", "13:23", "20:53"] },
      { neighborhood: "RINCÓN DE OJO DE AGUA", reference: "P. ENTRONQUE, ENTRANDO A LA COMUNIDAD, PARADA DE AUTOBUSES SOBRE CARRETERA", times: ["05:30", "13:30", "21:00"] },
      { neighborhood: "RINCÓN DE OJO DE AGUA", reference: "PARADA EN EL ENTRONQUE", times: ["05:35", "13:35", "21:05"] },
      { neighborhood: "LA LUZ", reference: "PARADA EN EL PUENTE PEATONAL", times: [null, null, "21:10"] },
      { neighborhood: "LA LUZ", reference: "PARADA EN LA IGLESIA", times: [null, null, "21:15"] },
      { neighborhood: "LA BARRETA", reference: "TIENDA, EN LA ENTRADA", times: [null, null, "21:35"] },
      { neighborhood: "LOS MATERIALES", reference: "ENTRADA A BUENAVISTA, FRENTE A LA GASOLINERA SHELL", times: [null, null, "21:40"] },
      { neighborhood: "BUENAVISTA", reference: "PARADA FRENTE A BARCO DE MARISCOS CHILOS", times: [null, null, "21:41"] },
      { neighborhood: "BUENAVISTA", reference: "PARADA DE AUTOBUSES, SECUNDARIA", times: [null, null, "21:45"] },
      { neighborhood: "VIÑOPLASTIC", reference: "PLANTA", times: ["05:50", "13:50", "21:50"] },
    ],
  },
  "R3- SAN JOSE ITURBIDE 2": {
    shifts: ["1", "2"],
    stops: [
      { neighborhood: "LA LUZ", reference: "PARADA EN EL PUENTE PEATONAL", times: ["04:55", "12:55"] },
      { neighborhood: "LA LUZ", reference: "PARADA EN LA IGLESIA", times: ["04:57", "12:57"] },
      { neighborhood: "LA LUZ", reference: "PARADA EN LA CURVA DE LA RECICLADORA", times: ["05:04", "13:04"] },
      { neighborhood: "LA BARRETA", reference: "TIENDA, EN LA ENTRADA", times: ["05:13", "13:13"] },
      { neighborhood: "LA MONJA", reference: "SOBRE CARR. EN EL PUENTE PEATONAL", times: ["05:22", "13:22"] },
      { neighborhood: "LA MONJA", reference: "EN LA TERRACERÍA DE LA CURVA, EN LA CASITA CON BARDA DE PIEDRA CON 2 POSTES DE LUZ", times: ["05:23", "13:23"] },
      { neighborhood: "BUENAVISTA", reference: "PARADA SOBRE CARR. A SAN MIGUEL, EN MATERIALES BELTRÁN", times: ["05:29", "13:29"] },
      { neighborhood: "BUENAVISTA", reference: "PARADA FRENTE AL BARCO DE CHILOS", times: ["05:31", "13:31"] },
      { neighborhood: "BUENAVISTA", reference: "PARADA DE AUTOBUSES DE LA SECUNDARIA", times: ["05:32", "13:32"] },
      { neighborhood: "VIÑOPLASTIC", reference: "PLANTA", times: ["05:50", "13:50"] },
    ],
  },
  "R4-SANTA ROSA": {
    shifts: ["1", "2", "3"],
    stops: [
      { neighborhood: "SANTA ROSA", reference: "EN EL PUENTE DE LA CRUZ", times: ["04:55", "12:55", "20:55"] },
      { neighborhood: "SANTA ROSA", reference: "EN EL PUENTE DE LAS ROSAS", times: ["04:57", "12:57", "20:57"] },
      { neighborhood: "SANTA ROSA", reference: "C. INDEPENDENCIA, PARADA DE CAMIONES PRIMARIA EMILIANO ZAPATA", times: ["05:02", "13:02", "21:02"] },
      { neighborhood: "MONTENEGRO", reference: "LONCHERÍA LILI", times: ["05:07", "13:07", "21:07"] },
      { neighborhood: "HDA SANTA ROSA", reference: "FARMACIA GDL", times: ["05:12", "13:12", "21:12"] },
      { neighborhood: "HDA SANTA ROSA", reference: "ENFRENTE AL WATER HOUSE", times: ["05:15", "13:15", "21:15"] },
      { neighborhood: "FRACC. MONTENEGRO", reference: "PARADA DE CAMIONES HUIZACHE", times: ["05:22", "13:22", "21:22"] },
      { neighborhood: "FRACC. MONTENEGRO", reference: "PARADA EN LA CALLE YUCA Y BLVD. MONTENEGRO", times: ["05:23", "13:23", "21:23"] },
      { neighborhood: "PTO AGUIRRE", reference: "PARADA EN LA TORTILLERÍA", times: ["05:33", "13:33", "21:33"] },
      { neighborhood: "PTO AGUIRRE", reference: "PARADA EN EL MEZQUITE", times: ["05:35", "13:35", "21:35"] },
      { neighborhood: "VIÑOPLASTIC", reference: "PLANTA", times: ["05:50", "13:50", "21:50"] },
    ],
  },
  "R5- QUERETARO-AV. DE LA LUZ": {
    shifts: ["1", "2", "3"],
    stops: [
      { neighborhood: "AV. DE LA LUZ", reference: "ESQ. MATLAZINCAS, EN LA FARMACIA GUADALAJARA", times: ["04:48", "12:48", "20:48"] },
      { neighborhood: "PROL. BERNARDO QUINTANA", reference: "PARADA DE CAMIONES, FRENTE AL TALLER DE MOTOS CRYS RIDER", times: ["04:50", "12:50", "20:50"] },
      { neighborhood: "PROL. BERNARDO QUINTANA", reference: "PARADA EN LA ESQUINA DEL CAMINO A SAN PEDRO MÁRTIR", times: ["04:53", "12:53", "20:53"] },
      { neighborhood: "PLAZA DEL SOL", reference: "EN EL KFC", times: ["04:58", "12:58", "20:58"] },
      { neighborhood: "OBRERA", reference: "PARADA DE CAMIONES, EN EL OXXO DE LA CALLE COAHUILA", times: ["05:05", "13:05", "21:05"] },
      { neighborhood: "5 DE FEBRERO", reference: "PARADA EN EL PUENTE PEATONAL DE TREMEC", times: ["05:15", "13:15", "21:15"] },
      { neighborhood: "SALITRE", reference: "FRENTE AL JARDÍN", times: ["05:25", "13:25", "21:25"] },
      { neighborhood: "SANTA CATARINA", reference: "PARADA DE CAMIONES", times: ["05:40", "13:40", "21:40"] },
      { neighborhood: "SAN ISIDRO", reference: "PARADA DE CAMIONES", times: ["05:43", "13:43", "21:43"] },
      { neighborhood: "COREA", reference: "PARADA DE CAMIONES", times: ["05:45", "13:45", "21:45"] },
      { neighborhood: "VIÑOPLASTIC", reference: "PLANTA", times: ["05:50", "13:50", "21:50"] },
    ],
  },
  "R6- AV. DE LA LUZ - PASEOS QUERETARO": {
    shifts: ["1", "2", "3"],
    stops: [
      { neighborhood: "PEÑAFLOR", reference: "BODEGA AURRERA PEÑAFLOR", times: ["04:35", "12:35", "20:35"] },
      { neighborhood: "AV. DE LA LUZ", reference: "PARADA DE CAMIONES ESQ. MAYAS", times: ["04:45", "12:45", "20:45"] },
      { neighborhood: "AV. DE LA LUZ", reference: "PARADA DE CAMIONES, FRENTE A BODEGA AURRERA", times: ["04:48", "12:48", "20:48"] },
      { neighborhood: "PASEO QUERÉTARO", reference: "PASEO QUERÉTARO ESQ. PIRINEOS", times: ["04:58", "12:58", "20:58"] },
      { neighborhood: "PASEO QUERÉTARO", reference: "PARADA DE CAMIONES, FRENTE AL INSPIRE GYM", times: ["05:00", "13:00", "21:00"] },
      { neighborhood: "PASEO QUERÉTARO", reference: "PASEO QUERÉTARO ESQ. PLAN DE SAN LUIS", times: ["05:04", "13:04", "21:04"] },
      { neighborhood: "PASEO QUERÉTARO", reference: "PARADA DE CAMIONES EN EL ASTURIANO AV. SAN DANIEL", times: ["05:07", "13:07", "21:07"] },
      { neighborhood: "PASEO QUERÉTARO", reference: "PARADA EN LA PANADERÍA LECAROZ", times: ["05:10", "13:10", "21:10"] },
      { neighborhood: "PASEO QUERÉTARO", reference: "PARADA EN EL OXXO DE PUERTAS DE SAN MIGUEL", times: ["05:13", "13:13", "21:13"] },
      { neighborhood: "PASEO QUERÉTARO", reference: "PARADA EN OXXO DE JUNCOS", times: ["05:15", "13:15", "21:15"] },
      { neighborhood: "MOMPANÍ", reference: "PARADA EN EL TOPE, FRENTE A LA FERRETERÍA JOSUÉ", times: ["05:20", "13:20", "21:20"] },
      { neighborhood: "VIÑOPLASTIC", reference: "PLANTA", times: ["05:50", "13:50", "21:50"] },
    ],
  },
};

export function getRouteItinerary(routeName: string): RouteItinerary | undefined {
  return Object.prototype.hasOwnProperty.call(ROUTE_ITINERARIES, routeName)
    ? ROUTE_ITINERARIES[routeName as TransporteRuta]
    : undefined;
}
