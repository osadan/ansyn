import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import {
	DisplayOverlayAction,
	DisplayOverlaySuccessAction,
	IOverlayByIdMetaData,
	OverlaysActionTypes,
	OverlaysService
} from '@ansyn/overlays';
import {
	CasesActionTypes, IToolsConfig, IToolsState,
	LoadDefaultCaseIfNoActiveCaseAction,
	SelectCaseAction,
	SelectDilutedCaseAction, toolsConfig, toolsStateSelector
} from '@ansyn/menu-items';
import { IMapState, mapStateSelector, UpdateMapAction } from '@ansyn/map-facade';
import { IDilutedCase, ImageManualProcessArgs, IOverlay, SetToastMessageAction } from '@ansyn/core';
import { ImageryCommunicatorService } from '@ansyn/imagery';
import { HttpErrorResponse } from '@angular/common/http';
import { uniqBy } from 'lodash';
import { IAppState } from '../app.effects.module';
import { catchError, map, mergeMap, withLatestFrom } from 'rxjs/operators';
import { Inject } from '@angular/core';

@Injectable()
export class CasesAppEffects {
	get defaultImageManualProcessArgs(): ImageManualProcessArgs {
		return this.config.ImageProcParams.reduce<ImageManualProcessArgs>((initialObject: any, imageProcParam) => {
			return <any> { ...initialObject, [imageProcParam.name]: imageProcParam.defaultValue };
		}, {});
	}

	@Effect()
	onDisplayOverlay$: Observable<any> = this.actions$.pipe(
		ofType<DisplayOverlaySuccessAction>(OverlaysActionTypes.DISPLAY_OVERLAY_SUCCESS),
		withLatestFrom(this.store$.select(mapStateSelector), this.store$.select(toolsStateSelector)),
		map(([action, mapState, toolsState]: [DisplayOverlayAction, IMapState, IToolsState]) => {
			const mapId = action.payload.mapId || mapState.activeMapId;
			const currentMap = mapState.entities[mapId];
			const imageManualProcessArgs = (Boolean(toolsState && toolsState.overlaysManualProcessArgs) && toolsState.overlaysManualProcessArgs[action.payload.overlay.id]) || this.defaultImageManualProcessArgs;

			return new UpdateMapAction({
				id: mapId,
				changes: { data: {
					...currentMap.data,
						overlay: action.payload.overlay,
						isAutoImageProcessingActive: false,
						imageManualProcessArgs
					} }
			});
		})
	);

	@Effect()
	loadCase$: Observable<any> = this.actions$
		.pipe(
			ofType<SelectDilutedCaseAction>(CasesActionTypes.SELECT_DILUTED_CASE),
			map(({ payload }: SelectDilutedCaseAction) => payload),
			mergeMap((caseValue: IDilutedCase) => {
				const ids: IOverlayByIdMetaData[] = uniqBy(caseValue.state.maps.data.filter(mapData => Boolean(mapData.data.overlay))
						.map((mapData) => mapData.data.overlay)
						.concat(caseValue.state.favoriteOverlays,
							caseValue.state.presetOverlays || [])
					, 'id')
					.map(({ id, sourceType }: IOverlay): IOverlayByIdMetaData => ({ id, sourceType }));

				return this.overlaysService.getOverlaysById(ids)
					.pipe(
						map(overlays => new Map(overlays.map((overlay): [string, IOverlay] => [overlay.id, overlay]))),
						map((mapOverlay: Map<string, IOverlay>) => {
							caseValue.state.favoriteOverlays = caseValue.state.favoriteOverlays
								.map((favOverlay: IOverlay) => mapOverlay.get(favOverlay.id));

							caseValue.state.presetOverlays = (caseValue.state.presetOverlays || [])
								.map((preOverlay: IOverlay) => mapOverlay.get(preOverlay.id));

							caseValue.state.maps.data
								.filter(mapData => Boolean(Boolean(mapData.data.overlay)))
								.forEach((map) => map.data.overlay = mapOverlay.get(map.data.overlay.id));

							return new SelectCaseAction(caseValue);
						}),
						catchError((result: HttpErrorResponse) => {
							return [new SetToastMessageAction({
								toastText: `Failed to load case ${result.status ? `(${result.status})` : ''}`,
								showWarningIcon: true
							}),
								new LoadDefaultCaseIfNoActiveCaseAction()];
						})
					);
			})
		);


	constructor(protected actions$: Actions,
				protected store$: Store<IAppState>,
				protected overlaysService: OverlaysService,
				@Inject(toolsConfig) protected config: IToolsConfig,
				protected imageryCommunicatorService: ImageryCommunicatorService) {
	}
}
