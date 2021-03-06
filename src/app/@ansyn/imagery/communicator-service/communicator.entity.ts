import {
	ComponentFactoryResolver,
	ComponentRef,
	EventEmitter,
	Inject,
	Injectable,
	Injector,
	OnDestroy,
	OnInit,
	ViewContainerRef
} from '@angular/core';
import { BaseImageryPlugin } from '../model/base-imagery-plugin';
import { BaseImageryMap, IBaseImageryMapConstructor } from '../model/base-imagery-map';
import { forkJoin, merge, Observable, of, throwError } from 'rxjs';
import { CaseMapExtent, ICaseMapPosition, ICaseMapState } from '@ansyn/core';
import { GeoJsonObject, Point } from 'geojson';
import { ImageryCommunicatorService } from '../communicator-service/communicator.service';
import { BaseImageryVisualizer } from '../model/base-imagery-visualizer';
import { filter, map, mergeMap, tap } from 'rxjs/operators';
import { IMAGERY_MAPS, ImageryMaps } from '../providers/imagery-map-collection';
import { BaseMapSourceProvider } from '../model/base-map-source-provider';
import { MapComponent } from '../map/map.component';
import { BaseImageryPluginProvider } from '../imagery/providers/imagery.providers';
import { Store } from '@ngrx/store';
import { AutoSubscription, AutoSubscriptions } from 'auto-subscriptions';

export interface IMapInstanceChanged {
	id: string;
	newMapInstanceName: string;
	oldMapInstanceName: string;
}

@Injectable()
@AutoSubscriptions({
	init: 'ngOnInit',
	destroy: 'ngOnDestroy'
})
export class CommunicatorEntity implements OnInit, OnDestroy {
	public mapSettings: ICaseMapState;
	public mapComponentElem: ViewContainerRef;
	private _mapComponentRef: ComponentRef<MapComponent>;
	private _activeMap: BaseImageryMap;
	private _virtualNorth = 0;
	public mapInstanceChanged: EventEmitter<IMapInstanceChanged> = new EventEmitter<IMapInstanceChanged>();

	@AutoSubscription
	activeMap$ = () => merge(this.imageryCommunicatorService.instanceCreated, this.mapInstanceChanged)
		.pipe(
			filter(({ id }) => id === this.id),
			tap(this.initPlugins.bind(this))
		);

	get plugins() {
		return this._mapComponentRef.instance.plugins;
	}

	get visualizers(): BaseImageryVisualizer[] {
		return <any> this.plugins.filter(plugin => plugin instanceof BaseImageryVisualizer);
	}

	getMapSourceProvider({ mapType, sourceType }: { mapType?: string, sourceType: string }): BaseMapSourceProvider {
		return this.baseSourceProviders
			.find((baseSourceProvider: BaseMapSourceProvider) => {
				const source = !sourceType ? true : baseSourceProvider.sourceType === sourceType;
				const supported = mapType ? baseSourceProvider.supported.some((imageryMapConstructor: IBaseImageryMapConstructor) => imageryMapConstructor.prototype.mapType === mapType) : true;
				return source && supported;
			});
	}

	get positionChanged() {
		return this.ActiveMap.positionChanged;
	}

	constructor(protected injector: Injector,
				protected store: Store<any>,
				@Inject(IMAGERY_MAPS) protected imageryMaps: ImageryMaps,
				protected componentFactoryResolver: ComponentFactoryResolver,
				public imageryCommunicatorService: ImageryCommunicatorService,
				@Inject(BaseMapSourceProvider) protected baseSourceProviders: BaseMapSourceProvider[]) {
	}

	initPlugins() {
		this.plugins.forEach((plugin) => plugin.init(this as any));
	}

	get id() {
		return this.mapSettings.id;
	}

	public get ActiveMap(): BaseImageryMap {
		return this._activeMap;
	}

	public get activeMapName() {
		return this.ActiveMap && this.ActiveMap.mapType;
	}

	public setActiveMap(mapType: string, position: ICaseMapPosition, sourceType?, layer?: any): Promise<any> {
		if (this._mapComponentRef) {
			this.destroyCurrentComponent();
		}
		const imageryMap = this.imageryMaps[mapType];

		const factory = this.componentFactoryResolver.resolveComponentFactory<MapComponent>(MapComponent);
		const providers = [
			{
				provide: BaseImageryMap,
				useClass: imageryMap,
				deps: imageryMap.prototype.deps || []
			},
			BaseImageryPluginProvider];

		const injector = Injector.create({ parent: this.injector, providers });
		this._mapComponentRef = this.mapComponentElem.createComponent<MapComponent>(factory, undefined, injector);
		const mapComponent = this._mapComponentRef.instance;
		const getLayers = layer ? Promise.resolve([layer]) : this.createMapSourceForMapType(mapType, sourceType || imageryMap.prototype.defaultMapSource);
		return getLayers.then((layers) => {
			return mapComponent.createMap(layers, position)
				.pipe(
					tap((map) => this.onMapCreated(map, mapType, this.activeMapName))
				)
				.toPromise();
		});
	}

