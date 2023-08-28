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
    const _tokens: any[] = [];
    const address = _address ?? core.deafultAddress;
    for (const chain of [1, 56, 137]) {
      const datas = await http.proxy.get(
        `https://account.metafi.codefi.network/accounts/${address}/?includePrices=true&chainId=${chain}`,
        undefined,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/116.0',
            Origin: 'https://portfolio.metamask.io',
            Referer: 'https://portfolio.metamask.io/',
            'Cache-Control': 'no-cache',
          },
        },
      );
      const chainIdMaps = {
        1: 'eth',
        56: 'bsc',
        137: 'matic',
      };
      if (datas?.nativeBalance) {
        const e = datas?.nativeBalance;
        _tokens.push({
          name: e.name,
          symbol: e.symbol,
          logo: e.iconUrl,
          chainId: e.chainId,
          chain:
            chainsMap[chainIdMaps[e.chainId] ?? -1]?.logo ?? chainsMap.eth.logo,
          amount: e.balance,
          value: e.value.marketValue,
        });
      }
      for (const e of datas?.tokenBalances ?? []) {
        _tokens.push({
          name: e.name,
          symbol: e.symbol,
          logo: e.iconUrl,
          chain:
            chainsMap[chainIdMaps[e.chainId] ?? -1]?.logo ?? chainsMap.eth.logo,
          amount: e.balance,
          value: e.value.marketValue,
        });
      }
    }
    // 只取价值大于 $1 的币
    const coins = _tokens.filter((e) => e.value > 1);
    // 总价值
    const total = formatNumber(coins.reduce((pre, e) => pre + e.value, 0));
    const tokens = coins
      .sort((a, b) => {
        // 按价值从高到低排序
        return b.value - a.value;
      })
      .map((e) => {
        // 格式化数据
        return {
          ...e,
          amount: formatNumber(e.amount),
          value: formatNumber(e.value),
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
  async getENSs(address?: string) {
    const query = {
      query: `
        query getNames($id: ID!) {
          account(id: $id) {
            domains(first: 100, where: {name_ends_with: ".eth"}) {
              name
              registration {
                registrationDate
                expiryDate
              }
            }
            wrappedDomains(first: 100, where: {name_ends_with: ".eth"}) {
              domain {
                name
                registration {
                  registrationDate
                  expiryDate
                }
              }
            }
          }
        }`,
      variables: { id: address?.toLowerCase() },
      operationName: 'getNames',
    };
    const response = await fetch(
      'https://api.thegraph.com/subgraphs/name/ensdomains/ens',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(query),
      },
    );
    const result = await response.json();
    return Array.from(
      new Set([
        ...result.data.account.domains.map((e: any) => e.name),
        ...result.data.account.wrappedDomains.map((e: any) => e.domain.name),
      ]),
    ).filter((e: string) => e.endsWith('.eth'));
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
    },
  ): Promise<NFT[]> {
    const { callback, max = 1000 } = option ?? {};
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

    const getNFTsMetamask = async (_next: any = undefined) => {
      const datas = await http.proxy.get(
        `https://nft.metafi.codefi.network/accounts/${address}/nfts?` +
          (_next != undefined
            ? _next.split('?')[1]
            : 'mediaItems=true&limit=250'),
        undefined,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/116.0',
            Origin: 'https://portfolio.metamask.io',
            Referer: 'https://portfolio.metamask.io/',
            'Cache-Control': 'no-cache',
          },
        },
      );
      let nfts = datas?.data ?? [];
      nfts = nfts.map((e) => {
        return {
          name: e.metadata?.name,
          desp: e.metadata?.description,
          image: nftSrc(
            e.mediaItems?.high?.url
              ? e.mediaItems?.high?.url
              : e.metadata?.image
              ? e.metadata?.image
              : e.metadata?.image_url
              ? e.metadata?.image_url
              : e.image
              ? e.image
              : e.tokenUrl,
          ),
          chain: e.chainId,
          // details
          isErc721: e.isErc721,
          isPossibleSpam: e.isPossibleSpam,
          tokenId: e.tokenId,
          contractAddress: e.tokenAddress,
          collectionName: e.name,
        };
      });
      const blackContracts = [
        '0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85',
        '0xe5193303ae1e909805f16f0fc19f1e23992d2351',
        '0x465ea4967479a96d4490d575b5a6cc2b4a4bee65',
        '0x9d13e3561c51ca3a5c5308e8528df7afd8de6485',
        '0x53a0018f919bde9c254bda697966c5f448ffddcb',
        '0x10d5e4da056ae64d0ed702698b6d8544a050b4eb',
        '0x90916ee6694dfe9c2979c8b05454d6db4612e5e3',
        '0xdfd3882f95c7109423b89ed9bac6f5800a6c2cf5',
        '0x53a0018f919bde9c254bda697966c5f448ffddcb',
        '0x26b8d77d189b5e4fbd95d695690576a544590b25',
        '0xe98d9f7b48a5c6d31fbe8a5f343cd3e96357f6ea',
      ];
      nfts = nfts.filter((e) => {
        return (
          isNotEmpty(e.name) &&
          isNotEmpty(e.image) &&
          e.isErc721 &&
          !e.isPossibleSpam &&
          !blackContracts.includes(e.contractAddress)
        );
      });
      const nextPage = datas?.nextPage;
      return {
        nfts,
        nextPage,
      };
    };

    let finalNFTs: NFT[] = [];
    let nextPage;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const result = await getNFTsMetamask(nextPage);
      finalNFTs = [...finalNFTs, ...result.nfts];
      callback?.(finalNFTs);
      nextPage = result.nextPage;
      if (finalNFTs.length >= max || isEmpty(result.nextPage)) {
        break;
      }
    }
    return finalNFTs;
  },
};
