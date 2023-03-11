import { http } from '@/services/http';
import { formatNumber } from '@/utils/base';
import { isArray } from '@/utils/is';

import { chainsMap } from './chains';

interface Token {
  name: string;
  symbol: string;
  logo: string;
  /**
   * 区块链logo
   */
  chain: string;
  /**
   * 数量
   */
  amount: string;
  /**
   * 价值($)
   */
  value: string;
}

export const core = {
  deafultAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  async getToken(
    _address?: string,
  ): Promise<{ total: string; tokens: Token[] }> {
    const address = _address ?? core.deafultAddress;
    const datas = await http.get<any[]>(
      `https://openapi.debank.com/v1/user/token_list?is_all=false&id=${address}`,
      undefined,
      {
        headers: {
          Referer: 'https://fans3.5degrees.io/',
        },
      },
    );
    // 只取价值大于 $1 的币
    const coins = (isArray(datas) ? datas! : []).filter((e) => {
      return e.amount * e.price > 1;
    });
    // 总价值
    const total = formatNumber(
      coins.reduce((pre, e) => {
        pre + e.amount * e.price;
      }, 0),
    );
    const tokens = coins
      .sort((a, b) => {
        const value1 = a.amount * a.price;
        const value2 = b.amount * b.price;
        // 按价值从高到低排序
        return value2 - value1;
      })
      .map((e) => {
        // 格式化数据
        return {
          name: e.name,
          symbol: e.symbol,
          logo: e.logo_url,
          chain: chainsMap[e.chain]?.logo ?? chainsMap.eth.logo,
          amount: formatNumber(e.amount),
          value: formatNumber(e.amount * e.price),
        };
      });
    return { total, tokens };
  },
  async getENS(_address?: string) {
    const address = _address ?? core.deafultAddress;
    const data = {
      query: `{ account(id:"${address.toLowerCase()}") { domains { name } } }`,
    };
    const response = await http.post(
      'https://api.thegraph.com/subgraphs/name/ensdomains/ens',
      data,
    );
    const domains = response?.data?.account?.domains ?? [];
    return domains
      .map((e) => e.name)
      .sort((a, b) => {
        return a.localeCompare(b, undefined, {
          numeric: true,
          sensitivity: 'base',
        });
      });
  },
};
