import Entity, {EntityCollection} from "./entity";
import {Rectangle, Point, GraphicsAssist, Vector} from "./graphic";

export enum OperatorStatus {
    /**
     * 无任何操作
     */
    None = 0,
    /**
     * 框选操作
     */
    BoxSelect,
    /**
     * 点击自定义按钮
     */
    ControlClick,
    /**
     * 旋转entity
     */
    RotateEntity,
    /**
     * 移动Entity
     */
    MoveEntity,
    /**
     * 改变entity大小，左上
     */
    ChangeEntitySizeLt,
    /**
     * 改变entity大小，左中
     */
    ChangeEntitySizeLm,
    /**
     * 改变entity大小，左下
     */
    ChangeEntitySizeLb,
    /**
     * 改变entity大小，中下
     */
    ChangeEntitySizeMb,
    /**
     * 改变entity大小，右下
     */
    ChangeEntitySizeRb,
    /**
     * 改变entity大小，右中
     */
    ChangeEntitySizeRm,
    /**
     * 改变entity大小，右上
     */
    ChangeEntitySizeRt,
    /**
     * 改变entity大小，中上
     */
    ChangeEntitySizeMt,
}

const getTouchPos = (canvas: HTMLCanvasElement, event: TouchEvent): {x: number, y: number} => {
    const rect = canvas.getBoundingClientRect();
    return {
        x: event.changedTouches[0].clientX - rect.left,
        y: event.changedTouches[0].clientY - rect.top
    };
};


interface DynamicRect {
    lt: Point;
    rd: Point;
}

abstract class Operator {
    protected entities: Entity[]; // 所有entity
    protected activeCollection?: EntityCollection; // 当激活的entity个数大于1时，activeCollection不是undefined
    protected canvas: HTMLCanvasElement; // entity所在的画布
    public limitInCanvas = false; // 是否限制entity在canvas内部
    protected dragging = false; // 是否正在拖拽
    protected operatorDownPosition?: Point; // 鼠标点击位置
    protected operator = OperatorStatus.BoxSelect; // 用户此时的操作类型
    protected dynamicRect?: DynamicRect;

    public constructor(entities: Entity[], canvas: HTMLCanvasElement) {
        this.entities = entities;
        this.canvas = canvas;
    }

    protected get visibleEntities() {
        return this.entities.filter(ent => ent.visible);
    }

    protected getActiveEntities() {
        return this.visibleEntities.filter((ent) => ent.isActive);
    }

    protected redraw() {
        const ctx = this.canvas.getContext("2d");
        if (ctx) {
            // 绘制动态矩形
            ctx.clearRect(-2, -2, this.canvas.clientWidth + 4, this.canvas.clientHeight + 4);
            ctx.setLineDash([]);

            const drawControlPoint_store: boolean[] = [];
            const drawControl_store: boolean[] = [];

            // 存储属性值
            for (let i = 0; i < this.visibleEntities.length; i++) {
                drawControlPoint_store.push(this.visibleEntities[i].isDrawControlPoint);
                drawControl_store.push(this.visibleEntities[i].isDrawControl);
            }

            // 绘制entity
            const activeEntities = this.getActiveEntities();
            if (activeEntities.length > 1) {
                const collection = new EntityCollection(activeEntities);
                collection.isActive = true;
                collection.isDrawControlPoint = true;
                activeEntities.forEach((ent) => {
                    ent.isDrawControlPoint = false;
                    ent.isDrawControl = false;
                })

                for (let i = 0; i < this.visibleEntities.length; i++) {
                    const entity = this.visibleEntities[i];
                    if (!activeEntities.includes(entity)) {
                        entity.draw(ctx);
                    }
                }
                collection.draw(ctx);
            } else {
                for (let i = 0; i < this.visibleEntities.length; i++) {
                    const entity = this.visibleEntities[i];
                    entity.draw(ctx);
                }
            }

            // 绘制动态矩形
            if (this.operator === OperatorStatus.BoxSelect && this.dynamicRect) {
                const dynaimcRect = this.dynamicRect;
                ctx.setLineDash([6]);
                ctx.strokeStyle = "black";
                ctx.beginPath();
                ctx.strokeRect(dynaimcRect.lt.x, dynaimcRect.lt.y, dynaimcRect.rd.x - dynaimcRect.lt.x, dynaimcRect.rd.y - dynaimcRect.lt.y);
            }

            // 恢复属性值
            for (let i = 0; i < this.visibleEntities.length; i++) {
                this.visibleEntities[i].isDrawControlPoint = drawControlPoint_store[i];
                this.visibleEntities[i].isDrawControl = drawControl_store[i];
            }
        }
    }

