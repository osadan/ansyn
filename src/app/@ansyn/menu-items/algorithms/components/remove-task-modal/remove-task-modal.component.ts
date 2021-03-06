import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
	selector: 'ansyn-remove-task-modal',
	templateUrl: './remove-task-modal.component.html',
	styleUrls: ['./remove-task-modal.component.less']
})
export class RemoveTaskModalComponent {
	@Input() message = "Confirm?";
	@Output() submit = new EventEmitter<boolean>();

	onSubmit(answer = false) {
		this.submit.emit(answer)
	}
}
