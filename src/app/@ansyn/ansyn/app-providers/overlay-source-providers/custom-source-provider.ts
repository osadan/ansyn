import { BaseOverlaySourceProvider , IFetchParams, IStartAndEndDate } from "@ansyn/overlays";
import { Injectable, Inject } from "@angular/core";
import { Observable, empty } from "rxjs";
import { IOverlaysFetchData, IOverlay, toRadians, LoggerService } from "@ansyn/core";
import { UUID } from "angular2-uuid";
import { MultiPolygon } from "GeoJSON";
import { multiPolygon } from "@turf/turf";
import { promise } from "selenium-webdriver";

export const CustumSourceType = "CUSTOM_SOURCE";
export const CustomOverlaysSourceConfig = 'customOverlaysSourceConfig';

@Injectable()
export class CustomSourceProvider extends BaseOverlaySourceProvider {
	sourceType = CustumSourceType;
	private overlayMetadata = {
		id: UUID.UUID(),
		footprint: multiPolygon([[[[34, 34], [34, 35], [35, 35], [35, 34], [34, 34]]]]).geometry,
		sensorType: "custom-sensor",
		sensorName:  "Custom-Name",
		bestResolution:  1,
		name: "my-custom-overlay",
		imageUrl: "http://localhost/mp-gw/wmts/s3%3A%252F%252Fmp-images%252F10056.tiff/band/Pixel/{z}/{x}/{y}.jpeg",
		thumbnailUrl: "http://localhost/mp-gw/wmts/s3%3A%252F%252Fmp-images%252F10056.tiff/band/Pixel/0/0/0.jpeg",
		date: new Date(2018, 8, 10, 10, 10, 10),
		photoTime: new Date(2018, 8, 10, 10, 10, 10).toDateString(),
		azimuth: toRadians(180),
		sourceType: this.sourceType,
		isGeoRegistered: false,
		projection: 'PIXEL',

	}

	// constructor(
	// 	protected loggerService: LoggerService,
	// 	@Inject(CustomOverlaysSourceConfig)
	// 	protected openAerialOverlaysSourceConfig: any) {
	// 	super(loggerService);
	// }
	
	

	fetch(fetchParams: IFetchParams): Observable<IOverlaysFetchData> {
		let res: IOverlaysFetchData = {
			data: [this.parseData()],
			limited: 0
		};
		return Observable.fromPromise(Promise.resolve(res));
	} 

	getStartDateViaLimitFacets(params: { facets, limit, region }): Observable<IStartAndEndDate> {
		return empty();
	}

	getById(id: string, sourceType: string = null): Observable<IOverlay> {
		if (id.localeCompare(this.overlayMetadata.id) !== 0 ) {
			return empty();
		}

		return Observable.fromPromise(Promise.resolve(this.parseData()));
	}

	getStartAndEndDateViaRangeFacets(params: { facets, limitBefore, limitAfter, date, region }): Observable<IStartAndEndDate> {
		return empty();
	}
	


	protected parseData(): IOverlay {
		let overlay: IOverlay = <IOverlay> {};
		overlay.id = this.overlayMetadata.id;
		overlay.footprint = this.overlayMetadata.footprint;
		overlay.sensorType = this.overlayMetadata.sensorType;
		overlay.sensorName = this.overlayMetadata.sensorName;
		overlay.bestResolution = this.overlayMetadata.bestResolution;
		overlay.name = this.overlayMetadata.name;
		overlay.imageUrl = this.overlayMetadata.imageUrl;
		overlay.thumbnailUrl = this.overlayMetadata.thumbnailUrl;
		overlay.date = this.overlayMetadata.date;
		overlay.photoTime = this.overlayMetadata.photoTime;
		overlay.azimuth = this.overlayMetadata.azimuth;
		overlay.sourceType = this.overlayMetadata.sourceType;
		overlay.isGeoRegistered = this.overlayMetadata.isGeoRegistered;
		overlay.tag = this.overlayMetadata;
		overlay.projection = this.overlayMetadata.projection;

		return overlay;
	}
}