    /**
     * 绘制动态框选框 
     */
    protected drawSelectBox = (operatorPos: Point) => {
        if (this.dynamicRect) {
            this.dynamicRect = {
                lt: this.dynamicRect!.lt,
                rd: operatorPos
            }
            this.redraw();            
        }
    };

    /**
     * 移动entity时，动态绘制图元 
     */
    protected MoveEntity = (movement: {x: number, y: number}) => {
        const activeEntities = this.getActiveEntities();
        for (let i = 0; i < activeEntities.length; i++) {
            activeEntities[i].displacement(new Vector(movement.x, movement.y));
            if (this.limitInCanvas) {
                const bound = activeEntities[i].bound;
                const min_x = Math.min(bound.lt.x, bound.ld.x, bound.rt.x, bound.rd.x);
                const max_x = Math.max(bound.lt.x, bound.ld.x, bound.rt.x, bound.rd.x);
                const min_y = Math.min(bound.lt.y, bound.ld.y, bound.rt.y, bound.rd.y);
                const max_y = Math.max(bound.lt.y, bound.ld.y, bound.rt.y, bound.rd.y);

                let move_x = 0, move_y = 0;
                if (min_x < 0) {
                    move_x = -min_x;
                }
                if (max_x > this.canvas.width) {
                    move_x = -(max_x - this.canvas.width);
                }
                if (min_y < 0) {
                    move_y = -min_y;
                }
                if (max_y > this.canvas.height) {
                    move_y = -(max_y - this.canvas.height);
                }

                activeEntities[i].displacement(new Vector(move_x, move_y));
            }
        }
        this.redraw();
    };

