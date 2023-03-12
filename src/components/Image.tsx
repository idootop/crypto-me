import { forwardRef, useState } from 'react';

import { isEmpty } from '@/utils/is';
import { LNode } from '@/utils/types';

import { Box, BoxProps, getBoxProps } from './Box';

interface ImageProps extends BoxProps {
  src?: string;
  onLoad?: LNode;
  onError?: LNode;
}

export const Image = forwardRef((props: ImageProps, ref: any) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);

  const boxProps = getBoxProps({
    ...props,
    extStyle: {
      display: isLoaded ? 'block' : 'none',
      objectFit: 'cover',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    },
  });

  const {
    src,
    onLoad = <Box {...boxProps} />,
    onError = <Box {...boxProps} />,
  } = props;

  return isEmpty(src) ? (
    (onError as any)
  ) : (
    <>
      {(!isLoaded && !isError) ?? onLoad}
      <img
        ref={ref}
        src={src}
        {...boxProps}
        onLoad={() => setIsLoaded(true)}
        onError={() => setIsError(true)}
      />
      {isError ?? onError}
    </>
  );
});
