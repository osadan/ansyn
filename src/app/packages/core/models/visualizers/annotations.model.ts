export interface AnnotationsContextMenuBoundingRect {
	top: number;
	left: number;
	width: number;
	height: number;
	rotation: number;
}

export interface AnnotationsContextMenuEvent {
	featureId: string;
	boundingRect: AnnotationsContextMenuBoundingRect;
}

export type AnnotationMode = 'Point' | 'LineString' | 'Polygon'| 'Circle' | 'Rectangle' | 'Arrow' | undefined;
