import {
	BaseImageryVisualizer,
	ImageryVisualizer,
	VisualizersConfig,
	IVisualizersConfig,
	VisualizerInteractionTypes
} from "@ansyn/imagery";
import { OpenLayersMap, EntitiesVisualizer } from "@ansyn/plugins";
import { Store } from "@ngrx/store";
import { OverlaysService } from "@ansyn/overlays";
import { Inject } from "@angular/core";
import { IVisualizerEntity } from "@ansyn/core";
import { Observable, combineLatest } from "rxjs";
import { of } from "rxjs";
import { map, filter, switchMap, tap } from 'rxjs/operators';
import { isEmpty } from 'lodash';
import { centerOfMass } from '@turf/turf';
import Point from 'ol/geom/point.js';
import Feature from 'ol/feature';
import Icon from 'ol/style/icon';
import Style from 'ol/style/style';
import VectorSource from 'ol/source/vector.js';
import { selectMaps, selectActiveMapId } from '@ansyn/map-facade';
import { activeMap } from 'src/app/@ansyn/map-facade/reducers/map.reducer';
import { get as _get } from 'lodash';



@ImageryVisualizer({
	supported: [OpenLayersMap],
	deps: [Store, VisualizersConfig, OverlaysService],
	isHideable: false
})
export class DroneMarkerVisualizer extends EntitiesVisualizer {
	public overlays;
	public zoomLevel;

	_iconSrcA: Style = new Style({
		image: new Icon({
			scale: 1,
			src: 'assets/pinpoint-indicator.svg'
		}),
		zIndex: 100
	});

	_iconSrcB: Style = new Style({
		image: new Icon({
			scale: 1,
			src: 'assets/icons/map/entity-marker.svg'
		}),
		zIndex: 100
	});

	constructor(
		public store: Store<any>,
		@Inject(VisualizersConfig) public config: IVisualizersConfig,
		public overlaysService: OverlaysService
	) {
		super();

		combineLatest(
			this.overlaysService.getAllOverlays$,
			this.store.select(activeMap)
			).pipe(
			filter(([overlays]) => Boolean(overlays.size)),
			map(([overlays, activeMap]) => {
				const result = [];
				overlays.forEach(overlay => {
					if (overlay.sourceType === 'TB' && overlay.footprint) {
						overlay.centerOfMass = centerOfMass(overlay.footprint)
						result.push(overlay);
					}
				})
				return [result, _get(activeMap, 'data.position.projectedState.zoom')];
			}),
			tap(([, zoom]) => {
				this.zoomLevel = zoom
			}),
			filter(([overlays]) => Boolean(overlays.length)),
			map(([overlays]) => {
				return overlays.map(overlay => {
					// const feature = new Feature(new Point(overlay.centerOfMass.geometry.coordinates))
					// feature.set('style', this.createStyle('assets/pinpoint-indicator.svg', undefined));
					return {id: `center_${overlay.id}`, featureJson: overlay.centerOfMass};
				});

			}),
			switchMap(features => this.setEntities(features))

		)
		.subscribe(overlays => {
			// console.log(overlays);
			// this.overlays = overlays;

			// this.setEntities(features);

		});
	}

	featureStyle(feature: Feature, resolution) {
		if (this.zoomLevel < 10) {
			return this._iconSrcA;
		}
		else {
			return this._iconSrcB
		}
	}

	createStyle(src, img) {
		return new Style({
			image: new Icon(/** @type {module:ol/style/Icon~Options} */({
				anchor: [0.5, 0.96],
				crossOrigin: 'anonymous',
				src: src,
				img: img,
				imgSize: img ? [img.width, img.height] : undefined
			}))
		});
	}

}
