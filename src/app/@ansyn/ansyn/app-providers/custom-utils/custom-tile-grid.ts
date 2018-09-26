import WMTS from 'ol/tilegrid/wmts';
import { olx } from 'openlayers';

export class CustomTileGrid {

	public static getTileGrid(numOfPyramidsLevels: number, imageWidth: number, imageHeight: number): WMTS {
		let resolutions = [];
		for (let i = 0; i < numOfPyramidsLevels; i++) {
			resolutions.push(Math.pow(2, numOfPyramidsLevels - i - 1));          
		}
		let matrixIds = []
		for (let i = 0; i < numOfPyramidsLevels; i++) {
			matrixIds.push(i);          
		}
		let extent: [number, number, number, number] = [0, 0, imageWidth, imageHeight];
		let options: olx.tilegrid.WMTSOptions = {
			tileSize : 512,
			resolutions : resolutions,
			matrixIds : matrixIds,
			extent : extent
		};
		return new WMTS(options);
	}
}
