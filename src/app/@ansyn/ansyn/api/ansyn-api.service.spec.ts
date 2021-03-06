import { async, inject, TestBed } from '@angular/core/testing';
import { Store, StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { GoToAction, ProjectionConverterService } from '@ansyn/menu-items';
import { ANSYN_ID, AnsynApi } from './ansyn-api.service';
import { mapFeatureKey, MapReducer } from '@ansyn/map-facade';
import { IOverlay, LayoutKey, SetLayoutAction } from '@ansyn/core';
import { DisplayOverlayAction } from '@ansyn/overlays';

describe('apiService', () => {
	let ansynApi: AnsynApi;
	let store: Store<any>;

	beforeEach(async(() => {
		TestBed.configureTestingModule({
			declarations: [],
			imports: [
				StoreModule.forRoot({ [mapFeatureKey]: MapReducer }),
				EffectsModule.forRoot([])
			],
			providers: [
				AnsynApi,
				{
					provide: ProjectionConverterService,
					useValue: {}
				},
				{
					provide: ANSYN_ID,
					useValue: 'fakeId'
				}
			]
		}).compileComponents();
	}));


	beforeEach(inject([AnsynApi, Store], (_ansynApi: AnsynApi, _store: Store<any>) => {
		ansynApi = _ansynApi;
		store = _store;
		spyOn(store, 'dispatch');
	}));

	it('should create "ansynApi" service', () => {
		expect(ansynApi).toBeTruthy();
	});

	it('should go to location', () => {
		const position = [-117, 33];
		ansynApi.goToPosition(position);
		expect(store.dispatch).toHaveBeenCalledWith(new GoToAction(position));
	});


	it('should changeMapLayout', () => {
		const layout: LayoutKey = 'layout2';
		ansynApi.changeMapLayout(layout);
		expect(store.dispatch).toHaveBeenCalledWith(new SetLayoutAction(layout));
	});

	it('should displayOverLay', () => {
		const overlay: IOverlay = <any> { id: 'fake' };
		ansynApi.displayOverLay(overlay);
		expect(store.dispatch).toHaveBeenCalledWith(new DisplayOverlayAction({
			overlay,
			mapId: ansynApi.activeMapId,
			forceFirstDisplay: true
		}));
	});

});
