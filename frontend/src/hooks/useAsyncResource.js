import { useCallback, useEffect, useState } from 'react';

/** Derive loading from the request identity and ignore superseded responses. */
export function useAsyncResource(loader, initialData = null) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState(null);
  useEffect(() => {
    let active = true;
    Promise.resolve().then(loader).then(
      (data) => { if (active) setResult({ loader, revision, data, error: '' }); },
      (error) => { if (active) setResult({ loader, revision, data: initialData, error: error.message || 'Could not load data' }); },
    );
    return () => { active = false; };
  }, [loader, revision, initialData]);
  const reload = useCallback(() => setRevision((value) => value + 1), []);
  const current = result?.loader === loader && result.revision === revision;
  return {
    data: current ? result.data : initialData,
    error: current ? result.error : '',
    loading: !current,
    reload,
  };
}
