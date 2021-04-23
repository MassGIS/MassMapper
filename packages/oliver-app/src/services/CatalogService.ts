import { action, computed, makeObservable, observable } from "mobx";
import { Service } from "typedi";
import { Layer } from '../models/Layer';
import parser from 'fast-xml-parser';
import he from 'he';


type CatalogServiceAnnotations = '_layers' | '_ready' | 'setReady';

@Service()
class CatalogService {
	get layers(): Layer[] {
		return this._layers;
	}

	get ready(): boolean {
		return this._ready;
	}

	private readonly _layers: Layer[];
	private _ready: boolean = false;

	constructor() {
		this._layers = [];

		makeObservable<CatalogService, CatalogServiceAnnotations>(
			this,
			{
				_layers: observable,
				_ready: observable,
				setReady: action
			}
		);

		(async () => {
			await this.init();
			this.setReady(true);
		})();
	}

	private setReady(isReady: boolean) {
		this._ready = isReady;
	}

	private async init(): Promise<void> {
		// Stack order:  bottom-to-top.
		fetch('oliver_folderset.xml', {cache: "no-store"})
			.then(response => response.text())
			.then(text => {
				// I don't know how many of these are important!
				var options = {
					attributeNamePrefix : "",
					attrNodeName: "attr", //default is 'false'
					textNodeName : "#text",
					ignoreAttributes : false,
					ignoreNameSpace : true,
					allowBooleanAttributes : false,
					parseNodeValue : false,
					parseAttributeValue : true,
					trimValues: true,
					cdataTagName: "__cdata", //default is 'false'
					cdataPositionChar: "\\c",
					parseTrueNumberOnly: false,
					arrayMode: false, //"strict"
					attrValueProcessor: (val:string, attrName:string) => he.decode(val, {isAttributeValue: true}),//default is a=>a
					tagValueProcessor : (val:string, attrName:string) => he.decode(val), //default is a=>a
				};

				const xml = parser.parse(text, options);
			})

		// TODO:  Fetch layers from folderset xml

	}
}

export { CatalogService };