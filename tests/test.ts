import { core } from '@/pages/core';
import { printJson } from '@/utils/base';

const main = async () => {
  const datas = await core.getPOAP();
  printJson(datas);
};

main();
