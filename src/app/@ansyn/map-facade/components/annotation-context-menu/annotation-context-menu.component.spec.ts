import { ComponentFixture, inject, TestBed } from '@angular/core/testing';
import { AnnotationContextMenuComponent } from './annotation-context-menu.component';
import { DebugElement } from '@angular/core';
import { MapEffects } from '../../effects/map.effects';
import { Store, StoreModule } from '@ngrx/store';
import { IMapState, mapFeatureKey, MapReducer } from '../../reducers/map.reducer';
import { Actions } from '@ngrx/effects';
import { Subject } from 'rxjs';
import { By } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import {
	AnnotationInteraction,
	AnnotationsColorComponent,
	ColorPickerComponent,
	IAnnotationsSelectionEventData
} from '@ansyn/core';
import { AnnotationsWeightComponent } from '@ansyn/core';
import { PositionChangedAction } from '../../actions/map.actions';
import { EventEmitter } from '@angular/core';


describe('AnnotationContextMenuComponent', () => {
	let component: AnnotationContextMenuComponent;
	let fixture: ComponentFixture<AnnotationContextMenuComponent>;
	let store: Store<IMapState>;
	let actions: EventEmitter<PositionChangedAction>;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [
				{ provide: Actions, useValue: new EventEmitter() },
				{
					provide: MapEffects, useValue: {
						annotationContextMenuTrigger$: new Subject()
					}
				}
			],
			declarations: [
				AnnotationContextMenuComponent,
				AnnotationsWeightComponent,
				AnnotationsColorComponent,
				ColorPickerComponent
			],
			imports: [
				FormsModule,
				StoreModule.forRoot({ [mapFeatureKey]: MapReducer })
			]
		}).compileComponents();
	});

	beforeEach(inject([Store, Actions], (_store: Store<IMapState>, _actions: EventEmitter<any>) => {
		store = _store;
		fixture = TestBed.createComponent(AnnotationContextMenuComponent);
		component = fixture.componentInstance;
		actions = _actions;
		fixture.detectChanges();
	}));

	it('should create', () => {
		expect(component).toBeTruthy();
	});

	describe('check annotation context menu trigger the focus and styling', () => {
		beforeEach(() => {
			spyOn(component.host.nativeElement, 'click');
		});

		it(`check Circle annotation shape`, () => {
			const actionPayload = {
				payload: {
					interactionType: AnnotationInteraction.click,
					featureId: 'featureId',
					boundingRect: {
						top: 100,
						height: 100,
						left: 100,
						width: 100
					}
				}
			};

			(<Subject<any>>component.mapEffect.annotationContextMenuTrigger$).next(actionPayload);

			expect((<IAnnotationsSelectionEventData>component.clickMenuProps).boundingRect).toEqual({
				top: 100,
				height: 100,
				left: 100,
				width: 100
			});

		});
	});

	it('positionChanged$ should close context menu (by blur)', () => {
		actions.emit(new PositionChangedAction(<any>{ id: '', position: null }));
		expect(component.clickMenuProps).toBeNull();
	});

	it('click on remove feature button', () => {
		component.clickMenuProps = {
			showLabel: true,
			featureId: 'featureId',
			label: 'label',
			mapId: 'id',
			type: 'Rectangle',
			style: {},
			boundingRect: {
				top: 100,
				height: 100,
				left: 100,
				width: 100
			}
		};
		fixture.detectChanges();
		spyOn(component, 'removeFeature');
		const de: DebugElement = fixture.debugElement.query(By.css('button.removeFeature'));
		de.triggerEventHandler('click', {});
		expect(component.removeFeature).toHaveBeenCalled();
	});


});
