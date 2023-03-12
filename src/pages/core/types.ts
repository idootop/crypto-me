export interface Chain {
  id: number;
  symbol: string;
  name: string;
  logo: string;
}

export interface Token {
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

export interface POAP {
  name: string;
  desp: string;
  image: string;
  year: string;
  /**
   * 活动链接
   */
  url: string;
  country: string;
  city: string;
  /**
   * 活动开始时间
   */
  start: string;
  /**
   * 活动结束时间
   */
  end: string;
  /**
   * 发行数量
   */
  supply: number;
}

export interface NFT {
  name: string;
  desp?: string;
  image: string;
  chain: string;
  // details
  tokenId: string;
  contractAddress: string;
  contractType: 'ERC721' | 'ERC1155';
  collectionName: string;
}
