import {Point, Rectangle, GraphicsAssist, Vector} from "./graphic";
import CoordTransform from "./coordTransform";
import Control from "./control";

enum ControlStyle {
    Rectangle = 1,
    Circle = 2
}

abstract class Entity {
    /**
     * 是否处于激活状态
     */
    public isActive = false;
    /**
     * 是否可见
     */
    public visible = true;
    /**
     * 是否绘制控制点
     */
    public isDrawControlPoint = true;
    /**
     * 坐标转换
     */
    public ctf: CoordTransform;
    /**
     * x方向缩放是否禁用
     */
    public xLocked = false;
    /**
     * y方向缩放是否禁用
     */
    public yLocked = false;
    /**
     * 对角线缩放是否禁用
     */
    public diagLocked = false;
    /**
     * 旋转是否禁用
     */
    public rotateLocked = false;
    /**
     * 控制点样式
     */
    public controlStyle = ControlStyle.Circle;
    /**
     * 控制点大小
     */
    public controlSize = 20;
    /**
     * 选中时边框样式
     */
    public borderStyle = "#007acc";
    /**
     * 选中时边框线宽
     */
    public borderWidth = 2;
    /**
     * 旋转点距离包围框矩形的距离
     */
    public rotateControlDistance = 40;
    /**
     * 是否绘制自定义按钮
     */
    public isDrawControl = true;
    /**
     * 自定义控件（按钮）
     */
    private _controls: Control[] = [];
    /**
     * 自定义控件（按钮）
     */
    public get controls() {
        return this._controls;
    }

    public constructor() {
        this.ctf = new CoordTransform(1);
    }
    public get rotateOrigin() {
        return this.ctf.base;
    }

    public addControl(...ctrs: Control[]) {
        ctrs.forEach((control) => {
            control.owner = this;
            this._controls.push(control);
        });
    }

    public draw(ctx: CanvasRenderingContext2D) {
        if (this.visible) {
            this.drawContent(ctx);
            if (this.isActive) {
                this.drawBound(ctx);
                if (this.isDrawControlPoint) {
                    this.drawControlPoint(ctx);
                }
                if (this.isDrawControl) {
                    for (let i = 0; i < this._controls.length; i++) {
                        this._controls[i].draw(ctx);
                    }
                }
            }
        }
    }

    /**
     * 绘制当前entity的内容
     */
    protected abstract drawContent(ctx: CanvasRenderingContext2D): void;

    /**
     * 获得包围框
     */
    protected abstract getBoundWorld(): Rectangle;

    /**
     * 设置旋转中心
     */
    protected abstract setRotateOrigin(originW: Point): void;

    /**
     * 包围框（世界坐标系）
     * 这个每次获得，都要重新计算包围框，大大降低了效率，后期考虑改进
     */
    protected get boundWorld(): Rectangle {
        return this.getBoundWorld();
    }

    /**
     * 包围框（屏幕坐标系）
     */
    public get bound(): Rectangle {
        const boundW = this.getBoundWorld();
        const locationW = GraphicsAssist.mid(boundW.lt, boundW.rd);
        const locationD = this.ctf.worldToDevice_Point(locationW);
        const widthD = boundW.width * 1 / this.ctf.worldToDevice_Len_X;
        const heightD = boundW.height * 1 / this.ctf.worldToDevice_Len_Y;
        const boundD = new Rectangle(locationD, widthD, heightD);
        boundD.angle = this.ctf.anticlockwiseAngle;
        return boundD;
    }

    /**
     * 获得left middle控制点包围框（设备坐标系）
     */
    public getControlPointBound_lm_device(): Rectangle {
        const controlPointW = GraphicsAssist.mid(this.boundWorld.lt, this.boundWorld.ld);
        const controlPointD = this.ctf.worldToDevice_Point(controlPointW);
        return new Rectangle(controlPointD, this.controlSize, this.controlSize);
    }

    /**
     * 获得right middle控制点包围框（设备坐标系）
     */
    public getControlPointBound_rm_device(): Rectangle {
        const controlPointW = GraphicsAssist.mid(this.boundWorld.rt, this.boundWorld.rd);
        const controlPointD = this.ctf.worldToDevice_Point(controlPointW);
        return new Rectangle(controlPointD, this.controlSize, this.controlSize);
    }

