import { createBrowserHistory, History } from 'history';
import { makeObservable, observable } from 'mobx';
import * as queryString from 'query-string';

type QueryParameter = string | boolean | object | undefined;

const history: History = createBrowserHistory({
	basename: '/'
});

class HistoryService {
	private static encodeObject(value: object): string {
		let prefix = 'uri';
		let data = value;

		if (data instanceof Map) {
			prefix += 'map';
			data = Array.from(data.entries()).reduce((dataObject, [ k, v ]) => {
				dataObject[k] = v;

				return dataObject;
			}, {});
		}

		return `${prefix}${encodeURIComponent(JSON.stringify(data))}`;
	}

	private static parseQueryString(query: string) {
		const queryParams = queryString.parse(query);
		const parsedQueryParams = new Map();

		for (const key of Object.keys(queryParams)) {
			if (queryParams[key] instanceof Array) {
				// just use the first value?
				queryParams[key] = (queryParams[key] as string[])[0];
			}

			if (queryParams[key] === 'true') {
				parsedQueryParams.set(key, true);
			} else if (queryParams[key] === 'false' || queryParams[key] === null) {
				parsedQueryParams.set(key, false);
			} else if ((queryParams[key] as string).startsWith('uri')) {
				let encodedData = (queryParams[key] as string).slice(3);
				let isMap = false;

				if (encodedData.startsWith('map')) {
					encodedData = encodedData.slice(3);
					isMap = true;
				}

				let data = JSON.parse(decodeURIComponent(encodedData));

				if (isMap) {
					data = Object.entries(data).reduce((dataMap, [ k, v ]) => dataMap.set(k, v), new Map());
				}

				parsedQueryParams.set(key, data);
			} else {
				parsedQueryParams.set(key, queryParams[key]);
			}
		}

		return parsedQueryParams;
	}

	private _currentLocationSearch: string;
	private _currentQueryParams: Map<string, QueryParameter>;

	constructor() {
		this._currentLocationSearch = history.location.search;
		this._currentQueryParams = HistoryService.parseQueryString(history.location.search);

		makeObservable<HistoryService, '_currentQueryParams'>( // see https://mobx.js.org/observable-state.html#limitations
			this, {
				_currentQueryParams: observable
			}
		);

		history.listen((location) => {
			if (this._currentLocationSearch !== location.search) {
				// don't wholesale replace the _currentQueryParams, because that triggers a mobx "change" for *all*
				// listened parameters.  Instead, delete any missing params, and update/insert any changed params
				const newParams = HistoryService.parseQueryString(location.search);

				// delete missing params
				Array.from(this._currentQueryParams.entries()).forEach(([ key]) => {
					!newParams.has(key) && this._currentQueryParams.delete(key);
				});

				// update/insert new params
				Array.from(newParams.entries()).forEach(([ key, value ]) => {
					(!this._currentQueryParams.has(key) || this._currentQueryParams.get(key) !== value) && this._currentQueryParams.set(key, value);
				});

				this._currentLocationSearch = location.search;
			}
		});
	}

	public get(queryParameter: string) {
		return this._currentQueryParams.get(queryParameter);
	}

	public has(queryParameter: string) {
		return !!this.get(queryParameter);
	}

	public set(queryParameters: string | object, newValue: QueryParameter) {
		let qs = queryString.parse(history.location.search);

		if (typeof queryParameters === 'string') {
			qs[queryParameters] = newValue && typeof newValue === 'object' ? HistoryService.encodeObject(newValue) : (newValue as string);
		} else if (typeof queryParameters === 'object') {
			for (const key of Object.keys(queryParameters)) {
				if (queryParameters[key] && typeof queryParameters[key] === 'object') {
					queryParameters[key] = HistoryService.encodeObject(queryParameters[key]);
				}
			}

			qs = { ...qs, ...queryParameters };
		}

		for (const key of Object.keys(qs)) {
			if (!qs[key]) {
				delete qs[key];
			}
		}

		history.push({
			...history.location,
			search: `?${queryString.stringify(qs)}`
		});
	}
}

export { history, HistoryService, QueryParameter };
