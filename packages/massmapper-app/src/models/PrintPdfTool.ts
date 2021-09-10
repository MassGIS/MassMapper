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
	private _watermarkUrl:string;

	constructor(
		protected readonly _services:ContainerInstance,
		public readonly id:string,
		public position: ToolPosition,
		public readonly options:any
	) {
		super(_services,id,position,options);

		this._watermarkUrl = options.watermarkUrl || massmapper;

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

	private getImageSize(src: string): Promise<Array<any>> {
		return new Promise((resolve, reject) => {
			let img = new Image();
			img.onload = () => resolve([img.width, img.height]);
			img.onerror = reject;
			img.src = src;
		})
	}

	public async makePDF(title: string, filename: string, size: string): Promise<void> {
		const legendWidth = 200;
		const titleHeight = 50;
		const leftMargin = 20;

		const ls = this._services.get(LegendService);
		const ms = this._services.get(MapService);

		// Not sure why but Safari will only show the overlays properly if we do a dry run (that we won't use)!
		await this._ss.takeScreen('image', {});
		const image = await this._ss.takeScreen('image', {});

		// https://github.com/MrRio/jsPDF/blob/ddbfc0f0250ca908f8061a72fa057116b7613e78/jspdf.js#L59
		const pdfSizes = {
			'letter': [792, 612],
			'legal': [1008, 612]
		}
		const pdfSize = pdfSizes[size];
		const pdf = new jsPDF('l', 'pt', pdfSize);

		// Scale the map to fit the page.
		let mapWindow = [pdfSize[0] - legendWidth - leftMargin, pdfSize[1] - titleHeight];
		let mapSize = [ms.leafletMap!.getSize().x - 0, ms.leafletMap!.getSize().y];
		if (mapSize[0] > mapWindow[0]) {
			const scaleFactor = mapWindow[0] / mapSize[0];
			mapSize = [mapWindow[0], mapSize[1] * scaleFactor];
			mapWindow = mapSize;
			if (mapSize[1] > mapWindow[1]) {
				const scaleFactor = mapWindow[1] / mapSize[1];
				mapSize = [mapSize[0] * scaleFactor, mapSize[1]];
			}
		}

		pdf.setFontSize(20);
		pdf.text(title, pdf.internal.pageSize.getWidth() / 2, 37, {align: 'center'});

		pdf.addImage(String(image), 'PNG', leftMargin, titleHeight, mapSize[0], mapSize[1]);

		// Scale the watermark to a width of 35px.  Assume the incoming original image's height >= 35.
		let watermarkWidth = 0;
		let watermarkHeight = 0;
		try {
			const watermarkSize = await this.getImageSize(this._watermarkUrl);
			watermarkHeight = 35;
			watermarkWidth = Math.round(watermarkHeight / watermarkSize[1] * watermarkSize[0]);
		} catch(e) {
			console.error("error adding watermark image", e);
		}

		try {
			pdf.addImage(
				this._watermarkUrl,
				'PNG',
				leftMargin + mapSize[0] - watermarkWidth,
				titleHeight + mapSize[1] - watermarkHeight,
				watermarkWidth,
				watermarkHeight
			);
		} catch (e) {
			console.error("error adding watermark image", e);
		}

		let legends: any[] = [];
		const layers = ls.enabledLayers.map(async (l, i) => {
			if (l.legendURL) {
				const legImg = new Image();
				legImg.crossOrigin = 'Anonymous';
				legImg.src = l.legendURL;
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
						width: legImg.width * 0.5,
						height: legImg.height * 0.5
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
			const paddingY = 10;
			let y = titleHeight + paddingY;

			pdf.setFontSize(10);
			legends.forEach(leg => {
				// Word wrap (trying near character(s) 40); H/T https://stackoverflow.com/a/51506718
				const title = leg.title.replace(
					/(?![^\n]{1,40}$)([^\n]{1,40})\s/g, '$1\n'
				);

				// Number of newlines
				const c = (title.match(/\n/g) || []).length;

				// Figure out if the bottom of the legend title + legend image would be off the page.
				// If so, start a new page, and assume that one title + image would fit on one page.
				const bottom = y + c * paddingY  + (leg.img ? (5 + leg.img.height) : 0);
				if (y > (titleHeight + paddingY) && (bottom > pdf.internal.pageSize.getHeight())) {
					pdf.addPage();
					y = titleHeight + paddingY;
				}

				// Write it.
				pdf.text(title, leftMargin + mapSize[0] + 10, y);
				y += c * paddingY;
				if (leg.img) {
					y += 5;
					pdf.addImage(String(leg.img.data), 'GIF', leftMargin + mapSize[0] + 10, y, leg.img.width, leg.img.height);
					y += leg.img.height;
				}
				y += paddingY + 5;
			})

			pdf.save(filename);
		});
	}
}


export { PrintPdfTool };