/* eslint-disable */
import { ISearchResult, ISearchResultItem, ISearchResultList } from './interfaces';

export function withResultItems(resultItems: ISearchResultItem[]) {
  return {
    titleStartsWith(query: string) {
      return withResultItems(
        resultItems.filter(
          (r: ISearchResultItem) =>
            r.title.toLowerCase().slice(0, query.length) === query.toLowerCase()
        )
      );
    },
    titleContains(query: string) {
      return withResultItems(
        resultItems.filter((r: ISearchResultItem) =>
          r.title.toLowerCase().includes(query.toLowerCase())
        )
      );
    },
    titleStartsWithOrContains(query: string) {
      if (query.length !== 0) {
        const { titleStartsWith, titleContains } = withResultItems(resultItems);
        return titleStartsWith(query).items.length !== 0
          ? titleStartsWith(query)
          : titleContains(query);
      }
      return withResultItems([]);
    },
    get songs() {
      return withResultItems(resultItems.filter((r: ISearchResultItem) => r.type === 'song'));
    },
    get items(): ISearchResultItem[] {
      return resultItems;
    }
  };
}

export function withResult(result: ISearchResult) {
  return {
    // // ArgumentAutocompleteResults verwacht enkel object. Output mag meerdere objecten bevatten
    // titleStartsWithOrContains(query: string): any { // eslint-ignore-line
    //   if (query.length !== 0) {
    //     const { titleStartsWith, titleContains } = withResultItems(
    //       result.navigation.lists[0].items
    //     );
    //     return (
    //       titleStartsWith(query).items.length !== 0
    //         ? titleStartsWith(query).items
    //         : titleContains(query).items
    //     ).map((i: ISearchResultItem) => {
    //       return { name: i.title, uri: i.uri };
    //     });
    //   }
    //   return [];
    // },
    get items(): ISearchResultItem[] {
      return result.navigation.lists[0].items;
    },
    get filter() {
      return withResultItems(result.navigation.lists[0].items);
    },
    get all() {
      const allItems = result.navigation.lists
        .map((l: ISearchResultList) => l.items)
        .reduce((a: ISearchResultItem[], c: ISearchResultItem[]) => a.concat(c));
      return {
        get items(): ISearchResultItem[] {
          return allItems;
        },
        get filter() {
          return withResultItems(allItems);
        }
      };
    }
  };
}
