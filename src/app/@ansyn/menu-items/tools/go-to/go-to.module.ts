import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoToComponent } from './go-to/go-to.component';
import { FormsModule } from '@angular/forms';
import { GeoComponent } from './projections/geo/geo.component';
import { UtmComponent } from './projections/utm/utm.component';
import { AnsynFormsModule } from '@ansyn/core';

@NgModule({
	imports: [CommonModule, FormsModule, AnsynFormsModule],
	declarations: [GoToComponent, GeoComponent, UtmComponent],
	exports: [GoToComponent, FormsModule]
})
export class GoToModule {
}
