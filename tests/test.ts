import { core } from '@/pages/core';
import { printJson } from '@/utils/base';

const main = async () => {
  const datas = await core.getToken();
  printJson(datas);
};

main();
