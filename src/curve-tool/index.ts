import Konva from "konva";
import {
  EMPTY_ANCHOR_GROUP,
  ANCHOR_WIDTH,
  ANCHOR_HEIGHT,
  ANCHOR_HOVER_COLOR,
  ANCHOR_COLOR,
  ANCHOR_ACTIVE_COLOR, CURVE_ACTIVE_COLOR, ANCHOR_STROKE_WIDTH, CURVE_STROKE_WIDTH, CURVE_COLOR
} from "./constants";
import { IAnchorGroup } from "./types";
import { Rect } from "konva/lib/shapes/Rect";
import { Shape } from "konva/lib/Shape";
import { Layer } from "konva/lib/Layer";

export class CurveTool {
  anchorGroups: IAnchorGroup[] = [];
  activeAnchorGroupIdx: number = -1;
  activeAnchor: Rect = null;
  activeCurve: Shape = null;
  canvasImage: HTMLImageElement;
  canvasLayer: Layer = null;

  get activeAnchorGroup() {
    return this.anchorGroups[this.activeAnchorGroupIdx];
  }

  constructor(htmlImageId: string) {
    const htmlImage = document.getElementById(htmlImageId) as HTMLCanvasElement;
    this.canvasImage = new Image();
    this.canvasImage.src = htmlImage.getAttribute("src");

    const div = document.createElement("div");
    div.setAttribute("id", htmlImageId);
    htmlImage.parentNode.replaceChild(div, htmlImage);

    this.canvasImage.onload = this.init.bind(this, htmlImageId);
  }

  init(htmlCanvasId: string) {

    this.canvasLayer = new Konva.Layer();

    const stage = new Konva.Stage({
      container: htmlCanvasId,
      width: this.canvasImage.width,
      height: this.canvasImage.height
    });
    stage.add(this.canvasLayer);

    const bgImage = new Konva.Image({
      image: this.canvasImage,
      x: 0,
      y: 0,
      width: this.canvasImage.width,
      height: this.canvasImage.height
    });
    this.canvasLayer.add(bgImage);

    bgImage.on("mouseup", this.handleBgMouseUp.bind(this));
    stage.on("mousemove", this.handleStageMouseMove.bind(this));
    stage.on("mouseup", this.handleStageMouseUp.bind(this));
  }

  handleBgMouseUp(e: any) {
    if (this.activeAnchorGroupIdx > -1 && this.activeAnchorGroup.end) {
      return this.setActiveAnchorGroup(null);
    }

    if (this.activeAnchorGroupIdx === -1) {
      this.anchorGroups.push({ ...EMPTY_ANCHOR_GROUP });
      this.activeAnchorGroupIdx = this.anchorGroups.length - 1;
    }

    const x = e.evt.layerX;
    const y = e.evt.layerY;
    this.activeAnchorGroup.start = this.buildAnchor(x - ANCHOR_WIDTH / 2, y - ANCHOR_WIDTH / 2);

    const bindedAnchorGroup = this.activeAnchorGroup;
    this.activeAnchor = this.buildAnchor(x - ANCHOR_WIDTH / 2, y - ANCHOR_WIDTH / 2);
    this.activeCurve = new Konva.Shape({
      stroke: CURVE_ACTIVE_COLOR,
      strokeWidth: CURVE_STROKE_WIDTH,
      sceneFunc: (ctx: any, shape: any) => {
        if (this.activeAnchorGroupIdx === -1 || this.activeAnchorGroup?.end) {
          return;
        }

        ctx.beginPath();
        ctx.moveTo(bindedAnchorGroup.start.x() + ANCHOR_WIDTH / 2, bindedAnchorGroup.start.y() + ANCHOR_HEIGHT / 2);
        ctx.lineTo(this.activeAnchor.x() + ANCHOR_WIDTH / 2, this.activeAnchor.y() + ANCHOR_HEIGHT / 2);
        ctx.fillStrokeShape(shape);
      }
    });

    this.canvasLayer.add(this.activeCurve);
    this.activeCurve.zIndex(1);
  }

  handleStageMouseMove(e: any) {
    if (this.activeAnchorGroupIdx === -1 || this.activeAnchorGroup?.end) {
      return;
    }

    const x = e.evt.layerX;
    const y = e.evt.layerY;
    this.activeAnchor.x(x - ANCHOR_WIDTH / 2);
    this.activeAnchor.y(y - ANCHOR_WIDTH / 2);
  }

  handleStageMouseUp() {
    if (this.activeAnchorGroupIdx === -1 || this.activeAnchorGroup?.end) {
      return;
    }

    if (this.activeAnchor.x() === this.activeAnchorGroup.start.x() && this.activeAnchor.y() === this.activeAnchorGroup.start.y()) {
      return;
    }

    this.activeAnchorGroup.end = this.activeAnchor;

    this.activeAnchorGroup.control = this.buildAnchor(
      (this.activeAnchorGroup.start.x() + this.activeAnchorGroup.end.x()) / 2,
      (this.activeAnchorGroup.start.y() + this.activeAnchorGroup.end.y()) / 2
    );
    const bindedAnchorGroup = this.activeAnchorGroup;

    this.createCurveLine(bindedAnchorGroup);
    this.activeCurve.destroy();
  }

