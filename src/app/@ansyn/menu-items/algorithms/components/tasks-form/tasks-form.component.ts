import { Component, OnDestroy, OnInit } from '@angular/core';
import { TasksService } from '../../services/tasks.service';
import { TranslateService } from '@ngx-translate/core';
import { combineLatest, Observable, of } from 'rxjs/index';
import { Store } from '@ngrx/store';
import { ICaseMapState, IOverlay, selectFavoriteOverlays } from '@ansyn/core';
import { AutoSubscription, AutoSubscriptions } from 'auto-subscriptions';
import { switchMap, take, tap } from 'rxjs/internal/operators';
import {
	AlgorithmTask,
	AlgorithmTaskStatus,
	AlgorithmTaskWhichOverlays,
	IAlgorithmConfig
} from '../../models/tasks.model';
import { filter, map } from 'rxjs/operators';
import {
	RunTaskAction,
	SetCurrentTask,
	SetCurrentTaskAlgorithmName,
	SetCurrentTaskMasterOverlay,
	SetCurrentTaskName,
	SetCurrentTaskOverlays,
	SetTaskDrawIndicator
} from '../../actions/tasks.actions';
import {
	selectAlgorithmTasksSelectedTaskId,
	selectCurrentAlgorithmTaskAlgorithmName,
	selectCurrentAlgorithmTaskMasterOverlay,
	selectCurrentAlgorithmTaskName,
	selectCurrentAlgorithmTaskOverlays,
	selectCurrentAlgorithmTaskRegion,
	selectCurrentAlgorithmTaskStatus
} from '../../reducers/tasks.reducer';
import { MapFacadeService, selectActiveMapId, selectMapsList } from '@ansyn/map-facade';
import { ToggleIsPinnedAction } from '@ansyn/menu';

@Component({
	selector: 'ansyn-tasks-form',
	templateUrl: './tasks-form.component.html',
	styleUrls: ['./tasks-form.component.less']
})
@AutoSubscriptions({
	init: 'ngOnInit',
	destroy: 'ngOnDestroy'
})
export class TasksFormComponent implements OnInit, OnDestroy {
	// task: AlgorithmTask = new AlgorithmTask();
	whichOverlays: AlgorithmTaskWhichOverlays = 'favorite_overlays';
	taskStatus: AlgorithmTaskStatus;
	taskName: string;
	algName: string;
	algNames: string[] = [];
	loading = false;
	errorMsg = '';
	MIN_NUM_OF_OVERLAYS = 2;

	get algorithms(): { [alg: string]: IAlgorithmConfig } {
		return this.tasksService.config.algorithms;
	}

	@AutoSubscription
	currentTaskStatus$: Observable<AlgorithmTaskStatus> = this.store$.select(selectCurrentAlgorithmTaskStatus).pipe(
		tap((status: AlgorithmTaskStatus) => {
			this.taskStatus = status;
		})
	);

	@AutoSubscription
	currentTaskName$: Observable<string> = this.store$.select(selectCurrentAlgorithmTaskName).pipe(
		tap((name: string) => {
			this.taskName = name;
		})
	);

	@AutoSubscription
	currentTaskAlgorithmName$: Observable<string> = this.store$.select(selectCurrentAlgorithmTaskAlgorithmName).pipe(
		tap((name: string) => {
			this.algName = name;
		})
	);

	@AutoSubscription
	currentTaskOverlays$: Observable<IOverlay[]> = this.store$.select(selectCurrentAlgorithmTaskOverlays);

	@AutoSubscription
	currentTaskMasterOverlay$: Observable<IOverlay[]> = this.store$.select(selectCurrentAlgorithmTaskMasterOverlay);

	currentTaskRegion$: Observable<IOverlay[]> = this.store$.select(selectCurrentAlgorithmTaskRegion);

	@AutoSubscription
	algorithmConfig$: Observable<IAlgorithmConfig> = this.currentTaskAlgorithmName$.pipe(
		map((name: string) => this.algorithms[name])
	);

	timeEstimation$: Observable<number> = combineLatest(this.currentTaskOverlays$, this.algorithmConfig$).pipe(
		map(([overlays, config]: [IOverlay[], IAlgorithmConfig]) => config.timeEstimationPerOverlayInMinutes * overlays.length)
	);

	selectedTask$: Observable<AlgorithmTask> = this.store$.select(selectAlgorithmTasksSelectedTaskId).pipe(
		switchMap((taskId: string) => {
			if (taskId) {
				this.loading = true;
				return this.tasksService.loadTask(taskId);
			} else {
				return of(null);
			}
		}),
		take(1) 
	);

