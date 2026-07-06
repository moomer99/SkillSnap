import { useEffect, useState } from 'react';

const SUPABASE_CONFIGURED =
  typeof process !== 'undefined' &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-ref');

export function useEarlyBirdCount() {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) { setLoading(false); return; }
    import('@/lib/supabase').then(({ getAuthSupabase }) => {
      getAuthSupabase()
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_early_bird', true)
        .then(({ count: c }) => {
          setCount(Math.max(c ?? 0, 17));
          setLoading(false);
        })
        .catch(() => setLoading(false));
    });
  }, []);

  return { count, remaining: Math.max(0, 100 - count), loading, isFull: count >= 100 };
}
