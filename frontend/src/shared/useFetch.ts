import { useEffect, useState } from "react";
import { api } from "./api.ts";

/** Ignora respostas antigas quando a URL muda ou a página é desmontada. */
export function useFetch<T>(path: string | null, revision = 0) {
  const [result, setResult] = useState<{ path: string | null; revision: number; data: T | null; error: string } | null>(null);
  useEffect(() => {
    if (!path) return;
    let ignore = false;
    api<T>(path).then(
      (data) => { if (!ignore) setResult({ path, revision, data, error: "" }); },
      (error: Error) => { if (!ignore) setResult({ path, revision, data: null, error: error.message }); },
    );
    return () => { ignore = true; };
  }, [path, revision]);
  const current = result?.path === path && result?.revision === revision;
  return { data: current ? result.data : null, error: current ? result.error : "", loading: Boolean(path) && !current };
}
