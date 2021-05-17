import { action, makeObservable, observable } from "mobx";
import { ContainerInstance, Service } from "typedi";
import parser from 'fast-xml-parser';
import he from 'he';
import XMLParser from 'react-xml-parser';



type CatalogServiceAnnotations = '_layerTree' | '_ready' | 'setReady';

type CatalogTreeNode = {
	title: string;
	style?: string;
	name?: string;
	type?: 'tiled_overlay' | 'pt' | 'line' | 'poly';
	agol?: string;
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

	constructor(private readonly _services: ContainerInstance) {
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
		fetch('http://massgis.2creek.com/oliver-data/temp/oliver_folderset.xml', { cache: "no-store" })
			.then(response => response.text())
			.then(text => {
				// I don't know how many of these are important!
				const options = {
					attributeNamePrefix: "",
					// attrNodeName: "attrs", //default is 'false'
					// textNodeName : "#text",
					ignoreAttributes: false,
					ignoreNameSpace: true,
					allowBooleanAttributes: false,
					parseNodeValue: false,
					parseAttributeValue: true,
					trimValues: true,
					cdataTagName: "__cdata", //default is 'false'
					cdataPositionChar: "\\c",
					parseTrueNumberOnly: false,
					arrayMode: true, //"strict"
					attrValueProcessor: (val: string, attrName: string) => he.decode(val, { isAttributeValue: true }),//default is a=>a
					tagValueProcessor: (val: string, attrName: string) => he.decode(val) //default is a=>a
				};

				const xml = parser.parse(text, options);
				this._layerTree = [ xml.FolderSet[0] ];

				const xmlLayers = new XMLParser().parseFromString(text);    // Assume xmlText contains the example XML
				console.log(xmlLayers);
				console.log(xmlLayers.getElementsByTagName('Layer'));
			});
	}
}

export { CatalogService, CatalogTreeNode };