  setActiveAnchorGroup(activeAnchor: Rect = null) {
    this.activeAnchorGroupIdx = activeAnchor === null ? -1 : activeAnchor.getAttr("groupIdx");
    if (this.activeAnchorGroupIdx > -1 && this.activeAnchorGroup) {
      this.activeAnchorGroup.start?.stroke(activeAnchor === this.activeAnchorGroup.start ? ANCHOR_HOVER_COLOR : ANCHOR_ACTIVE_COLOR);
      this.activeAnchorGroup.end?.stroke(activeAnchor === this.activeAnchorGroup.end ? ANCHOR_HOVER_COLOR : ANCHOR_ACTIVE_COLOR);
      this.activeAnchorGroup.control?.stroke(activeAnchor === this.activeAnchorGroup.control ? ANCHOR_HOVER_COLOR : ANCHOR_ACTIVE_COLOR);
      this.activeAnchorGroup.curve?.stroke(CURVE_ACTIVE_COLOR);

      this.activeAnchorGroup.start?.zIndex(4);
      this.activeAnchorGroup.end?.zIndex(4);
      this.activeAnchorGroup.control?.zIndex(4);
      this.activeAnchorGroup.curve?.zIndex(3);
    }

    const notActiveAnchorGroups = this.anchorGroups.filter((q) => q !== this.activeAnchorGroup);
    notActiveAnchorGroups.forEach((q) => {
      q.start?.stroke(ANCHOR_COLOR);
      q.end?.stroke(ANCHOR_COLOR);
      q.control?.stroke(ANCHOR_COLOR);
      q.curve?.stroke(CURVE_COLOR);

      q.start?.zIndex(2);
      q.end?.zIndex(2);
      q.control?.zIndex(2);
      q.curve?.zIndex(1);
    });

    this.updateCurveLine(this.activeAnchorGroup);
  }

  buildAnchor(x: number, y: number): Rect {
    const anchor = new Konva.Rect({
      x,
      y,
      width: ANCHOR_WIDTH,
      height: ANCHOR_HEIGHT,
      stroke: ANCHOR_ACTIVE_COLOR,
      strokeWidth: ANCHOR_STROKE_WIDTH,
      draggable: true
    });
    this.canvasLayer.add(anchor);
    anchor.zIndex(2);
    anchor.setAttr("groupIdx", this.activeAnchorGroupIdx);

    const curveTool = this;
    anchor.on("mouseover", function() {
      if (curveTool.activeAnchorGroupIdx === this.getAttr("groupIdx") && !curveTool.activeCurve?.parent) {
        this.stroke(ANCHOR_HOVER_COLOR);
      }
    });
    anchor.on("mouseout", function() {
      if (curveTool.activeAnchorGroupIdx === this.getAttr("groupIdx") && !curveTool.activeCurve?.parent) {
        this.stroke(ANCHOR_ACTIVE_COLOR);
      }
    });
    anchor.on("dragmove", function() {
      curveTool.setActiveAnchorGroup(this);
    });

    this.setActiveAnchorGroup(anchor);
    return anchor;
  }

  private createCurveLine(bindedAnchorGroup: IAnchorGroup) {
    const points = [
      bindedAnchorGroup.start.x() + ANCHOR_WIDTH / 2,
      bindedAnchorGroup.start.y() + ANCHOR_HEIGHT / 2,
      bindedAnchorGroup.control.x() + ANCHOR_WIDTH / 2,
      bindedAnchorGroup.control.y() + ANCHOR_HEIGHT / 2,
      bindedAnchorGroup.end.x() + ANCHOR_WIDTH / 2,
      bindedAnchorGroup.end.y() + ANCHOR_HEIGHT / 2
    ];
    bindedAnchorGroup.curve = new Konva.Line({
      points,
      stroke: CURVE_ACTIVE_COLOR,
      strokeWidth: 2,
      lineJoin: "round",
      lineCap: "round",
      tension: 0.5
    });
    this.canvasLayer.add(bindedAnchorGroup.curve);
    bindedAnchorGroup.curve.zIndex(1);
    bindedAnchorGroup.curve.on("mouseup", this.handleBgMouseUp.bind(this));
  }

  private updateCurveLine(bindedAnchorGroup: IAnchorGroup) {
    if (!bindedAnchorGroup?.control) {
      return;
    }

    const points: number[] = [
      bindedAnchorGroup.start.x() + ANCHOR_WIDTH / 2,
      bindedAnchorGroup.start.y() + ANCHOR_HEIGHT / 2,
      bindedAnchorGroup.control.x() + ANCHOR_WIDTH / 2,
      bindedAnchorGroup.control.y() + ANCHOR_HEIGHT / 2,
      bindedAnchorGroup.end.x() + ANCHOR_WIDTH / 2,
      bindedAnchorGroup.end.y() + ANCHOR_HEIGHT / 2
    ];
    bindedAnchorGroup.curve.points(points);
  }
}
