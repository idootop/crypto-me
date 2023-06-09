import { isEmpty } from './is';

export const timestamp = () => new Date().getTime();

export const delay = async (time: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, time));

export const printf = (...v: any[]) => console.log(...v);

export const printJson = (obj: any) =>
  console.log(JSON.stringify(obj, undefined, 4));

export const firstOf = <T = any>(datas?: T[]) =>
  datas ? (datas.length < 1 ? undefined : datas[0]) : undefined;

export const lastOf = <T = any>(datas?: T[]) =>
  datas ? (datas.length < 1 ? undefined : datas[datas.length - 1]) : undefined;

export const randomInt = (min: number, max?: number) => {
  if (!max) {
    max = min;
    min = 0;
  }
  return Math.floor(Math.random() * (max - min + 1) + min);
};

export const pickOne = <T = any>(datas: T[]) =>
  datas.length < 1 ? undefined : datas[randomInt(datas.length - 1)];

export const range = (start: number, end?: number) => {
  if (!end) {
    end = start;
    start = 0;
  }
  return Array.from({ length: end - start }, (_, index) => start + index);
};

export const toFixed = (n: number, fractionDigits = 2) => {
  const num = isEmpty(n) ? 0 : n;
  let s = num.toFixed(fractionDigits);
  while (s[s.length - 1] === '0') {
    s = s.substring(0, s.length - 1);
  }
  if (s[s.length - 1] === '.') {
    s = s.substring(0, s.length - 1);
  }
  return s;
};

export const formatNumber = (n: number, fractionDigits = 2) => {
  const num = isEmpty(n) ? 0 : n;
  if (num >= 1000000000) {
    return toFixed(num / 1000000000, fractionDigits) + 'B';
  }
  if (num >= 1000000) {
    return toFixed(num / 1000000, fractionDigits) + 'M';
  }
  if (num >= 1000) {
    return toFixed(num / 1000, fractionDigits) + 'K';
  }
  return toFixed(num, fractionDigits);
};

export const toSet = <T = any>(datas: T[], byKey?: (e: T) => any) => {
  if (byKey) {
    const keys = {};
    const newDatas: T[] = [];
    datas.forEach((e) => {
      const key = jsonEncode({ key: byKey(e) }) as any;
      if (!keys[key]) {
        newDatas.push(e);
        keys[key] = true;
      }
    });
    return newDatas;
  }
  return Array.from(new Set(datas));
};

export function jsonEncode(obj: any, prettier = false) {
  try {
    return prettier ? JSON.stringify(obj, undefined, 4) : JSON.stringify(obj);
  } catch (error) {
    return undefined;
  }
}

export function jsonDecode(json: string | undefined) {
  if (json == undefined) return undefined;
  try {
    return JSON.parse(json!);
  } catch (error) {
    return undefined;
  }
}