    /**
     * 改变entity尺寸
     */
    protected resizeEntity = (operatorPos: {x: number, y: number}) => {
        const activeEntities = this.getActiveEntities();
        if (activeEntities.length > 0) {
            let boundD: Rectangle;
            if (this.activeCollection) {
                boundD = this.activeCollection.bound;
            } else {
                const entity = activeEntities[0];
                boundD = entity.bound;
            }

            if (this.operator === OperatorStatus.ChangeEntitySizeLt) {
                const origin = boundD.rd;
                const cursorDisToOrigin = Math.sqrt(Math.pow(operatorPos.x - origin.x, 2) + Math.pow(operatorPos.y - origin.y, 2));
                const zoomScale = cursorDisToOrigin / Math.sqrt(Math.pow(boundD.lt.x - boundD.rd.x, 2) + Math.pow(boundD.lt.y - boundD.rd.y, 2));

                for (let i = 0; i < activeEntities.length; i++) {
                    activeEntities[i].zoom(origin, zoomScale);
                }
            }
            else if (this.operator === OperatorStatus.ChangeEntitySizeLm) {
                const origin = GraphicsAssist.mid(boundD.rt, boundD.rd);
                const cursorDisToOrigin = Math.sqrt(Math.pow(operatorPos.x - origin.x, 2) + Math.pow(operatorPos.y - origin.y, 2));
                const zoomScale = cursorDisToOrigin / Math.sqrt(Math.pow(boundD.lt.x - boundD.rt.x, 2) + Math.pow(boundD.lt.y - boundD.rt.y, 2));

                for (let i = 0; i < activeEntities.length; i++) {
                    activeEntities[i].zoomX(origin, zoomScale);
                }
            }
            else if (this.operator === OperatorStatus.ChangeEntitySizeLb) {
                const origin = boundD.rt;
                const cursorDisToOrigin = Math.sqrt(Math.pow(operatorPos.x - origin.x, 2) + Math.pow(operatorPos.y - origin.y, 2));
                const zoomScale = cursorDisToOrigin / Math.sqrt(Math.pow(boundD.ld.x - boundD.rt.x, 2) + Math.pow(boundD.ld.y - boundD.rt.y, 2));

                for (let i = 0; i < activeEntities.length; i++) {
                    activeEntities[i].zoom(origin, zoomScale);
                }
            }
            else if (this.operator === OperatorStatus.ChangeEntitySizeMb) {
                const origin = GraphicsAssist.mid(boundD.lt, boundD.rt);
                const cursorDisToOrigin = Math.sqrt(Math.pow(operatorPos.x - origin.x, 2) + Math.pow(operatorPos.y - origin.y, 2));
                const zoomScale = cursorDisToOrigin / Math.sqrt(Math.pow(boundD.lt.x - boundD.ld.x, 2) + Math.pow(boundD.lt.y - boundD.ld.y, 2));
                for (let i = 0; i < activeEntities.length; i++) {
                    activeEntities[i].zoomY(origin, zoomScale);
                }
            }
            else if (this.operator === OperatorStatus.ChangeEntitySizeRb) {
                const origin = boundD.lt;
                const cursorDisToOrigin = Math.sqrt(Math.pow(operatorPos.x - origin.x, 2) + Math.pow(operatorPos.y - origin.y, 2));
                const zoomScale = cursorDisToOrigin / Math.sqrt(Math.pow(boundD.lt.x - boundD.rd.x, 2) + Math.pow(boundD.lt.y - boundD.rd.y, 2));
                for (let i = 0; i < activeEntities.length; i++) {
                    activeEntities[i].zoom(origin, zoomScale);
                }
            }
            else if (this.operator === OperatorStatus.ChangeEntitySizeRm) {
                const origin = GraphicsAssist.mid(boundD.lt, boundD.ld);
                const cursorDisToOrigin = Math.sqrt(Math.pow(operatorPos.x - origin.x, 2) + Math.pow(operatorPos.y - origin.y, 2));
                const zoomScale = cursorDisToOrigin / Math.sqrt(Math.pow(boundD.lt.x - boundD.rt.x, 2) + Math.pow(boundD.lt.y - boundD.rt.y, 2));
                for (let i = 0; i < activeEntities.length; i++) {
                    activeEntities[i].zoomX(origin, zoomScale);
                }
            }
            else if (this.operator === OperatorStatus.ChangeEntitySizeRt) {
                const origin = boundD.ld;
                const cursorDisToOrigin = Math.sqrt(Math.pow(operatorPos.x - origin.x, 2) + Math.pow(operatorPos.y - origin.y, 2));
                const zoomScale = cursorDisToOrigin / Math.sqrt(Math.pow(boundD.lt.x - boundD.rd.x, 2) + Math.pow(boundD.lt.y - boundD.rd.y, 2));
                for (let i = 0; i < activeEntities.length; i++) {
                    activeEntities[i].zoom(origin, zoomScale);
                }
            }
            else if (this.operator === OperatorStatus.ChangeEntitySizeMt) {
                const origin = GraphicsAssist.mid(boundD.ld, boundD.rd);
                const cursorDisToOrigin = Math.sqrt(Math.pow(operatorPos.x - origin.x, 2) + Math.pow(operatorPos.y - origin.y, 2));
                const zoomScale = cursorDisToOrigin / Math.sqrt(Math.pow(boundD.lt.x - boundD.ld.x, 2) + Math.pow(boundD.lt.y - boundD.ld.y, 2));
                for (let i = 0; i < activeEntities.length; i++) {
                    activeEntities[i].zoomY(origin, zoomScale);
                }
            }
            this.redraw();
        }
    };
    /**
     * 旋转操作
     * @param event 
     */
    protected rotateEntity = (operatorPos: {x: number, y: number}) => {
        const activeEntities = this.getActiveEntities();
        if (activeEntities.length > 0) {
            for (let i = 0; i < activeEntities.length; i++) {
                const boundD = activeEntities[i].bound;
                const rotateOrigin = boundD.location;
                const rotateControlBoundD = activeEntities[i].getControlPointBound_rotate_device();
                const point1 = rotateControlBoundD.location;
                const point11 = new Point(point1.x - rotateOrigin.x, point1.y - rotateOrigin.y);
                const point11Polar = GraphicsAssist.cartesianToPolar(point11);

                const point2 = new Point(operatorPos.x, operatorPos.y);
                const point22 = new Point(point2.x - rotateOrigin.x, point2.y - rotateOrigin.y);
                const point22Polar = GraphicsAssist.cartesianToPolar(point22);

                const rotateAngle = point22Polar.angle - point11Polar.angle;
                activeEntities[i].rotateAnticlockwise(-rotateAngle);
            }
        }
        this.redraw();
    }
}

