/* eslint-disable */
import { ISearchResult, ISearchResultItem, ISearchResultList } from './interfaces';

export function withResultItems(resultItems: ISearchResultItem[]) {
  return {
    byYear(year: string) {
      return withResultItems(
        resultItems.filter(
          (r: ISearchResultItem) => !!r.year && r.year.length >= 4 && r.year.startsWith(year)
        )
      );
    },
    artistStartsWith(query: string) {
      return withResultItems(
        resultItems.filter(
          (r: ISearchResultItem) =>
            (r.artist || '').toLowerCase().slice(0, query.length) === query.toLowerCase()
        )
      );
    },
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
    titleArtistContains(query: string) {
      return withResultItems(
        resultItems.filter((r: ISearchResultItem) =>
          `${r.title} - ${r.artist}`.toLowerCase().includes(query.toLowerCase())
        )
      );
    },
    titleStartsWithOrContains(query: string) {
      if (query.length !== 0) {
        const { titleStartsWith, titleArtistContains } = withResultItems(resultItems);
        return titleStartsWith(query).items.length !== 0
          ? titleStartsWith(query)
          : titleArtistContains(query);
      }
      return withResultItems([]);
    },
    titleArtistStartsWithOrContains(query: string) {
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
