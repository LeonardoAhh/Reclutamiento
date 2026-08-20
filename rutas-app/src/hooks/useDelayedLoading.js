import { useEffect, useState } from 'react';

/** Briefly flags loading=true whenever `dep` changes (drives skeletons). */
export default function useDelayedLoading(dep, ms = 350) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
  }, [dep, ms]);

  return loading;
}