/**
 * 鼠标操作
 */
class MouseOperator extends Operator {
    private mouseHoveEntity?: Entity; // 鼠标未拖拽时，当前鼠标悬浮的Entity

    public constructor(entities: Entity[], canvas: HTMLCanvasElement) {
        super(entities, canvas);
        this.initEvent();
    }

    private initEvent() {
        this.canvas.addEventListener("mousedown", this.onMouseDown);
        this.canvas.addEventListener("mouseup", this.onMouseUp);
        this.canvas.addEventListener("mousemove", this.onMouseMove);
        this.canvas.addEventListener("mousemove", this.onMouseMove_setOperator);
    }

    //#region 鼠标操作
    /**
     * 1.设置鼠标样式
     * 2.根据鼠标位置，判断鼠标操作的类型
     */
    private onMouseMove_setOperator = (event: MouseEvent) => {
        if (this.dragging === false) {
            this.operator = OperatorStatus.BoxSelect;
            this.mouseHoveEntity = undefined;
            const mousePoint = new Point(event.offsetX, event.offsetY);
            this.canvas.style.cursor = "auto";

            const activeEntities = this.getActiveEntities();
            // 判断是否处于控制点内
            if (activeEntities.length > 0) {
                let entity: Entity;
                if (activeEntities.length > 1 && this.activeCollection) {
                    entity = this.activeCollection!;
                } else {
                    entity = activeEntities[0];
                }

                const isMouseInControlBound = (ctrBoundD: Rectangle) => {
                    if (GraphicsAssist.isPointInRectangle(mousePoint, ctrBoundD)) {
                        return true;
                    }
                    return false;
                }

                if (!entity.diagLocked) {
                    // 左上角控制点
                    const ltCtrBoundD = entity.getControlPointBound_lt_device();
                    if (isMouseInControlBound(ltCtrBoundD)) {
                        this.canvas.style.cursor = "pointer";
                        this.operator = OperatorStatus.ChangeEntitySizeLt;
                        return;
                    }
                    // 左下
                    const lbCtrBoundD = entity.getControlPointBound_lb_device();
                    if (isMouseInControlBound(lbCtrBoundD)) {
                        this.canvas.style.cursor = "pointer";
                        this.operator = OperatorStatus.ChangeEntitySizeLb;
                        return;
                    }

                    // 右下
                    const RbCtrBoundD = entity.getControlPointBound_rb_device();
                    if (isMouseInControlBound(RbCtrBoundD)) {
                        this.canvas.style.cursor = "pointer";
                        this.operator = OperatorStatus.ChangeEntitySizeRb;
                        return;
                    }

                    // 右上
                    const RtCtrBoundD = entity.getControlPointBound_rt_device();
                    if (isMouseInControlBound(RtCtrBoundD)) {
                        this.canvas.style.cursor = "pointer";
                        this.operator = OperatorStatus.ChangeEntitySizeRt;
                        return;
                    }
                }

                if (!entity.xLocked) {
                    // 左中
                    const lmCtrBoundD = entity.getControlPointBound_lm_device();
                    if (isMouseInControlBound(lmCtrBoundD)) {
                        this.canvas.style.cursor = "pointer";
                        this.operator = OperatorStatus.ChangeEntitySizeLm;
                        return;
                    }

                    // 右中
                    const RmCtrBoundD = entity.getControlPointBound_rm_device();
                    if (isMouseInControlBound(RmCtrBoundD)) {
                        this.canvas.style.cursor = "pointer";
                        this.operator = OperatorStatus.ChangeEntitySizeRm;
                        return;
                    }
                }

                if (!entity.yLocked) {
                    // 中下
                    const MbCtrBoundD = entity.getControlPointBound_bm_device();
                    if (isMouseInControlBound(MbCtrBoundD)) {
                        this.canvas.style.cursor = "pointer";
                        this.operator = OperatorStatus.ChangeEntitySizeMb;
                        return;
                    }

                    // 中上
                    const MtCtrBoundD = entity.getControlPointBound_tm_device();
                    if (isMouseInControlBound(MtCtrBoundD)) {
                        this.canvas.style.cursor = "pointer";
                        this.operator = OperatorStatus.ChangeEntitySizeMt;
                        return;
                    }
                }

                if (!entity.rotateLocked) {
                    // 旋转点
                    const rotateCtrBoundD = entity.getControlPointBound_rotate_device();
                    if (isMouseInControlBound(rotateCtrBoundD)) {
                        this.canvas.style.cursor = "crosshair";
                        this.operator = OperatorStatus.RotateEntity;
                        return;
                    }
                }

                if (entity.isDrawControlPoint) {
                    // 点击自定义按钮
                    for (let i = 0; i < entity.controls.length; i++) {
                        const control = entity.controls[i];
                        const controlBound = control.bound();

                        if (isMouseInControlBound(controlBound)) {
                            this.canvas.style.cursor = control.cursorStyle;
                            this.operator = OperatorStatus.ControlClick;
                            return;
                        }
                    }
                }
            }

            if (this.activeCollection) {
                const boundD = this.activeCollection.bound;
                if (GraphicsAssist.isPointInRectangle(mousePoint, boundD)) {
                    this.canvas.style.cursor = "move";
                    this.operator = OperatorStatus.MoveEntity;
                    return;
                }
            }

            for (let i = 0; i < this.visibleEntities.length; i++) {
                const ent = this.visibleEntities[i];
                const boundD = ent.bound;

                // // 测试 ---绘制屏幕包围框
                // const ctx = this.canvas.getContext("2d");
                // if (ctx) {
                //     ctx.strokeStyle = "gray";
                //     ctx.beginPath();
                //     ctx.moveTo(boundD.lt.x, boundD.lt.y);
                //     ctx.lineTo(boundD.ld.x, boundD.ld.y);
                //     ctx.lineTo(boundD.rd.x, boundD.rd.y);
                //     ctx.lineTo(boundD.rt.x, boundD.rt.y);
                //     ctx.closePath();
                //     ctx.stroke();
                // }

                // 鼠标位于entity包围框内，鼠标指针为"move"
                if (GraphicsAssist.isPointInRectangle(mousePoint, boundD)) {
                    this.canvas.style.cursor = "move";
                    this.operator = OperatorStatus.MoveEntity;
                    this.mouseHoveEntity = ent;
                    return;
                }
            }
        }
    }