	private onMapCreated(map: BaseImageryMap, activeMapName, oldMapName) {
		this._activeMap = map;
		if (activeMapName !== oldMapName && Boolean(oldMapName)) {
			this.mapInstanceChanged.emit({
				id: this.id,
				newMapInstanceName: activeMapName,
				oldMapInstanceName: oldMapName
			});
		}
	};

	loadInitialMapSource(position?: ICaseMapPosition): Promise<any> {
		return new Promise(resolve => {
			if (!this._activeMap) {
				resolve();
			}

			this.createMapSourceForMapType(this.mapSettings.worldView.mapType, this.mapSettings.worldView.sourceType).then((layers) => {
				this.resetView(layers[0], position).subscribe(() => {
					if (layers.length > 0) {
						for (let i = 1; i < layers.length; i++) {
							this.ActiveMap.addLayer(layers[i]);
						}
					}

					resolve(layers);
				});
			});
		});
	}

	public getCenter(): Observable<Point> {
		if (this.ActiveMap) {
			return this.ActiveMap.getCenter();
		}
		return of(null);
	}

	public updateSize(): void {
		if (this.ActiveMap) {
			this.ActiveMap.updateSize();
		}
	}

	public addGeojsonLayer(data: GeoJsonObject) {
		if (this.ActiveMap) {
			this.ActiveMap.addGeojsonLayer(data);
		}
	}

	setVirtualNorth(north: number) {
		this._virtualNorth = north;
	}

	getVirtualNorth() {
		return this._virtualNorth;
	}


	public setCenter(center: Point, animation: boolean = true): Observable<boolean> {
		if (this.ActiveMap) {
			return this.ActiveMap.setCenter(center, animation);
		}

		return of(true);
	}

	public setPosition(position: ICaseMapPosition): Observable<boolean> {
		if (!this.ActiveMap) {
			return throwError(new Error('missing active map'));
		}

		return this.ActiveMap.setPosition(position);
	}

	public getPosition(): Observable<ICaseMapPosition> {
		if (!this.ActiveMap) {
			return throwError(new Error('missing active map'));
		}
		return this.ActiveMap.getPosition();
	}

	public setRotation(rotation: number) {
		if (!this.ActiveMap) {
			throw new Error('missing active map');
		}
		this.ActiveMap.setRotation(rotation);
	}

	getRotation(): number {
		if (!this.ActiveMap) {
			throw new Error('missing active map');
		}
		return this.ActiveMap.getRotation();
	}

	public getPlugin<T = BaseImageryPlugin>(plugin: any): T {
		return <any>this.plugins.find((_plugin) => _plugin instanceof plugin);
	}

	public resetView(layer: any, position: ICaseMapPosition, extent?: CaseMapExtent): Observable<boolean> {
		this.setVirtualNorth(0);
		if (this.ActiveMap) {
			return this.ActiveMap.resetView(layer, position, extent).pipe(mergeMap(() => this.resetPlugins()));
		}

		return of(true);
	}

	public addLayer(layer: any) {
		if (this.ActiveMap) {
			this.ActiveMap.addLayer(layer);
		}
	}

	public getLayers(): any[] {
		if (this.ActiveMap) {
			return this.ActiveMap.getLayers();
		}
		return [];
	}

	public removeLayer(layer: any) {
		if (this.ActiveMap) {
			this.ActiveMap.removeLayer(layer);
		}
	}

	ngOnInit() {
		const { worldView: { mapType, sourceType }, data: { position } } = this.mapSettings;
		this.setActiveMap(mapType, position, sourceType).then(() => {
			this.imageryCommunicatorService.createCommunicator(this);
		});
	}


	ngOnDestroy() {
		this.imageryCommunicatorService.remove(this.id);
		this.destroyPlugins();
	}

	private resetPlugins(): Observable<boolean> {
		const resetObservables = this.plugins.map((plugin) => plugin.onResetView());
		return forkJoin(resetObservables).pipe(map(results => results.every(b => b === true)));
	}

	private createMapSourceForMapType(mapType: string, sourceType: string): Promise<any> {
		const sourceProvider = this.getMapSourceProvider({
			mapType, sourceType
		});
		return sourceProvider.createAsync(this.mapSettings);
	}

	private destroyCurrentComponent(): void {
		this.destroyPlugins();
		if (this._mapComponentRef) {
			this._mapComponentRef.destroy();
			this._mapComponentRef = undefined;
		}
	}

	destroyPlugins(): void {
		this.plugins.forEach((plugin) => plugin.dispose());
	}

}