	@AutoSubscription
	initCurrentTask$ = this.selectedTask$.pipe(
		tap((selectedTask: AlgorithmTask) => {
			this.loading = false;
			let task: AlgorithmTask;
			if (selectedTask) {
				task = selectedTask;
			} else {
				task = new AlgorithmTask();
			}
			this.store$.dispatch(new SetCurrentTask(task));
		})
	);

	@AutoSubscription
	isNewTask$: Observable<boolean> = this.currentTaskStatus$.pipe(
		map((status: AlgorithmTaskStatus) => status === 'New')
	);

	@AutoSubscription
	getOverlaysForNewTask$: Observable<IOverlay[]> = combineLatest(
		this.isNewTask$,
		this.currentTaskAlgorithmName$,
		this.store$.select(selectFavoriteOverlays)
	).pipe(
		filter(([isNew, algName, overlays]: [boolean, string, IOverlay[]]) => isNew && Boolean(algName)),
		map((([isNew, algName, overlays]: [boolean, string, IOverlay[]]) => {
			const result = overlays.filter((overlay: IOverlay) => {
				return this.algorithms[algName].sensorNames.includes(overlay.sensorName)
			});
			return result;
		})),
		tap((overlays: IOverlay[]) => {
			this.store$.dispatch(new SetCurrentTaskOverlays(overlays || []));
		})
	);

	@AutoSubscription
	getMasterOverlayForNewTask$: Observable<any> = combineLatest(
		this.isNewTask$,
		this.store$.select(selectActiveMapId),
		this.store$.select(selectMapsList),
		this.store$.select(selectCurrentAlgorithmTaskOverlays)
	).pipe(
		filter(([isNew, activeMapId, mapsList, overlays]: [boolean, string, ICaseMapState[], IOverlay[]]) => isNew),
		map(([isNew, activeMapId, mapsList, overlays]: [boolean, string, ICaseMapState[], IOverlay[]]) => {
			const activeMap = MapFacadeService.mapById(mapsList, activeMapId);
			return [activeMap.data.overlay, overlays]
		}),
		tap(([activeOverlay, overlays]: [IOverlay, IOverlay[]]) => {
			if (!activeOverlay || overlays.find(({ id }) => id === activeOverlay.id)) {
				this.store$.dispatch(new SetCurrentTaskMasterOverlay(activeOverlay));
				return activeOverlay;
			} else {
				this.showError('The active overlay is not one of the chosen overlays for the task');
				return null;
			}
		})
	);

	@AutoSubscription
	checkForErrors$: Observable<any> = combineLatest(
		this.isNewTask$,
		this.currentTaskAlgorithmName$,
		this.currentTaskMasterOverlay$,
		this.currentTaskOverlays$
	).pipe(
		filter(([isNew, algName, masterOverlay, overlays]: [boolean, string, IOverlay, IOverlay[]]) => isNew && Boolean(algName)),
		tap(([isNew, algName, masterOverlay, overlays]: [boolean, string, IOverlay, IOverlay[]]) => {
			let message = '';
			if (overlays.length < this.MIN_NUM_OF_OVERLAYS) {
				message = `The number of selected overlays ${overlays.length} should be at least ${this.MIN_NUM_OF_OVERLAYS}`;
			} else if (overlays.length > this.algorithms[algName].maxOverlays) {
				message = `The number of selected overlays ${overlays.length} should be at most ${this.algorithms[algName].maxOverlays}`;
			} else if (!masterOverlay) {
				message = 'No master overlay selected'
			}
			this.showError(message);
		}),
	);

	constructor(
		public tasksService: TasksService,
		public translate: TranslateService,
		protected store$: Store<any>
	) {
	}

	ngOnInit() {
		this.algNames = Object.keys(this.algorithms);
	}

	ngOnDestroy(): void {
		this.store$.dispatch(new SetCurrentTask(null));
	}

	showError(msg: string) {
		this.errorMsg = msg;
	}

	hasError(): boolean {
		return Boolean(this.errorMsg);
	}

	onSubmit() {
		this.store$.dispatch(new RunTaskAction());
	}

	startDrawMode() {
		this.store$.dispatch(new ToggleIsPinnedAction(true));
		this.store$.dispatch(new SetTaskDrawIndicator(true));
	}

	onTaskNameChange() {
		this.store$.dispatch(new SetCurrentTaskName(this.taskName));
	}

	onAlgorithmNameChange() {
		this.store$.dispatch(new SetCurrentTaskAlgorithmName(this.algName));
	}

}
