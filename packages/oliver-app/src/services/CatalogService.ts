import { action, computed, makeObservable, observable } from "mobx";
import { Service } from "typedi";
import { Layer } from '../models/Layer';
import parser from 'fast-xml-parser';
import he from 'he';


type CatalogServiceAnnotations = '_layerTree' | '_ready' | 'setReady';

type CatalogTreeNode = {
	title: string;
	style?: string;
	name?: string;
	type?: 'tiled_overlay' | 'pt' | 'line' | 'poly';
	Layer?: CatalogTreeNode[];
	Folder?: CatalogTreeNode[];
}
@Service()
class CatalogService {
	get layerTree(): CatalogTreeNode[] {
		return this._layerTree;
	}

	get ready(): boolean {
		return this._ready;
	}

	private _layerTree: CatalogTreeNode[];
	private _ready: boolean = false;

	constructor() {
		this._layerTree = [];

		makeObservable<CatalogService, CatalogServiceAnnotations>(
			this,
			{
				_layerTree: observable,
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
					// attrNodeName: "attrs", //default is 'false'
					// textNodeName : "#text",
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
				this._layerTree = xml.FolderSet.Folder as CatalogTreeNode[];
			})

		// TODO:  Fetch layers from folderset xml

	}
}

export { CatalogService, CatalogTreeNode };