    private onMouseDown = (event: MouseEvent) => {
        if (event.button === 0) {
            this.dragging = true;
            this.operatorDownPosition = new Point(event.offsetX, event.offsetY);
            if (this.operator === OperatorStatus.MoveEntity) {
                if (this.getActiveEntities().length > 0) {
                    const boundsD = this.getActiveEntities().map((ent) => ent.bound);

                    const unionBoundD = Rectangle.union(boundsD);

                    if (!GraphicsAssist.isPointInRectangle(this.operatorDownPosition, unionBoundD)) {
                        this.visibleEntities.forEach((ent) => {
                            ent.isActive = false;
                        })

                        if (this.mouseHoveEntity) {
                            this.mouseHoveEntity.isActive = true;
                        }
                    }
                }
                else {
                    if (this.mouseHoveEntity) {
                        this.mouseHoveEntity.isActive = true;
                    }
                }
            }
            if (this.operator === OperatorStatus.ControlClick) {
                const isMouseInControlBound = (ctrBoundD: Rectangle) => {
                    const mousePoint = new Point(event.offsetX, event.offsetY);
                    if (GraphicsAssist.isPointInRectangle(mousePoint, ctrBoundD)) {
                        return true;
                    }
                    return false;
                }
                const activeEntities = this.getActiveEntities();
                if (activeEntities.length > 0) {
                    const ent = activeEntities[0];
                    const ctr = ent.controls.find((control) => isMouseInControlBound(control.bound()));
                    ctr?.mouseDownHandler(event);
                }
            }
            if (this.operator === OperatorStatus.BoxSelect) {
                // this.dynamicRect = new Rectangle(this.mouseDownPosition, 0, 0);
                this.dynamicRect = {
                    lt: this.operatorDownPosition,
                    rd: this.operatorDownPosition
                };
                this.visibleEntities.forEach((ent) => {
                    ent.isActive = false;
                });
            }
            this.redraw();
        }
    }

