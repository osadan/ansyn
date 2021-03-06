import { Component, HostBinding, Input, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { IMapState, mapStateSelector } from '../../reducers/map.reducer';
import { Observable } from 'rxjs';
import { Subscription } from 'rxjs';
import { distinctUntilChanged, pluck, tap } from 'rxjs/operators';

@Component({
	selector: 'ansyn-imagery-loader',
	templateUrl: './imagery-loader.component.html',
	styleUrls: ['./imagery-loader.component.less']
})
export class ImageryLoaderComponent implements OnInit, OnDestroy {
	@Input() mapId;
	isLoadingMaps: Map<string, string> = new Map<string, string>();
	subscriptions: Subscription[] = [];

	@HostBinding('class.show')
	get show() {
		return this.isLoadingMaps.has(this.mapId);
	}

	get loaderText(): string {
		return this.isLoadingMaps.get(this.mapId);
	}

	isLoadingMaps$: Observable<Map<string, string>> = this.store$.select(mapStateSelector).pipe(
		pluck<IMapState, Map<string, string>>('isLoadingMaps'),
		distinctUntilChanged(),
		tap((isLoadingMaps) => this.isLoadingMaps = isLoadingMaps)
	);

	constructor(public store$: Store<IMapState>) {
	}

	ngOnInit() {
		this.subscriptions.push(this.isLoadingMaps$.subscribe());
	}

	ngOnDestroy(): void {
		this.subscriptions.forEach(sub => sub.unsubscribe());
	}
}
