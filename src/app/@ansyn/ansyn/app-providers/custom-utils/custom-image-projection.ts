
import Projection from 'ol/proj/projection';
import { olx } from 'openlayers';
import Extent from 'ol/extent';
import { UUID } from 'angular2-uuid';

export class CustomImageProjection  extends Projection {

	constructor(numOfPyramidsLevels) {
		let options: olx.ProjectionOptions = {
			code: UUID.UUID(),
			extent : Extent.boundingExtent([[0, 0], [512 * Math.pow(2, numOfPyramidsLevels), 512 * Math.pow(2, numOfPyramidsLevels)]]),
			units : 'pixels'
		};
		super(options);
	}
}