    private onMouseMove = (event: MouseEvent) => {
        if (this.operator > 0) {
            event.preventDefault();
        }
        if (this.dragging) {
            switch (this.operator) {
                case OperatorStatus.BoxSelect:
                    this.drawSelectBox(new Point(event.offsetX, event.offsetY));
                    break;
                case OperatorStatus.MoveEntity:
                    this.MoveEntity({x: event.movementX, y: event.movementY});
                    break;
                case OperatorStatus.ChangeEntitySizeLt:
                    this.resizeEntity({x: event.offsetX, y: event.offsetY});
                    break;
                case OperatorStatus.ChangeEntitySizeLb:
                    this.resizeEntity({x: event.offsetX, y: event.offsetY});
                    break;
                case OperatorStatus.ChangeEntitySizeLm:
                    this.resizeEntity({x: event.offsetX, y: event.offsetY});
                    break;
                case OperatorStatus.ChangeEntitySizeMb:
                    this.resizeEntity({x: event.offsetX, y: event.offsetY});
                    break;
                case OperatorStatus.ChangeEntitySizeRb:
                    this.resizeEntity({x: event.offsetX, y: event.offsetY});
                    break;
                case OperatorStatus.ChangeEntitySizeRm:
                    this.resizeEntity({x: event.offsetX, y: event.offsetY});
                    break;
                case OperatorStatus.ChangeEntitySizeRt:
                    this.resizeEntity({x: event.offsetX, y: event.offsetY});
                    break;
                case OperatorStatus.ChangeEntitySizeMt:
                    this.resizeEntity({x: event.offsetX, y: event.offsetY});
                    break;
                case OperatorStatus.RotateEntity:
                    this.rotateEntity({x: event.offsetX, y: event.offsetY});
                    break;
                default:
                    break;
            }
        }
    }

    private onMouseUp = (event: MouseEvent) => {
        if (this.operator === OperatorStatus.BoxSelect && this.dynamicRect) {
            for (let i = 0; i < this.visibleEntities.length; i++) {
                const ent = this.visibleEntities[i];
                const boundD = ent.bound;
                const mouseRect = new Rectangle(GraphicsAssist.mid(this.dynamicRect.lt, this.dynamicRect.rd), this.dynamicRect.rd.x - this.dynamicRect.lt.x,
                    this.dynamicRect.rd.y - this.dynamicRect.lt.y);
                if (Rectangle.intersection(mouseRect, boundD)) {
                    ent.isActive = true;
                }
            }
        }

        // 自定义控件mouseup事件
        if (this.operator === OperatorStatus.ControlClick) {
            const isMouseInControlBound = (ctrBoundD: Rectangle) => {
                const mousePoint = new Point(event.offsetX, event.offsetY);
                if (GraphicsAssist.isPointInRectangle(mousePoint, ctrBoundD)) {
                    return true;
                }
                return false;
            }

            const activeEntities = this.getActiveEntities();
            if (activeEntities.length > 0) {
                const ent = activeEntities[0];
                const ctr = ent.controls.find((control) => isMouseInControlBound(control.bound()));
                ctr?.mouseUpHandler(event);
            }
        }

        // 设置activeEntsCollection
        const activeEnts = this.getActiveEntities();
        if (activeEnts.length > 1) {
            this.activeCollection = new EntityCollection(activeEnts);
        } else {
            this.activeCollection = undefined;
        }

        this.dragging = false;
        this.dynamicRect = undefined;
        this.redraw();
    }
    //#endregion
}

/**
 * 触屏操作
 */
class TouchOperator extends Operator {
    private previousTouch?: {x: number, y: number};
    public disableBoxSelect = true; // 触屏操作默认禁用boxSelect操作
    public constructor(entities: Entity[], canvas: HTMLCanvasElement) {
        super(entities, canvas);
        this.initEvent();
    }

    private initEvent() {
        this.canvas.addEventListener("touchstart", this.onTouchStart);
        this.canvas.addEventListener("touchmove", this.onTouchMove);
        this.canvas.addEventListener("touchend", this.onTouchEnd);
    }

