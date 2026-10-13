import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface ActivityImage {
  title: string;
  src: string;
}

type ImageState =
  | { status: "loading" | "missing" | "error"; image: null }
  | { status: "ready"; image: ActivityImage };

export function useActivityImage(activityId: string | undefined, proofId: string | null) {
  const [state, setState] = useState<ImageState>({ status: "loading", image: null });
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!activityId) {
      setState({ status: "missing", image: null });
      return;
    }

    setState({ status: "loading", image: null });
    async function load() {
      const { data: activity, error: activityError } = await supabase
        .from("activities")
        .select("titulo, reference_image")
        .eq("id", activityId)
        .maybeSingle();
      if (cancelled) return;
      if (activityError) {
        setState({ status: "error", image: null });
        return;
      }
      if (!activity) {
        setState({ status: "missing", image: null });
        return;
      }

      if (proofId) {
        const { data: proof, error: proofError } = await supabase
          .from("activity_proofs")
          .select("file_name, file_url")
          .eq("activity_id", activityId)
          .eq("id", proofId)
          .maybeSingle();
        if (cancelled) return;
        if (proofError) setState({ status: "error", image: null });
        else if (!proof?.file_url) setState({ status: "missing", image: null });
        else setState({ status: "ready", image: { title: proof.file_name, src: proof.file_url } });
        return;
      }

      if (activity.reference_image) {
        setState({ status: "ready", image: { title: activity.titulo, src: activity.reference_image } });
      } else {
        setState({ status: "missing", image: null });
      }
    }
    void load().catch(() => {
      if (!cancelled) setState({ status: "error", image: null });
    });
    return () => { cancelled = true; };
  }, [activityId, proofId, revision]);

  return { ...state, retry: () => setRevision((current) => current + 1) };
}