    /**
     * 获得top middle控制点包围框（设备坐标系）
     */
    public getControlPointBound_tm_device(): Rectangle {
        const controlPointW = GraphicsAssist.mid(this.boundWorld.lt, this.boundWorld.rt);
        const controlPointD = this.ctf.worldToDevice_Point(controlPointW);
        return new Rectangle(controlPointD, this.controlSize, this.controlSize);
    }

    /**
     * 获得bottom middle控制点包围框（设备坐标系）
     */
    public getControlPointBound_bm_device(): Rectangle {
        const controlPointW = GraphicsAssist.mid(this.boundWorld.ld, this.boundWorld.rd);
        const controlPointD = this.ctf.worldToDevice_Point(controlPointW);
        return new Rectangle(controlPointD, this.controlSize, this.controlSize);
    }

    /**
     * 获得left top控制点包围框（设备坐标系）
     */
    public getControlPointBound_lt_device(): Rectangle {
        const controlPointW = this.boundWorld.lt;
        const controlPointD = this.ctf.worldToDevice_Point(controlPointW);
        return new Rectangle(controlPointD, this.controlSize, this.controlSize);
    }

    /**
     * 获得left top控制点包围框（设备坐标系）
     */
    public getControlPointBound_rt_device(): Rectangle {
        const controlPointW = this.boundWorld.rt;
        const controlPointD = this.ctf.worldToDevice_Point(controlPointW);
        return new Rectangle(controlPointD, this.controlSize, this.controlSize);
    }

    /**
     * 获得left bottom控制点包围框（设备坐标系）
     */
    public getControlPointBound_lb_device(): Rectangle {
        const controlPointW = this.boundWorld.ld;
        const controlPointD = this.ctf.worldToDevice_Point(controlPointW);
        return new Rectangle(controlPointD, this.controlSize, this.controlSize);
    }

    /**
     * 获得right bottom控制点包围框（设备坐标系）
     */
    public getControlPointBound_rb_device(): Rectangle {
        const controlPointW = this.boundWorld.rd;
        const controlPointD = this.ctf.worldToDevice_Point(controlPointW);
        return new Rectangle(controlPointD, this.controlSize, this.controlSize);
    }

    /**
     * 获得旋转控制点包围框（设备坐标系）
     */
    public getControlPointBound_rotate_device(): Rectangle {
        const tm = GraphicsAssist.mid(this.boundWorld.lt, this.boundWorld.rt);
        const controlPointW = new Point(tm.x, tm.y - this.rotateControlDistance);
        const controlPointD = this.ctf.worldToDevice_Point(controlPointW);
        return new Rectangle(controlPointD, this.controlSize, this.controlSize);
    }

    /**
     * 绘制包围框
     */
    protected drawBound(ctx: CanvasRenderingContext2D): void {
        const boundRect = this.boundWorld;
        ctx.strokeStyle = this.borderStyle;
        ctx.lineWidth = this.borderWidth;
        // 绘制边界
        const boundRectLtd = this.ctf.worldToDevice_Point(boundRect.lt);
        const boundRectLdd = this.ctf.worldToDevice_Point(boundRect.ld);
        const boundRectRtd = this.ctf.worldToDevice_Point(boundRect.rt);
        const boundRectRdd = this.ctf.worldToDevice_Point(boundRect.rd);

        ctx.beginPath();
        ctx.moveTo(boundRectLtd.x, boundRectLtd.y);
        ctx.lineTo(boundRectLdd.x, boundRectLdd.y);
        ctx.lineTo(boundRectRdd.x, boundRectRdd.y);
        ctx.lineTo(boundRectRtd.x, boundRectRtd.y);
        ctx.closePath();
        ctx.stroke();
    }

