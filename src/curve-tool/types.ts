import { Rect } from 'konva/lib/shapes/Rect';
import Konva from "konva";
import Line = Konva.Line;

export interface IAnchorGroup {
  start: Rect
  control: Rect
  end: Rect
  curve: Line
}
