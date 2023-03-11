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
  amount: number;
  /**
   * 价值($)
   */
  value: number;
}

export const core = {
  deafultAddress: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  async getTokens(address?: string): Promise<Token[]> {
    const tokens = await http.get(
      'https://openapi.debank.com/v1/user/token_list?is_all=false&id=' +
        (address ?? core.deafultAddress),
      undefined,
      {
        headers: {
          Referer: 'https://fans3.5degrees.io/',
        },
      },
    );
    return (isArray(tokens) ? tokens : [])
      .filter((e) => {
        // 只取价值大于 $1 的币
        return e.amount * e.price > 1;
      })
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
  },
};