    /**
     * 绘制控制点 
     */
    protected drawControlPoint(ctx: CanvasRenderingContext2D): void {
        /**绘制一个控制点 */
        const drawControlPoint = (ctx: CanvasRenderingContext2D, worldPoint: Point) => {
            switch (this.controlStyle) {
                case ControlStyle.Rectangle:
                    // 设备坐标点
                    const devicePoint = this.ctf.worldToDevice_Point(worldPoint);
                    const ltd = new Point(devicePoint.x - this.controlSize * 0.5, devicePoint.y - this.controlSize * 0.5);
                    const ldd = new Point(devicePoint.x - this.controlSize * 0.5, devicePoint.y + this.controlSize * 0.5);
                    const rdd = new Point(devicePoint.x + this.controlSize * 0.5, devicePoint.y + this.controlSize * 0.5);
                    const rtd = new Point(devicePoint.x + this.controlSize * 0.5, devicePoint.y - this.controlSize * 0.5);
                    // 绘制
                    ctx.beginPath();
                    ctx.moveTo(ltd.x, ltd.y);
                    ctx.lineTo(ldd.x, ldd.y);
                    ctx.lineTo(rdd.x, rdd.y);
                    ctx.lineTo(rtd.x, rtd.y);
                    ctx.closePath();
                    ctx.fill();
                    break;
                case ControlStyle.Circle:
                    const ow = worldPoint;
                    const od = this.ctf.worldToDevice_Point(ow);
                    const sizeD = this.controlSize * 0.5;
                    ctx.beginPath();
                    ctx.ellipse(od.x, od.y, sizeD * 0.5, sizeD * 0.5, 0, 0, 2 * Math.PI);
                    ctx.fill();
                    break;
                default:
                    throw new Error("unknow control style.")
            }
        }

        const boundRect = this.boundWorld;
        ctx.strokeStyle = this.borderStyle;
        ctx.fillStyle = this.borderStyle;
        ctx.lineWidth = this.borderWidth;

        // 绘制x控制点
        if (!this.xLocked) {
            drawControlPoint(ctx, GraphicsAssist.mid(boundRect.lt, boundRect.ld));
            drawControlPoint(ctx, GraphicsAssist.mid(boundRect.rt, boundRect.rd));
        }

        // 绘制y控制点
        if (!this.yLocked) {
            drawControlPoint(ctx, GraphicsAssist.mid(boundRect.lt, boundRect.rt));
            drawControlPoint(ctx, GraphicsAssist.mid(boundRect.ld, boundRect.rd));
        }

        // 绘制顶点处控制点
        if (!this.diagLocked) {
            drawControlPoint(ctx, boundRect.lt);
            drawControlPoint(ctx, boundRect.ld);
            drawControlPoint(ctx, boundRect.rt);
            drawControlPoint(ctx, boundRect.rd);
        }

        // 绘制旋转点
        if (!this.rotateLocked) {
            const tmW = GraphicsAssist.mid(boundRect.lt, boundRect.rt);
            const tmD = this.ctf.worldToDevice_Point(tmW);
            const rotatePointW = new Point(tmW.x, tmW.y - this.rotateControlDistance);
            const rotatePointD = this.ctf.worldToDevice_Point(rotatePointW);

            ctx.beginPath();
            ctx.moveTo(tmD.x, tmD.y);
            ctx.lineTo(rotatePointD.x, rotatePointD.y);
            ctx.stroke();
            drawControlPoint(ctx, rotatePointW);
        }
    }

    /**
     * 平移
     */
    public displacement(vector: Vector) {
        this.ctf.displacement(vector);
    }

    /**
     * 缩放
     */
    public zoom(originInDevice: Point, scale: number) {
        this.ctf.zoom(originInDevice, scale);
    }

    /**
     * 缩放X方向
     */
    public zoomX(originInDevice: Point, scale: number) {
        this.ctf.zoomX(originInDevice, scale);
    }

    /**
     * 缩放Y方向
     */
    public zoomY(originInDevice: Point, scale: number) {
        this.ctf.zoomY(originInDevice, scale);
    }

    /**
     * 顺时针旋转
     * @param originInDevice 旋转中心
     * @param angle 旋转角度（弧度值）
     */
    public rotateAnticlockwise(angle: number) {
        this.ctf.rotateAnticlockwise(angle);
    }

