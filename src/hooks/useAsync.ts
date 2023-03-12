import { useEffect, useState } from 'react';

import { cache } from '@/services/cache';

export const useAsync = <T = any>(
  run: () => Promise<T | undefined>,
  props?: { immediately?: boolean; cacheKey?: string },
): {
  loading: boolean;
  value: T | undefined;
  run: () => Promise<T | undefined>;
} => {
  const { immediately = true, cacheKey } = props ?? {};
  const [datas, setDatas] = useState({
    loading: false,
    value: undefined,
  });
  const _run = async () => {
    if (datas.loading) return;
    setDatas({
      loading: true,
      value: datas.value,
    });
    const value = cacheKey
      ? await cache.readOrWrite(cacheKey, run)
      : await run();
    setDatas({
      loading: false,
      value: value as any,
    });
    return value;
  };
  useEffect(() => {
    if (immediately) {
      _run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return {
    loading: datas.loading,
    value: datas.value,
    run: _run,
  };
};

export const useAsyncWithCallback = <T = any>(
  run: (callback: (v: T) => void) => Promise<T | undefined>,
  props?: { immediately?: boolean; cacheKey?: string },
): {
  loading: boolean;
  value: T | undefined;
  run: (callback: (v: T) => void) => Promise<T | undefined>;
} => {
  const { immediately = true, cacheKey } = props ?? {};
  const [datas, setDatas] = useState({
    loading: false,
    value: undefined,
  });
  const _run = async () => {
    if (datas.loading) return;
    setDatas({
      loading: true,
      value: datas.value,
    });
    const value = cacheKey
      ? await cache.readOrWrite(cacheKey, async () => {
          return await run((datas) => {
            setDatas({
              loading: false,
              value: datas as any,
            });
          });
        })
      : await run((datas) => {
          setDatas({
            loading: false,
            value: datas as any,
          });
        });
    setDatas({
      loading: false,
      value: value as any,
    });
    return value;
  };
  useEffect(() => {
    if (immediately) {
      _run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return {
    loading: datas.loading,
    value: datas.value,
    run: _run,
  };
};
