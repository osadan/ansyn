import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Subscription } from 'rxjs';
import { Actions, ofType } from '@ngrx/effects';
import { MapActionTypes, SetProgressBarAction } from '../../actions/map.actions';
import { filter, map, tap } from 'rxjs/operators';

@Component({
	selector: 'ansyn-imagery-tile-progress',
	templateUrl: './imagery-tile-progress.component.html',
	styleUrls: ['./imagery-tile-progress.component.less']
})
export class ImageryTileProgressComponent implements OnInit, OnDestroy {
	@Input() mapId;
	@Input() lowered;

	private _subscriptions: Subscription[] = [];
	progress$: Observable<any> = this.actions$.pipe(
		ofType(MapActionTypes.VIEW.SET_PROGRESS_BAR),
		filter((action: SetProgressBarAction) => action.payload.mapId === this.mapId),
		map((action: SetProgressBarAction) => action.payload.progress),
		tap((progress) => this.progress = progress)
	);

	progress;

	constructor(public actions$: Actions) {
	}

	ngOnInit() {
		this._subscriptions.push(
			this.progress$.subscribe()
		);
	}

	ngOnDestroy(): void {
		this._subscriptions.forEach(observable$ => observable$.unsubscribe());
	}
}