    /**
     * 转换成图片base64 dataurl
     * @param scale 在当前大小的基础上在缩放一个比例值 
     * @param type （与HTMLCanvasElement.toDataURL的第一个参数相同）图片格式
     * @param quality （与HTMLCanvasElement.toDataURL的第二个参数相同）在指定图片格式为 image/jpeg 或 image/webp的情况下，可以从 0 到 1 的区间内选择图片的质量。如果超出取值范围，将会使用默认值 0.92。
     */
    public toDataUrl(type?: string, scale?: {x: number, y: number}, quality?: any) {
        const canvas = document.createElement("canvas");
        let min_x = Math.min(this.bound.lt.x, this.bound.ld.x, this.bound.rt.x, this.bound.rd.x);
        const max_x = Math.max(this.bound.lt.x, this.bound.ld.x, this.bound.rt.x, this.bound.rd.x);
        let min_y = Math.min(this.bound.lt.y, this.bound.ld.y, this.bound.rt.y, this.bound.rd.y);
        const max_y = Math.max(this.bound.lt.y, this.bound.ld.y, this.bound.rt.y, this.bound.rd.y);
        const height = max_y - min_y;
        const width = max_x - min_x;
        if (scale) {
            canvas.width = scale.x * width;
            canvas.height = scale.y * height;
            canvas.style.width = `${scale.x * width}px`;
            canvas.style.height = `${scale.y * height}px`;
        } else {
            canvas.width = width;
            canvas.height = height;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
        }

        const ctx = canvas.getContext("2d");
        if (scale) {
            ctx?.scale(scale.x, scale.y);
            ctx?.translate(-min_x, -min_y);
        } else {
            ctx?.translate(-min_x, -min_y);
        }
        if (ctx) {
            this.drawContent(ctx);
            ctx.resetTransform();
        }
        return canvas.toDataURL(type, quality);
    }
}

/**
 * 图片
 */
export class Image extends Entity {
    public src: string;
    private get width() {
        return this._image.width;
    }
    private get height() {
        return this._image.height;
    }
    public position: Point;
    private _image: HTMLImageElement;

    /**
     * _image是否load
     */
    private get imgLoaded() {
        return this._image ? this._image.complete && this._image.naturalHeight !== 0 : false;
    }
    constructor(position: Point, src: string, size: {width: number, height: number}) {
        super();
        this.position = position;
        this.src = src;

        let image = new window.Image();
        if (size) {
            image = new window.Image(size.width, size.height);
        }
        image.src = src;
        this._image = image;

        this.setRotateOrigin(new Point(this.position.x + 0.5 * this.width, this.position.y + 0.5 * this.height));
    }
    protected drawContent(ctx: CanvasRenderingContext2D): void {
        const draw = () => {
            const width = 1 / this.ctf.worldToDevice_Len_X * this.width;
            const height = 1 / this.ctf.worldToDevice_Len_Y * this.height;
            const x = this.position.x * 1 / this.ctf.worldToDevice_Len_X;
            const y = this.position.y * 1 / this.ctf.worldToDevice_Len_Y;
            ctx.translate(this.ctf.base.x, this.ctf.base.y);
            ctx.rotate(-this.ctf.anticlockwiseAngle);
            ctx.drawImage(this._image, x, y, width, height);
            ctx.resetTransform();
        };

        if (this.imgLoaded) {
            draw();
        } else {
            this._image.onload = () => {
                draw();
            };
        }
    }
    public getBoundWorld(): Rectangle {
        return new Rectangle(new Point(this.position.x + 0.5 * this.width, this.position.y + 0.5 * this.height), this.width, this.height);
    }
    protected setRotateOrigin(originW: Point): void {
        const dx = this.position.x - originW.x;
        const dy = this.position.y - originW.y;
        this.position = new Point(dx, dy);
        this.ctf.base = originW;
    }
}

/**
 * 形状
 */
export abstract class Shape extends Entity {
    public lineW: number; // 线宽
    public strokeStyle: string; // 轮廓颜色
    public fillStyle: string; // 填充色
    public filled: boolean; // 是否是填充色
    public constructor() {
        super();
        this.lineW = 1;
        this.strokeStyle = "red";
        this.fillStyle = "red";
        this.filled = false;
    }
}

/**
 * 多义线形状,是一个形状，可以是一个多义线，但是不能是一条直线段。
 */