    private onTouchStart = (event: TouchEvent) => {
        this.operator = this.disableBoxSelect ? OperatorStatus.None : OperatorStatus.BoxSelect;
        this.dragging = true;
        const touchPos = getTouchPos(event?.target as HTMLCanvasElement, event);
        const touchPoint: Point = new Point(touchPos.x, touchPos.y);
        this.previousTouch = {x: touchPoint.x, y: touchPoint.y};
        const activeEnts = this.getActiveEntities();
        // 判断触摸位置是否在activeCollection包围框内部
        if (this.activeCollection) {
            const bound = this.activeCollection.bound;
            if (GraphicsAssist.isPointInRectangle(new Point(touchPos.x, touchPos.y), bound)) {
                this.operator = OperatorStatus.MoveEntity;
            } else {
                activeEnts.forEach(ent => ent.isActive = false);
            }
            return;
        }

        activeEnts.forEach(ent => ent.isActive = false);
        if (activeEnts.length > 0) {
            // 自定义按钮touchStart事件
            for (let i = 0; i < activeEnts.length; i++) {
                const ent = activeEnts[i];
                const ctr = ent.controls.find((control) => GraphicsAssist.isPointInRectangle(touchPoint, control.bound()));
                if (ctr) {
                    ctr.touchStart(event);
                    this.operator = OperatorStatus.ControlClick;
                    ent.isActive = true;
                    return;
                }
            }

            // 判断是否处于控制点内
            for (let i = 0; i < activeEnts.length; i++) {
                const entity = activeEnts[i];
                if (!entity.diagLocked) {
                    // 左上角控制点
                    const ltCtrBoundD = entity.getControlPointBound_lt_device();
                    if (GraphicsAssist.isPointInRectangle(touchPoint, ltCtrBoundD)) {
                        this.canvas.style.cursor = "pointer";
                        this.operator = OperatorStatus.ChangeEntitySizeLt;
                        entity.isActive = true;
                        return;
                    }
                    // 左下
                    const lbCtrBoundD = entity.getControlPointBound_lb_device();
                    if (GraphicsAssist.isPointInRectangle(touchPoint, lbCtrBoundD)) {
                        this.canvas.style.cursor = "pointer";
                        this.operator = OperatorStatus.ChangeEntitySizeLb;
                        entity.isActive = true;
                        return;
                    }

                    // 右下
                    const RbCtrBoundD = entity.getControlPointBound_rb_device();
                    if (GraphicsAssist.isPointInRectangle(touchPoint, RbCtrBoundD)) {
                        this.canvas.style.cursor = "pointer";
                        this.operator = OperatorStatus.ChangeEntitySizeRb;
                        entity.isActive = true;
                        return;
                    }

                    // 右上
                    const RtCtrBoundD = entity.getControlPointBound_rt_device();
                    if (GraphicsAssist.isPointInRectangle(touchPoint, RtCtrBoundD)) {
                        this.canvas.style.cursor = "pointer";
                        this.operator = OperatorStatus.ChangeEntitySizeRt;
                        entity.isActive = true;
                        return;
                    }
                }

                if (!entity.xLocked) {
                    // 左中
                    const lmCtrBoundD = entity.getControlPointBound_lm_device();
                    if (GraphicsAssist.isPointInRectangle(touchPoint, lmCtrBoundD)) {
                        this.canvas.style.cursor = "pointer";
                        this.operator = OperatorStatus.ChangeEntitySizeLm;
                        entity.isActive = true;
                        return;
                    }

                    // 右中
                    const RmCtrBoundD = entity.getControlPointBound_rm_device();
                    if (GraphicsAssist.isPointInRectangle(touchPoint, RmCtrBoundD)) {
                        this.canvas.style.cursor = "pointer";
                        this.operator = OperatorStatus.ChangeEntitySizeRm;
                        entity.isActive = true;
                        return;
                    }
                }

                if (!entity.yLocked) {
                    // 中下
                    const MbCtrBoundD = entity.getControlPointBound_bm_device();
                    if (GraphicsAssist.isPointInRectangle(touchPoint, MbCtrBoundD)) {
                        this.canvas.style.cursor = "pointer";
                        this.operator = OperatorStatus.ChangeEntitySizeMb;
                        entity.isActive = true;
                        return;
                    }

                    // 中上
                    const MtCtrBoundD = entity.getControlPointBound_tm_device();
                    if (GraphicsAssist.isPointInRectangle(touchPoint, MtCtrBoundD)) {
                        this.canvas.style.cursor = "pointer";
                        this.operator = OperatorStatus.ChangeEntitySizeMt;
                        entity.isActive = true;
                        return;
                    }
                }

                if (!entity.rotateLocked) {
                    // 旋转点
                    const rotateCtrBoundD = entity.getControlPointBound_rotate_device();
                    if (GraphicsAssist.isPointInRectangle(touchPoint, rotateCtrBoundD)) {
                        this.canvas.style.cursor = "crosshair";
                        this.operator = OperatorStatus.RotateEntity;
                        entity.isActive = true;
                        return;
                    }
                }
            }
        }

        // 判断是否处于entity的包围框内
        for (let i = 0; i < this.visibleEntities.length; i++) {
            const entBound = this.visibleEntities[i].bound;
            if (GraphicsAssist.isPointInRectangle(new Point(touchPos.x, touchPos.y), entBound)) {
                this.operator = OperatorStatus.MoveEntity;
                this.visibleEntities[i].isActive = true;
                return;
            }
        }

        this.dynamicRect = {
            lt: touchPoint,
            rd: touchPoint
        }
    }

