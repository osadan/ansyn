import { Component, OnDestroy, OnInit } from '@angular/core';
import {
	SetAutoImageProcessing,
	SetMeasureDistanceToolState,
	SetSubMenu,
	StartMouseShadow,
	StopMouseShadow
} from '../actions/tools.actions';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { IToolsState, selectSubMenu, SubMenuEnum, toolsFlags, toolsStateSelector } from '../reducers/tools.reducer';
import { ClearActiveInteractionsAction } from '@ansyn/core';
import { distinctUntilChanged, filter, map, pluck, tap } from 'rxjs/operators';
import { selectActiveAnnotationLayer } from '../../layers-manager/reducers/layers.reducer';

@Component({
	selector: 'ansyn-tools',
	templateUrl: './tools.component.html',
	styleUrls: ['./tools.component.less']
})
export class ToolsComponent implements OnInit, OnDestroy {
	isImageControlActive = false;
	public displayModeOn = false;
	public flags: Map<toolsFlags, boolean>;
	public flags$: Observable<Map<toolsFlags, boolean>> = this.store.select(toolsStateSelector).pipe(
		map((tools: IToolsState) => tools.flags),
		distinctUntilChanged()
	);

	public imageProcessingDisabled$: Observable<boolean> = this.store.select(toolsStateSelector).pipe(
		pluck<IToolsState, Map<toolsFlags, boolean>>('flags'),
		distinctUntilChanged(),
		map((flags) => flags.get(toolsFlags.imageProcessingDisabled)),
		distinctUntilChanged(),
		filter(Boolean),
		tap(this.closeManualProcessingMenu.bind(this))
	);

	isActiveAnnotationLayer$ = this.store.select(selectActiveAnnotationLayer).pipe(
		map(Boolean)
	);

	subMenu$ = this.store.select(selectSubMenu).pipe(tap((subMenu) => this.subMenu = subMenu));
	subMenu: SubMenuEnum;

	subscribers = [];

	get subMenuEnum() {
		return SubMenuEnum;
	}

	get isGeoOptionsDisabled() {
		return !this.flags.get(toolsFlags.geoRegisteredOptionsEnabled);
	}

	get imageProcessingDisabled() {
		return this.flags.get(toolsFlags.imageProcessingDisabled);
	}

	get shadowMouseDisabled() {
		return this.flags.get(toolsFlags.shadowMouseDisabled);
	}

	get onShadowMouse() {
		return this.flags.get(toolsFlags.shadowMouse);
	}

	get onAutoImageProcessing() {
		return this.flags.get(toolsFlags.autoImageProcessing);
	}

	get imageManualProcessingDisabled() {
		return this.imageProcessingDisabled || this.onAutoImageProcessing;
	}

	get onMeasureTool() {
		return this.flags.get(toolsFlags.isMeasureToolActive);
	}

	// @TODO display the shadow mouse only if there more then one map .
	constructor(protected store: Store<any>) {

	}

	ngOnInit() {
		this.subscribers.push(
			this.subMenu$.subscribe(),
			this.flags$.subscribe(_flags => {
				this.flags = _flags;
			}),
			this.imageProcessingDisabled$.subscribe()
		);
	}

	ngOnDestroy() {
		this.toggleSubMenu(null);
		this.subscribers.forEach(sub => sub.unsubscribe());
	}

	toggleShadowMouse() {
		const value = this.onShadowMouse;

		if (value) {
			this.store.dispatch(new StopMouseShadow());
		} else {
			this.store.dispatch(new StartMouseShadow());
		}
	}

	toggleMeasureDistanceTool() {
		const value = this.onMeasureTool;
		this.store.dispatch(new ClearActiveInteractionsAction({ skipClearFor: [SetMeasureDistanceToolState] }));
		this.store.dispatch(new SetMeasureDistanceToolState(!value));
	}

	toggleAutoImageProcessing() {
		this.store.dispatch(new SetAutoImageProcessing());
		this.closeManualProcessingMenu();
	}

	toggleSubMenu(subMenu: SubMenuEnum) {
		const value = (subMenu !== this.subMenu) ? subMenu : null;
		this.store.dispatch(new SetSubMenu(value));
	}

	onAnimation() {
		this.store.dispatch(new SetSubMenu(null));
	}

	isExpand(subMenu: SubMenuEnum): boolean {
		return this.subMenu === subMenu;
	}

	closeManualProcessingMenu() {
		if (this.isExpand(this.subMenuEnum.manualImageProcessing)) {
			this.toggleSubMenu(this.subMenuEnum.manualImageProcessing);
		}
	}
}
