import { Component, HostBinding, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { select, Store } from '@ngrx/store';
import { AnnotationSetProperties, SetAnnotationMode } from '../../actions/tools.actions';
import { DOCUMENT } from '@angular/common';
import { selectAnnotationMode, selectAnnotationProperties } from '../../reducers/tools.reducer';
import { AnnotationMode, ClearActiveInteractionsAction, IVisualizerStyle } from '@ansyn/core';
import { map, tap } from 'rxjs/operators';
import { AutoSubscription, AutoSubscriptions } from 'auto-subscriptions';
import { selectActiveAnnotationLayer, selectLayers } from '../../../layers-manager/reducers/layers.reducer';
import { ILayer, LayerType } from '../../../layers-manager/models/layers.model';
import { SetActiveAnnotationLayer } from '../../../layers-manager/actions/layers.actions';

export interface IModeList {
	mode: AnnotationMode;
	icon: string;
}

export enum SelectionBoxTypes {
	None,
	LineWidth,
	ColorPicker
}

@Component({
	selector: 'ansyn-annotations-control',
	templateUrl: './annotations-control.component.html',
	styleUrls: ['./annotations-control.component.less']
})
@AutoSubscriptions({
	init: 'ngOnInit',
	destroy: 'ngOnDestroy'
})
export class AnnotationsControlComponent implements OnInit, OnDestroy {
	fillAlpah = 0.4;
	strokeAlpah = 1;

	private _expand: boolean;
	public selectedBox: SelectionBoxTypes;

	get SelectionBoxTypes() {
		return SelectionBoxTypes;
	}

	get Boolean() {
		return Boolean;
	}

	annotationLayerIds$ = this.store.pipe(
		select(selectLayers),
		map((layers: ILayer[]) => layers.filter(({ type }) => type === LayerType.annotation))
	);

	activeAnnotationLayer$ = this.store.pipe(
		select(selectActiveAnnotationLayer)
	);

	@AutoSubscription
	mode$: Observable<AnnotationMode> = this.store.pipe(
		select(selectAnnotationMode),
		tap(mode => this.mode = mode)
	);

	@AutoSubscription
	annotationProperties$: Observable<Partial<IVisualizerStyle>> = this.store.pipe(
		select(selectAnnotationProperties),
		tap(annotationProperties => this.annotationProperties = annotationProperties)
	);

	public mode: AnnotationMode;
	public annotationProperties: Partial<IVisualizerStyle>;

	public modesList: IModeList[] = [
		{ mode: 'Point', icon: 'point' },
		{ mode: 'LineString', icon: 'line' },
		{ mode: 'Polygon', icon: 'polygon' },
		{ mode: 'Circle', icon: 'circle' },
		{ mode: 'Rectangle', icon: 'square' },
		{ mode: 'Arrow', icon: 'arrow' }
	];

	@HostBinding('class.expand')
	@Input()
	set expand(value) {
		if (!value) {
			this.selectedBox = undefined;
		}
		this._expand = value;
	}

	get expand() {
		return this._expand;
	}

	constructor(public store: Store<any>, @Inject(DOCUMENT) public document: any) {
	}

	ngOnInit() {
	}

	ngOnDestroy(): void {
	}

	setSelectedAnnotationLayer(id) {
		this.store.dispatch(new SetActiveAnnotationLayer(id));
	}

	toggleSelection(selected: SelectionBoxTypes) {
		this.selectedBox = this.selectedBox === selected ? SelectionBoxTypes.None : selected;
	}

	setAnnotationMode(mode?: AnnotationMode) {
		const dispatchValue = this.mode === mode ? undefined : mode;
		if (dispatchValue) {
			this.store.dispatch(new ClearActiveInteractionsAction({ skipClearFor: [SetAnnotationMode] }));
		}
		this.store.dispatch(new SetAnnotationMode(dispatchValue));
	}

	selectLineWidth($event) {
		this.store.dispatch(new AnnotationSetProperties({ 'stroke-width': $event.width }));
	}

	activeChange($event) {
		if ($event.label === 'fill') {
			this.store.dispatch(new AnnotationSetProperties({ 'fill-opacity': $event.event ? this.fillAlpah : 0 }));
		} else {
			this.store.dispatch(new AnnotationSetProperties({ 'stroke-opacity': $event.event ? this.strokeAlpah : 0 }));

		}
	}

	colorChange($event) {
		if ($event.label === 'fill') {
			this.store.dispatch(new AnnotationSetProperties({ fill: $event.event, 'marker-color': $event.event }));
		} else {
			this.store.dispatch(new AnnotationSetProperties({ stroke: $event.event }));
		}
	}

}
