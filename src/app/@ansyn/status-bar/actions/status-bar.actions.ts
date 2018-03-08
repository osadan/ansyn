import { Action } from '@ngrx/store';
import { ComboBoxesProperties } from '@ansyn/status-bar/models';
import { StatusBarFlag } from '@ansyn/status-bar';

export const StatusBarActionsTypes = {
	SHOW_LINK_COPY_TOAST: 'SHOW_LINK_COPY_TOAST',
	COPY_SELECTED_CASE_LINK: 'COPY_SELECTED_CASE_LINK',
	UPDATE_STATUS_FLAGS: 'UPDATE_STATUS_FLAGS',
	GO_PREV: 'GO_PREV',
	GO_NEXT: 'GO_NEXT',
	BACK_TO_WORLD_VIEW: 'BACK_TO_WORLD_VIEW',
	EXPAND: 'EXPAND',
	SET_COMBOBOXES_PROPERTIES: 'SET_COMBOBOXES_PROPERTIES',
	SET_OVERLAYS_COUNT: 'SET_OVERLAYS_COUNT'
};
// some actions does not have payload
export type StatusActions = any;

export class CopySelectedCaseLinkAction implements Action {
	type: string = StatusBarActionsTypes.COPY_SELECTED_CASE_LINK;

	constructor() {
	}
}

export class UpdateStatusFlagsAction implements Action {
	type = StatusBarActionsTypes.UPDATE_STATUS_FLAGS;

	constructor(public payload: { key: StatusBarFlag, value?: boolean }) {
		// code...
	}
}

export class GoPrevAction implements Action {
	type: string = StatusBarActionsTypes.GO_PREV;

	constructor() {
	}
}

export class GoNextAction implements Action {
	type: string = StatusBarActionsTypes.GO_NEXT;

	constructor() {
	}
}

export class ExpandAction implements Action {
	type: string = StatusBarActionsTypes.EXPAND;

	constructor() {
	}
}

export class SetOverlaysCountAction implements Action {
	type = StatusBarActionsTypes.SET_OVERLAYS_COUNT;

	constructor(public payload: number) {
	}
}

export class SetComboBoxesProperties implements Action {
	type = StatusBarActionsTypes.SET_COMBOBOXES_PROPERTIES;
	constructor(public payload: ComboBoxesProperties) {
	}
}