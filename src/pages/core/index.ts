import { JsonRpcProvider } from 'ethers';

import { http } from '@/services/http';
import { formatNumber } from '@/utils/base';
import { envs } from '@/utils/env';
import { isArray, isEmpty, isNotEmpty } from '@/utils/is';

import { chainsMap } from './chains';
import { NFT, POAP, Token } from './types';

export const core = {
  deafultAddress: '0xff8De76ad679E77aE3Dd1c8105b1A34c30990636',
  provider: new JsonRpcProvider('https://rpc.ankr.com/eth'),
  async getToken(
    _address?: string,
  ): Promise<{ total: string; tokens: Token[] }> {
    const address = _address ?? core.deafultAddress;
    const datas = await http.proxy.get<any[]>(
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
        return pre + e.amount * e.price;
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
    const ens = await core.provider
      .lookupAddress(address)
      .catch(() => undefined);
    const avatar = `https://cdn.stamp.fyi/avatar/eth:${address}?s=256`;
    return { ens, avatar };
  },
  async getENSs(_address?: string) {
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
  async getPOAP(_address?: string): Promise<POAP[]> {
    const address = _address ?? core.deafultAddress;
    const datas = await http.proxy.get(
      'https://api.poap.tech/actions/scan/' + address,
      undefined,
      {
        headers: {
          'x-api-key': envs.kPoapKey,
        },
      },
    );
    const poaps = (isArray(datas) ? datas : [])
      .sort((a, b) => {
        // 按创建时间从新到旧排序
        return b.created.localeCompare(a.created, undefined, {
          numeric: true,
          sensitivity: 'base',
        });
      })
      .map((e) => {
        // 格式化数据
        return {
          name: e.event.name,
          desp: e.event.description,
          image: e.event.image_url,
          year: e.event.year,
          // 详情
          url: e.event.event_url,
          country: e.event.country,
          city: e.event.city,
          start: e.event.start_date,
          end: e.event.end_date,
          supply: e.event.supply,
        };
      });

    return poaps;
  },
  async getNFT(
    _address?: string,
    option?: {
      callback?: (nfts: NFT[]) => void;
      max?: number;
      rainbow?: boolean;
    },
  ): Promise<NFT[]> {
    const { callback, max = 1000, rainbow = true } = option ?? {};
    const address = _address ?? core.deafultAddress;

    const _newIPFSClient = 'https://rss3.mypinata.cloud/ipfs/';
    const nftSrc = (_src: string) => {
      const src = isEmpty(_src) ? '' : _src;
      const ipfsURLs = src.split('/ipfs/');
      return src.startsWith('ipfs://')
        ? _newIPFSClient + src.substring(7)
        : ipfsURLs.length > 1
        ? _newIPFSClient + ipfsURLs[1]
        : src;
    };

    const getNFTs = async (pageToken = '') => {
      const data = {
        id: 1,
        jsonrpc: '2.0',
        method: 'ankr_getNFTsByOwner',
        params: {
          walletAddress: address,
          pageSize: 50, // 上限50
          pageToken, // 游标
          blockchain: [
            'eth',
            'bsc',
            'polygon',
            'optimism',
            'fantom',
            'avalanche',
            'arbitrum',
          ],
        },
      };
      const datas = await http.post('https://rpc.ankr.com/multichain/', data);
      let nfts = datas?.result?.assets ?? [];
      nfts = nfts.map((e) => {
        return {
          name: e.name,
          desp: e.description,
          image: nftSrc(e.imageUrl),
          chain: e.blockchain,
          // details
          tokenId: e.tokenId,
          contractAddress: e.contractAddress,
          contractType: e.contractType,
          collectionName: e.collectionName,
        };
      });
      nfts = nfts.filter((e) => {
        return (
          isNotEmpty(e.name) &&
          isNotEmpty(e.image) &&
          (e.contractType.includes('721') || e.contractType.includes('1155'))
        );
      });
      const nextPageToken = datas?.result?.nextPageToken;
      return {
        nfts,
        nextPageToken,
      };
    };

    const getNFTsRainbow = async (next = 'start') => {
      const datas = await http.proxy.get('https://rainbow.me/api/assets', {
        address: address,
        cursor: next,
      });
      let nfts = datas?.results ?? [];
      nfts = nfts.map((e) => {
        return {
          name: e.metadata.name,
          desp: e.metadata.description,
          image: nftSrc(e.metadata.image_url),
          chain: e.asset_contract.chain_identifier,
          // details
          tokenId: e.token_id,
          contractAddress: e.asset_contract.address,
          contractType: e.asset_contract.contract_standard,
          collectionName: e.collection.name,
        };
      });
      nfts = nfts.filter((e) => {
        return (
          isNotEmpty(e.name) &&
          isNotEmpty(e.image) &&
          (e.contractType.includes('721') || e.contractType.includes('1155'))
        );
      });
      const nextPageToken = datas?.next;
      return {
        nfts,
        nextPageToken,
      };
    };

    let finalNFTs: NFT[] = [];
    let nextPageToken;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const result = rainbow
        ? await getNFTsRainbow(nextPageToken)
        : await getNFTs(nextPageToken);
      finalNFTs = [...finalNFTs, ...result.nfts];
      callback?.(finalNFTs);
      nextPageToken = result.nextPageToken;
      if (finalNFTs.length >= max || isEmpty(result.nextPageToken)) {
        break;
      }
    }
    return finalNFTs;
  },
};
