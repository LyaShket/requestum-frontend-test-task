import { Rect } from 'konva/lib/shapes/Rect';
import { Shape } from 'konva/lib/Shape';

export interface IAnchorGroup {
  start: Rect
  control: Rect
  end: Rect
  curve: Shape
}
