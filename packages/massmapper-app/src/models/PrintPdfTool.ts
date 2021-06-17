import { MapService } from "../services/MapService";
import { SimpleMapScreenshoter } from 'leaflet-simple-map-screenshoter';
import { jsPDF } from 'jspdf';
import { Tool, ToolPosition } from "./Tool";

import { MakeToolButtonComponent } from '../components/MakeToolButtonComponent';
import { ContainerInstance } from "typedi";
import { autorun, makeObservable, observable } from "mobx";

import massmapper from '../images/massmapper.png';
import { LegendService } from "../services/LegendService";
import { PrintPdfToolComponent } from "../components/PrintPdfToolComponent";


class PrintPdfTool extends Tool {

	protected _isButton = true;

	private _ss:SimpleMapScreenshoter;

	constructor(
		protected readonly _services:ContainerInstance,
		public readonly id:string,
		public position: ToolPosition,
		public readonly options:any
	) {
		super(_services,id,position,options);

		// makeObservable<PrintPdfTool,>(
		// 	this,
		// );

		const ms = this._services.get(MapService);
		autorun((r) => {
			if (!ms.leafletMap) {
				return;
			}

			this._ss = new SimpleMapScreenshoter({
				hideElementsWithSelectors: [
					'.leaflet-top.leaflet-left',
					'.leaflet-top.leaflet-right'
				],
				hidden: true,
				preventDownload: true
			}).addTo(ms.leafletMap);

			r.dispose();
		})
	}

	protected async _deactivate() {
		// no-op
	}

	protected async _activate() {
		// no-op
	}

	public component() {
		return PrintPdfToolComponent;
	}

	public async makePDF(title: string, filename: string): Promise<void> {
		const legendWidth = 200;
		const titleHeight = 50;
		const leftMargin = 20;

		const ls = this._services.get(LegendService);
		const ms = this._services.get(MapService);

		const image = await this._ss.takeScreen('image', {});
		const pdf = new jsPDF('l', 'pt', [ms.leafletMap!.getSize().x - 0, ms.leafletMap!.getSize().y]);

		pdf.text(title, pdf.internal.pageSize.getWidth() / 2, 30, {align: 'center'});

		const mapWidth = pdf.internal.pageSize.getWidth() - legendWidth - leftMargin;
		const ratio = mapWidth / pdf.internal.pageSize.getWidth();
		const mapHeight = (pdf.internal.pageSize.getHeight() - titleHeight) * ratio;
		pdf.addImage(String(image), 'PNG', leftMargin, titleHeight, mapWidth, mapHeight);
		pdf.addImage(massmapper, 'PNG', leftMargin + mapWidth - 129 - 3, titleHeight + mapHeight - 69 - 3, 129, 69);

		let legends: any[] = [];
		const layers = ls.enabledLayers.map(async (l, i) => {
			if (l.legendURL) {
				const legImg = new Image();
				legImg.src = l.legendURL;
				legImg.crossOrigin = 'Anonymous';
				await legImg.decode();

				const canvas = document.createElement('canvas');
				canvas.width = legImg.width;
				canvas.height = legImg.height;
				const context = canvas.getContext('2d');
				context?.drawImage(legImg, 0, 0);

				legends[i] = {
					title: l.title,
					img: {
						data: canvas.toDataURL('image/gif'),
						width: legImg.width,
						height: legImg.height
					}
				};
			}
			else {
				legends[i] = {
					title: l.title,
					img: null
				}
				return Promise.resolve();
			}
		});

		return Promise.all(layers).then(() => {
			let y = titleHeight + 20;

			legends.forEach(leg => {
				// Word wrap (trying near character(s) 20); H/T https://stackoverflow.com/a/51506718
				const title = leg.title.replace(
					/(?![^\n]{1,20}$)([^\n]{1,20})\s/g, '$1\n'
				);
				// Write it.
				pdf.text(title, leftMargin + mapWidth + 10, y);
				// Number of newlines
				const c = (title.match(/\n/g) || []).length;
				y += c * 20;
				if (leg.img) {
					y += 5;
					pdf.addImage(String(leg.img.data), 'PNG', leftMargin + mapWidth + 10, y, leg.img.width, leg.img.height);
					y += leg.img.height;
				}
				y += 25;
			})

			pdf.save(filename);
		});
	}
}


export { PrintPdfTool };