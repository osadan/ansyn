import { Inject, Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import {
	CoreConfig,
	ICase,
	ICaseMapState,
	ICoreConfig,
	IOverlay,
	isFullOverlay,
	SetAutoSave,
	SetFavoriteOverlaysAction,
	SetLayoutAction,
	SetOverlaysCriteriaAction,
	SetPresetOverlaysAction,
	SetRemovedOverlaysIdsAction,
	SetRemovedOverlaysVisibilityAction
} from '@ansyn/core';
import {
	BeginLayerCollectionLoadAction,
	CasesActionTypes,
	CasesService,
	SelectCaseAction,
	UpdateFacetsAction,
	UpdateOverlaysManualProcessArgs,
	UpdateSelectedLayersIds
} from '@ansyn/menu-items';
import { SetComboBoxesProperties } from '@ansyn/status-bar';
import { SetContextParamsAction } from '@ansyn/context';
import { IAppState } from '../../app.effects.module';
import { ofType } from '@ngrx/effects';
import { mergeMap } from 'rxjs/operators';
import { SetActiveMapId, SetMapsDataActionStore } from '@ansyn/map-facade';

@Injectable()
export class SelectCaseAppEffects {

	@Effect()
	selectCase$: Observable<any> = this.actions$.pipe(
		ofType<SelectCaseAction>(CasesActionTypes.SELECT_CASE),
		mergeMap(({ payload }: SelectCaseAction) => this.selectCaseActions(payload, this.coreConfig.noInitialSearch))
	);

	constructor(protected actions$: Actions,
				protected store$: Store<IAppState>,
				@Inject(CoreConfig) protected coreConfig: ICoreConfig) {
	}

	selectCaseActions(payload: ICase, noInitialSearch: boolean): Action[] {
		const { state, autoSave } = payload;
		// status-bar
		const { orientation, timeFilter, overlaysManualProcessArgs } = state;
		// map
		const { data, activeMapId } = state.maps;
		// context
		const { favoriteOverlays, removedOverlaysIds, removedOverlaysVisibility, presetOverlays, region, dataInputFilters, contextEntities } = state;
		let { time } = state;
		const { layout } = state.maps;

		if (!time) {
			time = CasesService.defaultTime;
		}

		if (typeof time.from === 'string') {
			time.from = new Date(time.from);
		}
		if (typeof time.to === 'string') {
			time.to = new Date(time.to);
		}
		// layers
		const { activeLayersIds } = state.layers;
		// filters
		const { facets } = state;

		return [
			new SetLayoutAction(<any>layout),
			new SetComboBoxesProperties({ orientation, timeFilter }),
			new SetOverlaysCriteriaAction({ time, region, dataInputFilters }, { noInitialSearch }),
			new SetMapsDataActionStore({ mapsList: data.map(this.parseMapData.bind(this)) }),
			new SetActiveMapId(activeMapId),
			new SetFavoriteOverlaysAction(favoriteOverlays.map(this.parseOverlay.bind(this))),
			new SetPresetOverlaysAction((presetOverlays || []).map(this.parseOverlay.bind(this))),
			new BeginLayerCollectionLoadAction({ caseId: payload.id }),
			new UpdateOverlaysManualProcessArgs({ override: true, data: overlaysManualProcessArgs }),
			new UpdateFacetsAction(facets),
			new UpdateSelectedLayersIds(activeLayersIds),
			new SetContextParamsAction({ contextEntities }),
			new SetAutoSave(autoSave),
			new SetRemovedOverlaysIdsAction(removedOverlaysIds),
			new SetRemovedOverlaysVisibilityAction(removedOverlaysVisibility)
		];
	}

	parseMapData(map: ICaseMapState): ICaseMapState {
		if (map.data.overlay) {
			return { ...map, data: { ...map.data, overlay: this.parseOverlay(map.data.overlay) } };
		}
		return map;
	}

	parseOverlay(overlay: IOverlay): IOverlay {
		return isFullOverlay(overlay) ? { ...overlay, date: new Date(overlay.date) } : overlay;
	}
}
