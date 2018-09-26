import { OpenLayersDisabledMap, OpenLayersMap } from '@ansyn/plugins';
import { ICaseMapState } from '@ansyn/core';
import { ImageryMapSource } from '@ansyn/imagery';
import { OpenLayersMapSourceProvider } from './open-layers.map-source-provider';
import { CustomWmtsImageSource } from '../custom-utils/custom-tile-image-source';
import ImageLayer from 'ol/layer/image';

export const OpenLayerCustomSourceProviderSourceType = 'CUSTOM_SOURCE';

@ImageryMapSource({
	sourceType: OpenLayerCustomSourceProviderSourceType,
	supported: [OpenLayersMap, OpenLayersDisabledMap]
})
export class OpenLayerCustomImageSourceProvider extends OpenLayersMapSourceProvider {
	create(metaData: ICaseMapState): any[] {

		const source = CustomWmtsImageSource.create(3, metaData.data.overlay.imageUrl);

		const tiled = new ImageLayer({
			source: source,
			visible: true,
			extent: [ 0, 0, 4096, 4096]
		});
		return [tiled];
	}
	
	createAsync(metaData: ICaseMapState): Promise<any> {
		let layer = this.createOrGetFromCache(metaData);
		return Promise.resolve(layer[0]);
	}
}
