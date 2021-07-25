/* eslint-disable */
import { ISearchResult, ISearchResultItem, ISearchResultList } from './interfaces';

/**
 * @interface
 * @property {function(string): SearchResultItemsQuery} byYear
 * @property {function(string): SearchResultItemsQuery} artistStartsWith
 * @property {function(string): SearchResultItemsQuery} titleStartsWith
 * @property {function(string): SearchResultItemsQuery} titleContains
 * @property {function(string): SearchResultItemsQuery} titleArtistContains
 * @property {function(string): SearchResultItemsQuery} titleStartsWithOrContains
 * @property {function(string): SearchResultItemsQuery} songs
 * @property {ISearchResultItem[]} ritems
 */
export interface SearchResultItemsQuery {
  byYear(year: string): SearchResultItemsQuery;
  artistStartsWith(query: string): SearchResultItemsQuery;
  titleStartsWith(query: string): SearchResultItemsQuery;
  titleContains(query: string): SearchResultItemsQuery;
  titleArtistContains(query: string): SearchResultItemsQuery;
  titleStartsWithOrContains(query: string): SearchResultItemsQuery;
  titleArtistStartsWithOrContains(query: string): SearchResultItemsQuery;
  songs(): SearchResultItemsQuery;
  readonly items: ISearchResultItem[];
}

/**
 * @interface
 * @property {function(): SearchResultItemsQuery} filter
 * @property {ISearchResultItem[]} items
 */
export interface SearchResultQueryResult {
  filter(): SearchResultItemsQuery;
  items: ISearchResultItem[];
}

/**
 * @interface
 * @property {function(): SearchResultQueryResult} all
 * @property {function(): SearchResultItemsQuery} filter
 * @property {function(): ISearchResultItem[]} items
 */
export interface SearchResultQuery {
  first(): SearchResultQueryResult;
  all(): SearchResultQueryResult;
}

/**
 *
 * @param {ISearchResultItem[]} resultItems
 * @returns {SearchResultItemsQuery}
 */
export function withResultItems(resultItems: ISearchResultItem[]): SearchResultItemsQuery {
  return new SearchResultItemsQueryImpl(resultItems);
}

/**
 * @class
 * @implements {SearchResultItemsQuery}
 */
class SearchResultItemsQueryImpl implements SearchResultItemsQuery {
  /**
   *
   * @param year
   * @returns {SearchResultItemsQuery}
   */
  byYear(year: string) {
    return withResultItems(
      this.items.filter(
        (r: ISearchResultItem) => !!r.year && r.year.length >= 4 && r.year.startsWith(year)
      )
    );
  }

  /**
   *
   * @param query
   * @returns {SearchResultItemsQuery}
   */
  artistStartsWith(query: string) {
    return withResultItems(
      this.items.filter(
        (r: ISearchResultItem) =>
          (r.artist || '').toLowerCase().slice(0, query.length) === query.toLowerCase()
      )
    );
  }

  /**
   *
   * @param query
   * @returns {SearchResultItemsQuery}
   */
  titleStartsWith(query: string) {
    return withResultItems(
      this.items.filter(
        (r: ISearchResultItem) =>
          r.title.toLowerCase().slice(0, query.length) === query.toLowerCase()
      )
    );
  }

  /**
   *
   * @param query
   * @returns {SearchResultItemsQuery}
   */
  titleContains(query: string) {
    return withResultItems(
      this.items.filter((r: ISearchResultItem) =>
        r.title.toLowerCase().includes(query.toLowerCase())
      )
    );
  }

  /**
   *
   * @param query
   * @returns {SearchResultItemsQuery}
   */
  titleArtistContains(query: string) {
    return withResultItems(
      this.items.filter((r: ISearchResultItem) =>
        `${r.title} - ${r.artist}`.toLowerCase().includes(query.toLowerCase())
      )
    );
  }

  /**
   *
   * @param query
   * @returns {SearchResultItemsQuery}
   */
  titleStartsWithOrContains(query: string) {
    if (query.length !== 0) {
      const { titleStartsWith, titleArtistContains } = withResultItems(this.items);
      return titleStartsWith(query).items.length !== 0
        ? titleStartsWith(query)
        : titleArtistContains(query);
    }
    return withResultItems([]);
  }

  /**
   *
   * @param {string} query
   * @returns {SearchResultItemsQuery}
   */
  titleArtistStartsWithOrContains(query: string) {
    if (query.length !== 0) {
      const { titleStartsWith, titleContains } = withResultItems(this.items);
      return titleStartsWith(query).items.length !== 0
        ? titleStartsWith(query)
        : titleContains(query);
    }
    return withResultItems([]);
  }

  /**
   *
   * @returns {SearchResultItemsQuery}
   */
  songs() {
    return withResultItems(this.items.filter((r: ISearchResultItem) => r.type === 'song'));
  }

  /**
   *
   */
  public readonly items: ISearchResultItem[];

  constructor(resultItems: ISearchResultItem[]) {
    this.items = resultItems;
  }
}

/**
 *
 * @param {ISearchResult} result
 * @returns {object} result
 */
export function withResult(result: ISearchResult): SearchResultQuery {
  return new SearchResultQueryImpl(result);
}

/**
 * @class
 * @implements {SearchResultQuery}
 */
class SearchResultQueryImpl implements SearchResultQuery {
  /**
   *
   * @returns {SearchResultQueryResult}
   */
  first(): SearchResultQueryResult {
    return new SearchResultQueryResultImpl(this._result.navigation.lists[0].items);
  }

  /**
   *
   * @returns {SearchResultQueryResult}
   */
  all(): SearchResultQueryResult {
    const allItems = this._result.navigation.lists
      .map((l: ISearchResultList) => l.items)
      .reduce((a: ISearchResultItem[], c: ISearchResultItem[]) => a.concat(c));
    return new SearchResultQueryResultImpl(allItems);
  }
  constructor(result: ISearchResult) {
    this._result = result;
  }
  private readonly _result: ISearchResult;
}

/**
 * @class
 * @implements {SearchResultQueryResult}
 */
class SearchResultQueryResultImpl implements SearchResultQueryResult {
  constructor(result: ISearchResultItem[]) {
    this.items = result;
  }

  /**
   *
   * @returns {SearchResultItemsQuery}
   */
  public filter() {
    return withResultItems(this.items);
  }

  /**
   *
   */
  public readonly items: ISearchResultItem[];
}
