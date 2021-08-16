import { action, autorun, makeObservable, observable, runInAction } from "mobx";
import { ContainerInstance, Service } from "typedi";
import parser from 'fast-xml-parser';
import he from 'he';
import XMLParser from 'react-xml-parser';
import { ConfigService } from "./ConfigService";

type CatalogServiceAnnotations = '_layerTree' | '_ready' | '_uniqueLayers';

type CatalogTreeNode = {
	title: string;
	style?: string;
	name?: string;
	type?: 'tiled_overlay' | 'pt' | 'line' | 'poly';
	agol?: string;
	query?: string;
	Layer?: CatalogTreeNode[];
	Folder?: CatalogTreeNode[];
}

@Service()
class CatalogService {
	get layerTree(): CatalogTreeNode[] {
		return this._layerTree;
	}

	get uniqueLayers(): any[] {
		return this._uniqueLayers;
	}

	get ready(): boolean {
		return this._ready;
	}

	private _layerTree: CatalogTreeNode[];
	private _uniqueLayers: any[];
	private _ready: boolean = false;

	constructor(private readonly _services: ContainerInstance) {
		this._layerTree = [];
		this._uniqueLayers = [];

		makeObservable<CatalogService, CatalogServiceAnnotations>(
			this,
			{
				_layerTree: observable,
				_uniqueLayers: observable,
				_ready: observable,
			}
		);

		autorun(async (r) => {
			const cs = this._services.get(ConfigService);
			if (!cs.ready) {
				return;
			}

			await this.init(cs);
			runInAction(() => {
				this._ready = true;
			})
			r.dispose();
		});
	}

	private async init(cs:ConfigService): Promise<void> {
		// Stack order:  bottom-to-top.

		await fetch(cs.folderSet, { cache: "no-store" })
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

				// This is painfully inefficient, but the original xmlLayers.getElementsByTagName wouldn't ignore comments!
				let layers: any[] = [];
				const f = function(obj: any, stack: any) {
					for (var property in obj) {
						if (obj.hasOwnProperty(property)) {
							if (typeof obj[property] === "object") {
								f(obj[property], stack + '.' + property);
							}
							else if (/\.Layer\.\d+$/.test(stack)) {
								// Only record unique titles.
								if (!layers.find(l => l.title === obj.title)) {
									layers.push(obj);
								}
							}
						}
					}
				}
				f(xml.FolderSet[0], 'ROOT')
				this._uniqueLayers = layers.sort((a, b) => {
					return a.title.toLowerCase() > b.title.toLowerCase() ? 1 : -1;
				});
			});
	}
}

export { CatalogService, CatalogTreeNode };