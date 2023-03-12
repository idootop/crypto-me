import './style.css';

import { Box } from '@/components/Box';
import { Center, Column, Expand, Row } from '@/components/Flex';
import { Image } from '@/components/Image';
import { Stack } from '@/components/Stack';
import { Position } from '@/components/Stack/position';
import { Text } from '@/components/Text';
import { useAsync, useAsyncWithCallback } from '@/hooks/useAsync';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useInit } from '@/services/store/useStore';
import { range } from '@/utils/base';

import { core } from './core';
import { NFT, POAP, Token } from './core/types';

function useQueryParam(key: string) {
  return useInit(() => {
    const params = new URL(window.location as any).searchParams;
    return params.get(key);
  });
}

function useAPP() {
  const address =
    useQueryParam('address') ?? '0xff8De76ad679E77aE3Dd1c8105b1A34c30990636';
  const { loading: ensLoading, value: ens } = useAsync(
    () => core.getENS(address),
    { cacheKey: address + '-ens' },
  );
  const { loading: tokenLoading, value: tokens } = useAsync(
    () => core.getToken(address),
    { cacheKey: address + '-token' },
  );
  const { loading: poapLoading, value: poaps = [] } = useAsync(
    () => core.getPOAP(address),
    { cacheKey: address + '-poap' },
  );
  const { loading: nftLoading, value: nfts = [] } = useAsyncWithCallback(
    (callback) => core.getNFT(address, { callback }),
    { cacheKey: address + '-nft' },
  );
  const { isMobile } = useBreakpoint();
  return {
    address:
      address.substring(0, 6) +
      '...' +
      address.substring(address.length - 4, address.length),
    ens,
    ensLoading,
    total: tokens?.total ?? '0',
    tokens: tokens?.tokens ?? [],
    tokenLoading,
    poaps,
    poapLoading,
    nfts,
    nftLoading,
    isMobile,
  };
}

export const App = () => {
  const { address, ens, tokens, poaps, nfts, total, isMobile } = useAPP();

  const $UserAvatar = (
    <Column padding="40px">
      <Image
        src={ens?.avatar}
        size="80px"
        borderRadius="50%"
        background="#fff"
      />
      <Text maxLines={1} fontSize="18px" fontWeight="bold" padding="20px">
        {ens?.ens ?? address}
      </Text>
    </Column>
  );

  const $Tokens =
    tokens.length < 1 ? (
      <Box />
    ) : (
      <>
        <Row width="100%" justifyContent="space-between" margin="8px 0">
          <Text maxLines={1} fontSize="18px" fontWeight="700">
            Tokens
          </Text>
          <Text maxLines={1} fontSize="16px" fontWeight="700">
            {total}
          </Text>
        </Row>
        <Row width="100%" flexWrap="wrap" justifyContent="center">
          {tokens.map((e, idx) => {
            return (
              <TokenWidget
                key={e.name + e.symbol + idx}
                token={e}
                isMobile={isMobile}
              />
            );
          })}
          {range(10).map((e) => {
            return (
              <Box
                key={e}
                width={isMobile ? '150px' : '300px'}
                margin="0 8px"
              />
            );
          })}
        </Row>
      </>
    );

  const $POAPs =
    poaps.length < 1 ? (
      <Box />
    ) : (
      <Column margin="8px 0" width="100%">
        <Row width="100%" justifyContent="space-between" margin="8px 0">
          <Text maxLines={1} fontSize="18px" fontWeight="700">
            POAPs
          </Text>
          <Text maxLines={1} fontSize="16px" fontWeight="700">
            {poaps.length}
          </Text>
        </Row>
        {poaps.map((e, idx) => {
          return <POAPWidget key={e.name + e.desp + idx} poap={e} />;
        })}
      </Column>
    );

  const $NFTs =
    nfts.length < 1 ? (
      <Box />
    ) : (
      <>
        <Row width="100%" justifyContent="space-between" margin="16px 0">
          <Text maxLines={1} fontSize="18px" fontWeight="700">
            NFTs
          </Text>
          <Text maxLines={1} fontSize="16px" fontWeight="700">
            {nfts.length}
          </Text>
        </Row>
        <Box width="100%" className="nft-list">
          {nfts.map((e: NFT, idx) => {
            return <NFTWidget key={e.name + e.image + idx} nft={e} />;
          })}
        </Box>
      </>
    );

  return (
    <Center
      width="100%"
      padding={isMobile ? '20px' : '50px'}
      className="hide-scollbar"
    >
      <Center width="100%" maxWidth="1024px">
        {$UserAvatar}
        {$Tokens}
        {$POAPs}
        {$NFTs}
      </Center>
    </Center>
  );
};

const TokenWidget = (props: { token: Token; isMobile: boolean }) => {
  const { token, isMobile } = props;
  return isMobile ? (
    <Row
      width="100%"
      maxWidth="150px"
      background="#fff"
      margin="8px"
      padding="10px 16px"
      borderRadius="8px"
      overflow="none"
    >
      <Stack>
        <Image
          src={token.logo}
          size={isMobile ? '36px' : '48px'}
          borderRadius="50%"
        />
        <Position align="bottomRight">
          <Image src={token.chain} size="16px" borderRadius="50%" />
        </Position>
      </Stack>
      <Expand padding="0 16px">
        <Column alignItems="start">
          <Text maxLines={1} fontSize="16px" fontWeight="400">
            {token.symbol}
          </Text>
          <Text maxLines={1} fontSize="16px" fontWeight="700">
            ${token.value}
          </Text>
        </Column>
      </Expand>
    </Row>
  ) : (
    <Row
      width="100%"
      maxWidth="300px"
      background="#fff"
      margin="8px"
      padding="10px 16px"
      borderRadius="8px"
      overflow="none"
    >
      <Stack>
        <Image
          src={token.logo}
          size={isMobile ? '36px' : '48px'}
          borderRadius="50%"
        />
        <Position align="bottomRight">
          <Image src={token.chain} size="16px" borderRadius="50%" />
        </Position>
      </Stack>
      <Expand padding="0 16px">
        <Text maxLines={1} fontSize="16px" fontWeight="400">
          {token.symbol}
        </Text>
      </Expand>
      <Column alignItems="end">
        <Text maxLines={1} fontSize="16px" fontWeight="700">
          ${token.value}
        </Text>
        <Text maxLines={1} color="#666666">
          {token.amount}
        </Text>
      </Column>
    </Row>
  );
};

const POAPWidget = (props: { poap: POAP }) => {
  const { poap } = props;
  return (
    <Row width="100%" padding="8px 0">
      <Image
        src={poap.image}
        size="64px"
        borderRadius="50%"
        background="#fff"
      />
      <Expand padding="0 16px">
        <Column alignItems="start">
          <Text
            maxLines={1}
            fontSize="16px"
            fontWeight="500"
            marginBottom="4px"
          >
            {poap.name}
          </Text>
          <Text maxLines={2} fontSize="12px" lineHeight="18px" color="#666">
            {poap.desp}
          </Text>
        </Column>
      </Expand>
      <Text fontSize="14px" maxLines={1}>
        {poap.year}
      </Text>
    </Row>
  );
};

const NFTWidget = (props: { nft: NFT }) => {
  const { nft } = props;
  return (
    <Column>
      <Box
        className="aspect-ratio-1-1"
        width="100%"
        borderRadius="10px"
        background="#fff"
        overflow="hidden"
      >
        <Image size="100%" src={nft.image} />
      </Box>
      <Text fontSize="14px" maxLines={1} marginTop="8px">
        {nft.name}
      </Text>
    </Column>
  );
};