export class PolyShape extends Shape {
    public vertexs: Point[];
    public closed: boolean;
    public constructor(vertexs: Point[], closed = false) {
        super();
        this.vertexs = vertexs;
        this.closed = closed;
        this.setRotateOrigin(GraphicsAssist.mid(this.boundWorld.lt, this.boundWorld.rd));
    }

    /**
     * 在canvas上绘制图形
     */
    protected drawContent(ctx: CanvasRenderingContext2D): void {
        if (this.vertexs.length <= 2) {
            throw new Error("the count of vertex must greater then 2.");
        }

        // 改变样式
        ctx.strokeStyle = this.strokeStyle;
        ctx.fillStyle = this.fillStyle;
        ctx.lineWidth = this.lineW;

        // 转换顶点
        let points: Point[] = [];
        this.vertexs.forEach((vertex) => {
            points.push(this.ctf.worldToDevice_Point(vertex));
        })

        // 绘制
        if (this.filled) {
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            if (this.closed) {
                ctx.closePath();
            }
            ctx.stroke();
        }
    }

    /**
     * 求包围框
     */
    public getBoundWorld(): Rectangle {
        return Rectangle.bound(this.vertexs);
    }
    /**
     * 设置旋转中心
     */
    protected setRotateOrigin(originW: Point): void {
        for (let i = 0; i < this.vertexs.length; i++) {
            const dx = this.vertexs[i].x - originW.x;
            const dy = this.vertexs[i].y - originW.y;
            this.vertexs[i] = new Point(dx, dy);
        }

        this.ctf.base = originW;
    }
}

/**
 * 圆形
 */
export class Circle extends Shape {
    public center: Point;
    public radiusX: number;
    public radiusY: number;

    public constructor(center: Point, radius1: number, radius2?: number) {
        super();
        this.center = center;
        this.radiusX = radius1;
        this.radiusY = radius2 ?? radius1;

        this.setRotateOrigin(GraphicsAssist.mid(this.boundWorld.lt, this.boundWorld.rd));
    }

    public drawContent(ctx: CanvasRenderingContext2D): void {
        // 改变样式
        ctx.strokeStyle = this.strokeStyle;
        ctx.fillStyle = this.fillStyle;
        ctx.lineWidth = this.lineW;

        const o = this.ctf.worldToDevice_Point(this.center);
        const r1 = 1 / this.ctf.worldToDevice_Len_X * this.radiusX;
        const r2 = 1 / this.ctf.worldToDevice_Len_Y * this.radiusY;

        ctx.translate(o.x, o.y);
        ctx.rotate(-this.ctf.anticlockwiseAngle);
        ctx.beginPath();
        ctx.ellipse(0, 0, r1, r2, 0, 0, 2 * Math.PI);
        ctx.resetTransform();

        if (this.filled) {
            ctx.fill();
        } else {
            ctx.stroke();
        }
    }

    /**
     * 求包围框
     */
    public getBoundWorld(): Rectangle {
        return new Rectangle(this.center, 2 * this.radiusX, 2 * this.radiusY);
    }
    protected setRotateOrigin(originW: Point): void {
        const dx = this.center.x - originW.x;
        const dy = this.center.y - originW.y;
        this.center = new Point(dx, dy);
        this.ctf.base = originW;
    }
}

/**
 * 一组entity的集合
 */
export class EntityCollection extends Entity {
    public entities: Entity[];
    public constructor(entities: Entity[]) {
        super();
        this.entities = entities;
        this.ctf = new CoordTransform(1);

        this.rotateLocked = true;
        this.xLocked = true;
        this.yLocked = true;
        this.diagLocked = true;
    }
    public drawContent(ctx: CanvasRenderingContext2D): void {
        for (let i = 0; i < this.entities.length; i++) {
            this.entities[i].draw(ctx);
        }

        if (this.isActive) {
            this.drawBound(ctx);
            if (this.isDrawControlPoint) {
                this.drawControlPoint(ctx);
            }
        }
    }
    protected getBoundWorld(): Rectangle {
        const boundsD = this.entities.map((ent) => ent.bound);
        return Rectangle.union(boundsD);
    }
    protected setRotateOrigin(originW: Point): void {
        throw new Error("Method not implemented.");
    }
}

export default Entity;
