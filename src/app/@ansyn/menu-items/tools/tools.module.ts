import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolsComponent } from './tools/tools.component';
import { GoToModule } from './go-to/go-to.module';
import { OverlaysDisplayModeComponent } from './overlays-display-mode/overlays-display-mode.component';
import { AnnotationsControlComponent } from './components/annotations-control/annotations-control.component';
import { StoreModule } from '@ngrx/store';
import { toolsFeatureKey, ToolsReducer } from './reducers/tools.reducer';
import { ImageProcessingControlComponent } from './components/image-processing-control/image-processing-control.component';
import { ProjectionConverterService } from './services/projection-converter.service';
import { IToolsConfig, toolsConfig } from './models/tools-config';
import { CoreModule } from '@ansyn/core';

// @dynamic
@NgModule({
	imports: [
		CommonModule,
		CoreModule,
		GoToModule,
		StoreModule.forFeature(toolsFeatureKey, ToolsReducer)
	],
	providers: [ProjectionConverterService],
	declarations: [ToolsComponent, ImageProcessingControlComponent, OverlaysDisplayModeComponent, AnnotationsControlComponent],
	entryComponents: [ToolsComponent],
	exports: [ToolsComponent]
})

export class ToolsModule {


	static forRoot(config: IToolsConfig): ModuleWithProviders {
		return {
			ngModule: ToolsModule,
			providers: [
				{provide: toolsConfig, useValue: config}
			]
		};
	}

}
