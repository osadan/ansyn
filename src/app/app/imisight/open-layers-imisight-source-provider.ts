import TileLayer from 'ol/layer/tile';
import TileWMS from 'ol/source/tilewms';
import { HttpClient } from '@angular/common/http';
import { Inject } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { CacheService, ImageryCommunicatorService, ImageryMapSource } from '@ansyn/imagery';
import { ImisightOverlaySourceType } from './imisight-source-provider';
import { OpenLayersDisabledMap, OpenLayersMap } from '@ansyn/plugins';
import { ICaseMapState } from '@ansyn/core';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { OpenLayersMapSourceProvider } from '@ansyn/plugins';
import { IMapSourceProvidersConfig, MAP_SOURCE_PROVIDERS_CONFIG } from '@ansyn/core';

@ImageryMapSource({
	sourceType: ImisightOverlaySourceType,
	supported: [OpenLayersMap, OpenLayersDisabledMap]
})
export class OpenLayersImisightSourceProvider extends OpenLayersMapSourceProvider {
	gatewayUrl = 'https://gw.sat.imisight.net';

	constructor(protected cacheService: CacheService,
				protected imageryCommunicatorService: ImageryCommunicatorService,
				@Inject(MAP_SOURCE_PROVIDERS_CONFIG) protected mapSourceProvidersConfig: IMapSourceProvidersConfig,
				protected httpClient: HttpClient) {
		super(cacheService, imageryCommunicatorService, mapSourceProvidersConfig);
	}

	public create(metaData: ICaseMapState): any[] {
		const url = metaData.data.overlay.imageUrl;
		const layers = metaData.data.overlay.tag.urls;
		const projection = 'EPSG:3857';
		const token = localStorage.getItem('id_token');
		const helper = new JwtHelperService();
		const decodedToken = this.parseTokenObjects(helper.decodeToken(token));
		const companyId = decodedToken.user_metadata.companyId;
		const source = new TileWMS({
			url: `${this.gatewayUrl}/geo/geoserver/company_${companyId}/wms`,
			params: {
				TRANSPARENT: true,
				VERSION: '1.1.1',
				LAYERS: layers
				// FORMAT: 'image/gif'
			},
			serverType: 'geoserver',
			tileLoadFunction: (tile, src) => {
				this.getImageURL(src)
					.subscribe(
						(imgUrl): any => (<any>tile).getImage().src = imgUrl,
						err => {
							console.log('error ', err);
						});
			}
		});

		return [new TileLayer({ source })];
	}

	createAsync(metaData: ICaseMapState): Promise<any> {
		let layer = this.createOrGetFromCache(metaData);
		return Promise.resolve(layer[0]);
	}

	getImageURL(url: string): Observable<any> {
		const token = localStorage.getItem('access_token');
		const headers = {
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + token,
			'Accept': 'image/webp,image/*,*/*'
		};
		return this.httpClient
			.get(url, { headers: headers, responseType: 'blob' })
			.pipe(map(blob => URL.createObjectURL(blob)));
	}

	parseTokenObjects(obj: any): any {
		const str = JSON.stringify(obj);
		const trimmedStr = str.replace(new RegExp('https://imisight.net/', 'g'), '');
		return JSON.parse(trimmedStr);
	}
}
