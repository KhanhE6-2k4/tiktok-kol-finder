import {
  isValidSocialContent,
  rangeFilterSocialContent,
  deduplicateSocialContent
} from '../../discovery/filter.js';

export class DiscoveryService {
  constructor({ providerRegistry }) {
    this.providerRegistry = providerRegistry;
  }

  async discover(criteria) {
    const provider = this.providerRegistry.get(criteria.platform);
    const items = await provider.discover(criteria);

    let contents = items.map(item => provider.normalize(
      item,
      {
        keyword: item.searchQuery ?? ''
      })
    );

    contents = contents.filter(isValidSocialContent);

    contents = rangeFilterSocialContent(contents, criteria.filters ?? {});

    contents = deduplicateSocialContent(contents);

    return contents;
  }
  // async discover(criteria) {
  //     const provider = this.providerRegistry.get(criteria.platform);

  //     const items = await provider.discover(criteria);

  //     console.log('1. RAW ITEMS:', items.length);

  //     let contents = items.map(item =>
  //         provider.normalize(item, {
  //             keyword: item.searchQuery ?? ''
  //         })
  //     );

  //     console.log('2. AFTER NORMALIZE:', contents.length);

  //     console.log(
  //         '3. FIRST NORMALIZED:',
  //         JSON.stringify(contents[0], null, 2)
  //     );

  //     contents = contents.filter(isValidSocialContent);

  //     console.log('4. AFTER VALIDATION:', contents.length);

  //     contents = rangeFilterSocialContent(
  //         contents,
  //         criteria.filters ?? {}
  //     );

  //     console.log('5. AFTER FILTER:', contents.length);

  //     contents = deduplicateSocialContent(contents);

  //     console.log('6. AFTER DEDUP:', contents.length);

  //     return contents;
  // }
}
