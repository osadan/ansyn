import { EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { CaseMapExtent, CaseMapPosition } from '@ansyn/core/models/case-map-position.model';
import { GeoJsonObject, Point } from 'geojson';

export interface ImageryMapMetaData {
	deps?: any[];
	mapType?: string;
}

export interface BaseImageryMapConstructor extends ImageryMapMetaData {
	groupLayers: Map<string, any>;

	new(...args): BaseImageryMap;

	addGroupLayer(layer: any, groupName: string);

	removeGroupLayer(layer: any, groupName: string);

	addGroupVectorLayer(layer: any, groupName: string);
}

export abstract class BaseImageryMap<T = any> {
	static groupLayers = new Map<string, any>();
	public positionChanged: EventEmitter<CaseMapPosition> = new EventEmitter<CaseMapPosition>();
	public mapObject: T;

	static addGroupLayer(layer: any, groupName: string) {
	}

	static removeGroupLayer(id: string, groupName: string) {
	}

	static addGroupVectorLayer(layer: any, groupName: string) {
	}

	abstract getCenter(): Observable<Point>;

	abstract setCenter(center: Point, animation: boolean): Observable<boolean>;

	abstract toggleGroup(groupName: string);

	abstract initMap(element: HTMLElement, layers?: any, position?: CaseMapPosition): Observable<boolean>;

	/**
	 * @description Reset the Map view with a new view with the new layer projection (NOTE: also Delete's previous layers)
	 * @param layer The new layer to set the view with. this layer projection will be the views projection
	 * @param extent The extent (bounding box points) of the map at ESPG:4326
	 */
	abstract resetView(layer: any, position: CaseMapPosition, extent?: CaseMapExtent): Observable<boolean>;

	abstract addLayer(layer: any): void;

	abstract getLayers(): any[];

	abstract removeLayer(layer: any): void;

	abstract setPosition(position: CaseMapPosition): Observable<boolean>;

	abstract setRotation(rotation: number): void;

	abstract getRotation(): number;

	abstract getPosition(): Observable<CaseMapPosition>;

	abstract updateSize(): void;

	abstract addGeojsonLayer(data: GeoJsonObject);

	abstract dispose(): void;

	abstract addLayerIfNotExist(layer: any);
}