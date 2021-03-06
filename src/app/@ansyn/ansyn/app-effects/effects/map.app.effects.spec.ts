import { async, inject, TestBed } from '@angular/core/testing';
import { Store, StoreModule } from '@ngrx/store';
import { MapAppEffects } from './map.app.effects';
import { EMPTY, Observable, of } from 'rxjs';
import { cloneDeep } from 'lodash';
import {
	ImageryCreatedAction,
	IMapState,
	initialMapState,
	mapFacadeConfig,
	mapFeatureKey,
	MapReducer,
	mapStateSelector,
	SetIsLoadingAcion
} from '@ansyn/map-facade';
import {
	BaseOverlaySourceProvider,
	DisplayOverlayAction,
	IFetchParams,
	IOverlaysState,
	OverlayReducer,
	overlaysFeatureKey,
	overlaysInitialState,
	OverlaySourceProvider,
	OverlaysService,
	overlaysStateSelector,
	RequestOverlayByIDFromBackendAction
} from '@ansyn/overlays';
import {
	IStatusBarState,
	statusBarFeatureKey,
	StatusBarInitialState,
	StatusBarReducer,
	statusBarStateSelector
} from '@ansyn/status-bar';
import * as extentFromGeojson from '@ansyn/core';
import {
	ICase,
	ICaseMapState,
	IOverlay,
	IOverlaysFetchData,
	LoggerService,
	MAP_SOURCE_PROVIDERS_CONFIG
} from '@ansyn/core';
import {
	BaseMapSourceProvider,
	CacheService,
	CommunicatorEntity,
	IMAGERY_CONFIG,
	IMAGERY_MAPS,
	ImageryCommunicatorService, ImageryMapSource,
	VisualizersConfig
} from '@ansyn/imagery';
import {
	casesFeatureKey,
	CasesReducer,
	CasesService,
	casesStateSelector,
	ICasesState,
	ILayerState,
	initialLayersState,
	IToolsState,
	layersStateSelector,
	toolsInitialState,
	toolsStateSelector
} from '@ansyn/menu-items';
import { HttpClientModule } from '@angular/common/http';
import { cold, hot } from 'jasmine-marbles';
import { provideMockActions } from '@ngrx/effects/testing';
import { selectMaps } from '@ansyn/map-facade';

@ImageryMapSource({
	sourceType: 'sourceType1',
	supported: [<any> 'mapType1']
})
class SourceProviderMock1 extends BaseMapSourceProvider {
	create(metaData: any): any {
		return true;
	}

	createAsync(metaData: ICaseMapState): Promise<any> {
		return Promise.resolve();
	}

	startTimingLog = key => {
	};

	endTimingLog = key => {
	};

}

@OverlaySourceProvider({
	sourceType: 'Mock'
})
class OverlaySourceProviderMock extends BaseOverlaySourceProvider {
	public fetch(fetchParams: IFetchParams): Observable<IOverlaysFetchData> {
		return EMPTY;
	}

	public getStartDateViaLimitFacets(params: { facets, limit, region }): Observable<any> {
		return EMPTY;
	};

	public getStartAndEndDateViaRangeFacets(params: { facets, limitBefore, limitAfter, date, region }): Observable<any> {
		return EMPTY;
	};

	public getById(id: string, sourceType: string = null): Observable<IOverlay> {
		return EMPTY;
	};
}