    private onTouchMove = (event: TouchEvent) => {
        const touchPos = getTouchPos(event.target as HTMLCanvasElement, event);
        if (this.operator > 0) {
            event.preventDefault();
        }

        switch (this.operator) {
            case OperatorStatus.BoxSelect:
                this.drawSelectBox(new Point(touchPos.x, touchPos.y));
                break;
            case OperatorStatus.MoveEntity:
                if (this.previousTouch) {
                    this.MoveEntity({x: touchPos.x - this.previousTouch.x, y: touchPos.y - this.previousTouch.y});
                    this.previousTouch = touchPos;
                }
                break;
            case OperatorStatus.ChangeEntitySizeLt:
                this.resizeEntity({x: touchPos.x, y: touchPos.y});
                break;
            case OperatorStatus.ChangeEntitySizeLb:
                this.resizeEntity({x: touchPos.x, y: touchPos.y});
                break;
            case OperatorStatus.ChangeEntitySizeLm:
                this.resizeEntity({x: touchPos.x, y: touchPos.y});
                break;
            case OperatorStatus.ChangeEntitySizeMb:
                this.resizeEntity({x: touchPos.x, y: touchPos.y});
                break;
            case OperatorStatus.ChangeEntitySizeRb:
                this.resizeEntity({x: touchPos.x, y: touchPos.y});
                break;
            case OperatorStatus.ChangeEntitySizeRm:
                this.resizeEntity({x: touchPos.x, y: touchPos.y});
                break;
            case OperatorStatus.ChangeEntitySizeRt:
                this.resizeEntity({x: touchPos.x, y: touchPos.y});
                break;
            case OperatorStatus.ChangeEntitySizeMt:
                this.resizeEntity({x: touchPos.x, y: touchPos.y});
                break;
            case OperatorStatus.RotateEntity:
                this.rotateEntity({x: touchPos.x, y: touchPos.y});
                break;
            default:
                break;
        }
    }

    private onTouchEnd = (event: TouchEvent) => {
        const touchPos = getTouchPos(this.canvas, event);
        if (this.operator === OperatorStatus.BoxSelect && this.dynamicRect) {
            for (let i = 0; i < this.visibleEntities.length; i++) {
                const ent = this.visibleEntities[i];
                const boundD = ent.bound;
                const mouseRect = new Rectangle(GraphicsAssist.mid(this.dynamicRect.lt, this.dynamicRect.rd), this.dynamicRect.rd.x - this.dynamicRect.lt.x,
                    this.dynamicRect.rd.y - this.dynamicRect.lt.y);
                if (Rectangle.intersection(mouseRect, boundD)) {
                    ent.isActive = true;
                }
            }
        }

        // 自定义控件touchup事件
        if (this.operator === OperatorStatus.ControlClick) {
            const isMouseInControlBound = (ctrBoundD: Rectangle) => {
                const touchPoint = new Point(touchPos.x, touchPos.y);
                if (GraphicsAssist.isPointInRectangle(touchPoint, ctrBoundD)) {
                    return true;
                }
                return false;
            }

            const activeEntities = this.getActiveEntities();
            if (activeEntities.length > 0) {
                const ent = activeEntities[0];
                const ctr = ent.controls.find((control) => isMouseInControlBound(control.bound()));
                ctr?.touchEnd(event);
            }
        }

        // 设置activeEntsCollection
        const activeEnts = this.getActiveEntities();
        if (activeEnts.length > 1) {
            this.activeCollection = new EntityCollection(activeEnts);
        } else {
            this.activeCollection = undefined;
        }

        this.dragging = false;
        this.previousTouch = undefined;
        this.dynamicRect = undefined;
        this.redraw();
    }
}
export {TouchOperator, MouseOperator};
