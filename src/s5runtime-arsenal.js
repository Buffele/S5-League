export const S5RUNTIME_ARSENAL_CATALOG_URL='/assets/s5runtime/arsenal-catalog.json';

const STATUSES=new Set(['integrated','candidate','observed']);

export function validateArsenalCatalog(catalog){
  if(catalog?.format!=='s5runtime-arsenal-catalog-v1'||!Array.isArray(catalog.families))throw new TypeError('Invalid S5Runtime arsenal catalog');
  for(const family of catalog.families){
    if(typeof family.id!=='string'||!STATUSES.has(family.status)||typeof family.captureRequired!=='boolean')throw new TypeError(`Invalid S5Runtime weapon family: ${family?.id??'unknown'}`);
  }
  return catalog;
}

export async function loadS5RuntimeArsenalCatalog(fetcher=globalThis.fetch){
  const response=await fetcher(S5RUNTIME_ARSENAL_CATALOG_URL);
  if(!response.ok)throw new Error(`Unable to load S5Runtime arsenal catalog (${response.status})`);
  return validateArsenalCatalog(await response.json());
}

export function getPlayableWeaponFamilies(catalog){
  return validateArsenalCatalog(catalog).families.filter(family=>family.status==='integrated');
}

export function getNextWeaponCandidates(catalog){
  return validateArsenalCatalog(catalog).families.filter(family=>family.status==='candidate');
}