describe('MapAppEffects', () => {
	let mapAppEffects: MapAppEffects;
	let actions: Observable<any>;
	let imageryCommunicatorService: ImageryCommunicatorService;
	let store: Store<any>;
	let icaseState: ICasesState;
	let statusBarState: IStatusBarState;
	let mapState: IMapState;
	let overlaysState: IOverlaysState;
	let layerState: ILayerState;
	let toolsState: IToolsState;
	let casesService: CasesService;
	let baseSourceProviders: BaseMapSourceProvider[];
	const imageryCommunicatorServiceMock = {
		provide: () => {
		},
		communicatorsAsArray: () => {
		}
	};
	let fakeOverlay: IOverlay;

	const imagery1PositionBoundingBox = { test: 1 };

	const cases: ICase[] = [{
		id: '1',
		name: 'name',
		owner: 'owner',
		creationTime: new Date(),
		lastModified: new Date(),
		autoSave: false,
		state: {
			time: { type: '', from: new Date(), to: new Date() },
			region: {
				type: 'Polygon',
				coordinates: [
					[
						[-64.73, 32.31],
						[-80.19, 25.76],
						[-66.09, 18.43],
						[-64.73, 32.31]
					]
				]
			},
			maps: {
				data: [
					{
						id: 'imagery1',
						data: { position: { zoom: 1, center: 2, boundingBox: imagery1PositionBoundingBox } }
					},
					{ id: 'imagery2', data: { position: { zoom: 3, center: 4 }, overlayDisplayMode: 'Heatmap' } },
					{ id: 'imagery3', data: { position: { zoom: 5, center: 6 } } }
				],
				activeMapId: 'imagery1'
			}
		} as any
	}
	];

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			imports: [
				HttpClientModule,
				StoreModule.forRoot({
					[casesFeatureKey]: CasesReducer,
					[statusBarFeatureKey]: StatusBarReducer,
					[overlaysFeatureKey]: OverlayReducer,
					[mapFeatureKey]: MapReducer
				})
			],
			providers: [
				{ provide: LoggerService, useValue: { error: (some) => null } },
				{
					provide: CacheService,
					useClass: CacheService,
					deps: [VisualizersConfig, ImageryCommunicatorService]
				},
				ImageryCommunicatorService,
				{ provide: VisualizersConfig, useValue: {} },
				MapAppEffects,
				OverlaysService,
				{ provide: BaseMapSourceProvider, useClass: SourceProviderMock1, multi: true },
				{
					provide: mapFacadeConfig,
					useValue: {}
				},
				{ provide: IMAGERY_MAPS, useValue: {} },
				{
					provide: IMAGERY_CONFIG, useValue: {
						'geoMapsInitialMapSource': [{
							'mapType': 'openLayersMap',
							'mapSource': 'BING',
							'mapSourceMetadata': {
								'key': 'AsVccaM44P5n-GYKXaV0oVGdTI665Qx_sMgYBSYRxryH2pLe92iVxUgEtwIt8des',
								'styles': ['Aerial']
							}
						}, {
							'mapType': 'cesiumMap',
							'mapSource': 'OSM',
							'mapSourceMetadata': null
						}
						],
						'maxCachedLayers': 100
					}
				},
				{ provide: BaseOverlaySourceProvider, useClass: OverlaySourceProviderMock },
				{
					provide: ImageryCommunicatorService,
					useValue: imageryCommunicatorServiceMock
				},
				provideMockActions(() => actions),
				{
					provide: CasesService,
					useValue: {
						updateCase: () => null,
						getOverlaysMarkup: () => null
					}
				},
				{
					provide: MAP_SOURCE_PROVIDERS_CONFIG,
					useValue: {}
				}
			]

		}).compileComponents();
	}));

	/* store data mock */
	beforeEach(inject([Store], (_store: Store<any>) => {
		store = _store;
		const selectedCase = cases[0];
		icaseState = { selectedCase } as any;

		statusBarState = cloneDeep(StatusBarInitialState);
		mapState = cloneDeep(initialMapState);
		overlaysState = cloneDeep(overlaysInitialState);
		layerState = cloneDeep(initialLayersState);

		toolsState = cloneDeep(toolsInitialState);
		fakeOverlay = <any>{ id: 'overlayId', date: new Date(), isGeoRegistered: true };
		overlaysState.overlays.set(fakeOverlay.id, fakeOverlay);
		mapState.entities = icaseState.selectedCase.state.maps.data.reduce((obj, map) => ({ ...obj, [map.id]: map }), {});
		mapState.activeMapId = icaseState.selectedCase.state.maps.activeMapId;


		const fakeStore = new Map<any, any>([
			[casesStateSelector, icaseState],
			[statusBarStateSelector, statusBarState],
			[overlaysStateSelector, overlaysState],
			[layersStateSelector, layerState],
			[mapStateSelector, mapState],
			[toolsStateSelector, toolsState],
			[selectMaps, mapState.entities]
		]);

		spyOn(store, 'select').and.callFake(type => of(fakeStore.get(type)));
	}));

	beforeEach(inject([MapAppEffects, ImageryCommunicatorService, CasesService, BaseMapSourceProvider], (_mapAppEffects: MapAppEffects, _imageryCommunicatorService: ImageryCommunicatorService, _casesService: CasesService, _baseSourceProviders: BaseMapSourceProvider[]) => {
		mapAppEffects = _mapAppEffects;

		imageryCommunicatorService = _imageryCommunicatorService;
		casesService = _casesService;
		baseSourceProviders = _baseSourceProviders;
	}));

	describe('onDisplayOverlay$ communicator should set Layer on map, by getFootprintIntersectionRatioInExtent', () => {
		const fakeLayer = {};
		const fakeExtent = [1, 2, 3, 4];
		let fakeCommunicator: CommunicatorEntity;

		beforeEach(() => {
			fakeCommunicator = <any> {
				ActiveMap: { MapType: 'ol' },
				resetView: () => {
				}
			};

			const fakeSourceLoader = {
				createAsync: () => {
					return {
						then: (callback) => callback(fakeLayer)
					};
				}
			};


			Object.defineProperty(extentFromGeojson, 'extentFromGeojson', {
				writable: true,
				configurable: true,
				value: () => {
				}
			});

			spyOn(extentFromGeojson, 'extentFromGeojson').and.returnValue(fakeExtent);
			spyOn(imageryCommunicatorService, 'provide').and.returnValue(fakeCommunicator);
			spyOn(baseSourceProviders, 'find').and.returnValue(fakeSourceLoader);
			spyOn(fakeCommunicator, 'resetView');
		});

		it('should NOT dispatch/do anything if "overlay date = undefined"', () => {
			const testOverlay: IOverlay = <IOverlay>{
				id: 'testOverlayId',
				name: 'testOverlay1',
				photoTime: new Date().toDateString(),
				azimuth: 0,
				isGeoRegistered: true
			};
			actions = hot('--a--', { a: new DisplayOverlayAction({ overlay: testOverlay, mapId: 'imagery1' }) });
			const expectedResults = cold('-');
			expect(mapAppEffects.onDisplayOverlay$).toBeObservable(expectedResults);
		});
	});

	describe('onOverlayFromURL$ from IDAHO', () => {
		it('should dispatch RequestOverlayByIDFromBackendAction if "overlay date = undefined"', () => {
			const testOverlay: IOverlay = <IOverlay>{
				id: 'testOverlayId',
				name: 'testOverlay1',
				photoTime: new Date().toDateString(),
				azimuth: 0,
				isGeoRegistered: true,
				sourceType: 'IDAHO'
			};
			actions = hot('--a--', { a: new DisplayOverlayAction({ overlay: testOverlay, mapId: 'imagery1' }) });

			const expectedResults = cold('--(bc)--', {
				b: new RequestOverlayByIDFromBackendAction({
					overlayId: testOverlay.id,
					sourceType: 'IDAHO',
					mapId: 'imagery1'
				}),
				c: new SetIsLoadingAcion({ mapId: 'imagery1', show: true, text: 'Loading Overlay' })
			});

			expect(mapAppEffects.onOverlayFromURL$).toBeObservable(expectedResults);
		});


		it('should NOT dispatch anything if "overlay date exists"', () => {
			const testOverlay: IOverlay = {
				id: 'testOverlayId',
				name: 'testOverlay1',
				photoTime: new Date().toDateString(),
				date: new Date(),
				azimuth: 0,
				isGeoRegistered: true
			};
			icaseState.selectedCase.state.maps.data[0].data.overlay = testOverlay;
			actions = hot('--a--', { a: new DisplayOverlayAction({ overlay: testOverlay, mapId: 'imagery1' }) });
			const expectedResults = cold('-');
			expect(mapAppEffects.onOverlayFromURL$).toBeObservable(expectedResults);
		});
	});

	describe('onOverlayFromURL$ from PLANET', () => {
		it('should dispatch RequestOverlayByIDFromBackendAction if "overlay date = undefined"', () => {
			const testOverlay: IOverlay = <IOverlay>{
				id: 'testOverlayId',
				name: 'testOverlay1',
				photoTime: new Date().toDateString(),
				azimuth: 0,
				isGeoRegistered: true,
				sourceType: 'PLANET'
			};
			actions = hot('--a--', { a: new DisplayOverlayAction({ overlay: testOverlay, mapId: 'imagery1' }) });

			const expectedResults = cold('--(bc)--', {
				b: new RequestOverlayByIDFromBackendAction({
					overlayId: testOverlay.id,
					sourceType: 'PLANET',
					mapId: 'imagery1'
				}),
				c: new SetIsLoadingAcion({ mapId: 'imagery1', show: true, text: 'Loading Overlay' })
			});

			expect(mapAppEffects.onOverlayFromURL$).toBeObservable(expectedResults);
		});
	});

	describe('displayOverlayOnNewMapInstance$', () => {
		it('displayOverlayOnNewMapInstance$ should dispatch DisplayOverlayAction when communicator added that contains overlay', () => {
			const overlay = {
				id: 'testOverlayId',
				name: 'testOverlay1',
				photoTime: new Date().toDateString(),
				date: new Date(),
				azimuth: 0,
				isGeoRegistered: true
			};
			icaseState.selectedCase.state.maps.data[0].data.overlay = overlay;

			const communicators: Array<string> = ['imagery1'];
			actions = hot('--a--', {
				a: new ImageryCreatedAction({ id: 'imagery1' })
			});
			const expectedResults = cold('--b--', {
				b: new DisplayOverlayAction({
					overlay,
					mapId: 'imagery1',
					forceFirstDisplay: true
				})
			});
			expect(mapAppEffects.displayOverlayOnNewMapInstance$).toBeObservable(expectedResults);
		});

		it('should not dispatch DisplayOverlayAction when communicator added that doesnt contain overlay', () => {
			icaseState.selectedCase.state.maps.data[1].data.overlay = null;
			const communicators: Array<string> = ['imagery2'];
			actions = hot('--a--', {
				a: new ImageryCreatedAction({ id: 'imagery2' })
			});
			const expectedResults = cold('-');
			expect(mapAppEffects.displayOverlayOnNewMapInstance$).toBeObservable(expectedResults);
		});
	});

});
