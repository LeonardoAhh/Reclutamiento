import { useId } from "react";
import { MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getRouteItinerary } from "@/lib/route-itineraries";
import { getConfiguracionCopy } from "./configuracion-translations";

interface RouteItinerarySectionProps {
  routeName: string;
}

export function RouteItinerarySection({ routeName }: RouteItinerarySectionProps) {
  const { language } = useLanguage();
  const headingId = useId();
  const copy = getConfiguracionCopy(language).routes;
  const itinerary = getRouteItinerary(routeName);

  return (
    <section className="ruta-section" aria-labelledby={headingId}>
      <h2 id={headingId} className="ruta-section__title ruta-section__title-wrapper type-body-strong">
        <MapPin aria-hidden="true" className="ruta-section__title-icon" />
        {copy.officialItinerary}
      </h2>
      {itinerary ? (
        <ol className="route-itinerary__list">
          {itinerary.stops.map((stop, index) => (
            <li key={`${index}-${stop.reference}`} className="route-itinerary__stop">
              <span className="route-itinerary__number" aria-hidden="true">{index + 1}</span>
              <div className="route-itinerary__place">
                <h3 className="type-body-strong">{stop.neighborhood}</h3>
                <p className="type-body-md">{stop.reference}</p>
              </div>
              <dl className="route-itinerary__times">
                {itinerary.shifts.map((shift, shiftIndex) => (
                  <div key={shift}>
                    <dt className="type-caption-up">{copy.shift} {shift}</dt>
                    <dd className="type-body-md">{stop.times[shiftIndex] ?? copy.notAvailable}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ol>
      ) : (
        <p className="type-body-md">{copy.noOfficialItinerary}</p>
      )}
    </section>
  );
}
