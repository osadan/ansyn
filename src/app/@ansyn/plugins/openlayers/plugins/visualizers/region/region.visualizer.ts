import * as turf from '@turf/turf';
import { combineLatest, EMPTY, Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { FeatureCollection, GeometryObject, Position } from 'geojson';
import { ContextMenuTriggerAction, MapActionTypes, selectActiveMapId } from '@ansyn/map-facade';
import { VisualizerInteractions } from '@ansyn/imagery';
import Draw from 'ol/interaction/draw';
import {
	CaseGeoFilter,
	CaseRegionState,
	selectRegion,
	SetOverlaysCriteriaAction,
	SetToastMessageAction
} from '@ansyn/core';
import {
	SearchModeEnum,
	selectGeoFilterIndicator,
	selectGeoFilterSearchMode,
	UpdateGeoFilterStatus
} from '@ansyn/status-bar';
import { AutoSubscription } from 'auto-subscriptions';
import { distinctUntilChanged, filter, map, mergeMap, take, tap, withLatestFrom } from 'rxjs/operators';
import { EntitiesVisualizer } from '../entities-visualizer';
import { OpenLayersProjectionService } from '../../../projection/open-layers-projection.service';

export abstract class RegionVisualizer extends EntitiesVisualizer {
	selfIntersectMessage = 'Invalid Polygon (Self-Intersect)';
	region$ = this.store$.select(selectRegion);

	geoFilter$: Observable<any> = this.region$.pipe(
		map((region) => region.type),
		distinctUntilChanged()
	);

	isActiveMap$ = this.store$.select(selectActiveMapId).pipe(
		map((activeMapId: string): boolean => activeMapId === this.mapId),
		distinctUntilChanged()
	);

	isActiveGeoFilter$ = this.geoFilter$
		.pipe(map((geoFilter: CaseGeoFilter) => geoFilter === this.geoFilter));

	geoFilterSearch$ = this.store$.select(selectGeoFilterSearchMode);

	onSearchMode$ = this.geoFilterSearch$.pipe(
		map((geoFilterSearch) => geoFilterSearch === this.geoFilter),
		distinctUntilChanged()
	);

	geoFilterIndicator$ = this.store$.select(selectGeoFilterIndicator);

	@AutoSubscription
	onContextMenu$: Observable<any> = this.actions$.pipe(
		ofType<ContextMenuTriggerAction>(MapActionTypes.TRIGGER.CONTEXT_MENU),
		withLatestFrom(this.isActiveGeoFilter$),
		filter(([action, isActiveGeoFilter]) => isActiveGeoFilter),
		map(([{ payload }]) => payload),
		tap(this.onContextMenu.bind(this))
	);

	@AutoSubscription
	interactionChanges$: Observable<any> = combineLatest(this.onSearchMode$, this.isActiveMap$).pipe(
		tap(this.interactionChanges.bind(this))
	);

	@AutoSubscription
	drawChanges$ = combineLatest(this.geoFilter$, this.region$, this.geoFilterIndicator$, this.geoFilterSearch$).pipe(
		mergeMap(this.drawChanges.bind(this)));

	constructor(public store$: Store<any>, public actions$: Actions, public projectionService: OpenLayersProjectionService, public geoFilter: CaseGeoFilter) {
		super();
	}

	drawChanges([geoFilter, region, geoFilterIndicator, geoFilterSearch]) {
		if (!geoFilterIndicator || geoFilterSearch !== SearchModeEnum.none) {
			this.clearEntities();
			return EMPTY;
		}
		if (geoFilter === this.geoFilter) {
			return this.drawRegionOnMap(region);
		}
		this.clearEntities();
		return EMPTY;
	}

	onDrawEndEvent({ feature }) {
		this.projectionService
			.projectCollectionAccurately([feature], this.iMap).pipe(
			take(1),
			tap((featureCollection: FeatureCollection<GeometryObject>) => {
				const [geoJsonFeature] = featureCollection.features;
				const region = this.createRegion(geoJsonFeature);
				if (region.type === 'Point' || turf.kinks(region).features.length === 0) {  // turf way to check if there are any self-intersections
					this.store$.dispatch(new SetOverlaysCriteriaAction({ region }));
					this.store$.dispatch(new UpdateGeoFilterStatus());
				}
				else {
					this.store$.dispatch(new SetToastMessageAction({
						toastText: this.selfIntersectMessage
					}));
				}
			})
		).subscribe();
	}

	createDrawInteraction() {
		const drawInteractionHandler = new Draw(<any>{
			type: this.geoFilter,
			condition: (event: ol.MapBrowserEvent) => (<MouseEvent>event.originalEvent).which === 1,
			style: this.featureStyle.bind(this)
		});

		drawInteractionHandler.on('drawend', this.onDrawEndEvent.bind(this));
		this.addInteraction(VisualizerInteractions.drawInteractionHandler, drawInteractionHandler);
	}

	public removeDrawInteraction() {
		this.removeInteraction(VisualizerInteractions.drawInteractionHandler);
	}

	resetInteractions() {
		super.resetInteractions();
		this.store$.dispatch(new UpdateGeoFilterStatus());
	}

	interactionChanges([onSearchMode, isActiveMap]: [boolean, boolean]): void {
		this.removeDrawInteraction();
		if (onSearchMode && isActiveMap) {
			this.createDrawInteraction();
		}
	}

	onDispose() {
		this.removeDrawInteraction();
		super.onDispose();
	}

	abstract drawRegionOnMap(region: CaseRegionState): Observable<boolean> ;

	abstract onContextMenu(point: Position): void;

	abstract createRegion(geoJsonFeature: any): any;
}
