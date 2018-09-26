import { ProjectableRaster } from "./projectable-raster";
import { CustomImageProjection } from "./custom-image-projection";
import proj from 'ol/proj';
import { CustomTileGrid } from "./custom-tile-grid";
import TileImage from 'ol/source/tileimage';

const urlTemplate = '/{z}/{y}/{x}.png';

export class CustomWmtsImageSource extends ProjectableRaster {
	
	static create(numOfPyramidsLevels, url) {
		return new CustomWmtsImageSource(numOfPyramidsLevels, url);
	}

	constructor(numOfPyramidsLevels, url) {
		const projection  = new CustomImageProjection(numOfPyramidsLevels);
		proj.addProjection(projection);
		const width = 512 * Math.pow(2, numOfPyramidsLevels);
		const height = 512 * Math.pow(2, numOfPyramidsLevels);
		const tileGrid = CustomTileGrid.getTileGrid(numOfPyramidsLevels, width, height);
		const innerTileImageSource: TileImage = new TileImage({
			tileUrlFunction: function (tileCoord, pixelRatio, proj) {
				const z = tileCoord[0];
				const x = tileCoord[1];
				const y = -tileCoord[2] - 1;
				return url.replace('{z}', z.toString())
					.replace('{y}', y.toString())
					.replace('{x}', x.toString());
				
			},
			tileGrid: tileGrid,
			url: url,
			crossOrigin: 'Anonymous',
			projection: projection
		});

		super({
			sources: [innerTileImageSource],
			operation: function (pixels, data) {
				return pixels[0];
			},
			operationType: 'image'
		})
	}
}
