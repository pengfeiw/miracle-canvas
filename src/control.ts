import Entity from "./entity";
import {GraphicsAssist, Point, Rectangle} from "./graphic";

/**
 * 控件的定位中心
 */
export enum ControlBase {
    o = 0,
    lt,
    lm,
    ld,
    md,
    rd,
    rm,
    rt,
    mt
}

/**
 * 计算按钮的位置（左上角点）
 * @param base 定位方式
 * @param offsetX 相当于base的x偏移量
 * @param offsetY 相当于base的y偏移量
 * @param ownerBoundD 所属entity的屏幕包围框
 */
const caculateControlLocation = (base: ControlBase, offsetX: number, offsetY: number, ownerBoundD: Rectangle): Point => {
    let ctrLt = ownerBoundD.location;
    switch (base) {
        case ControlBase.lt:
            ctrLt = ownerBoundD.lt;
            break;
        case ControlBase.lm:
            ctrLt = GraphicsAssist.mid(ownerBoundD.lt, ownerBoundD.ld);
            break;
        case ControlBase.ld:
            ctrLt = ownerBoundD.ld;
            break;
        case ControlBase.md:
            ctrLt = GraphicsAssist.mid(ownerBoundD.ld, ownerBoundD.rd);
            break;
        case ControlBase.rd:
            ctrLt = ownerBoundD.rd;
            break;
        case ControlBase.rm:
            ctrLt = GraphicsAssist.mid(ownerBoundD.rd, ownerBoundD.rt);
            break;
        case ControlBase.rt:
            ctrLt = ownerBoundD.rt;
            break;
        case ControlBase.mt:
            ctrLt = GraphicsAssist.mid(ownerBoundD.lt, ownerBoundD.rt);
            break;
        default:
            break;
    }

    const dirVectorX = GraphicsAssist.getNormalVectorByAngle(-ownerBoundD.angle);
    const dirVectorY = GraphicsAssist.getNormalVectorByAngle(-ownerBoundD.angle + Math.PI * 0.5);
    dirVectorX.scale(offsetX);
    dirVectorY.scale(offsetY);
    ctrLt.translate(dirVectorX);
    ctrLt.translate(dirVectorY);

    return ctrLt;
};

/**
 * 按钮
 */
abstract class Control {
    /**
     * 基点
     */
    public base = ControlBase.o;
    /**
     * 在基点，主方向（X）上的偏移值
     */
    public offsetX = 0;
    /**
     * 在基点，副方向（Y）上的偏移值
     */
    public offsetY = 0;
    /**
     * 控件所属entity，不要擅自修改这个值
     */
    public owner?: Entity;
    /**
     * 鼠标样式
     */
    public cursorStyle = "pointer";
    /**
     * 鼠标点击事件
     */
    public mouseDownHandler: (event: MouseEvent) => void;

    /**
     * 鼠标点击事件
     */
    public mouseUpHandler: (event: MouseEvent) => void;

    /**
     * 触摸事件
     */
    public touchStart: (event: TouchEvent) => void;
    /**
     * 触摸事件
     */
    public touchEnd: (event: TouchEvent) => void;

    /**
     * 控件的左上角坐标
     */
    protected get leftTop() {
        return caculateControlLocation(this.base, this.offsetX, this.offsetY, this.owner!.bound);
    }

    public constructor(base = ControlBase.o, offsetX = 0, offsetY = 0) {
        this.base = base;
        this.offsetX = offsetX;
        this.offsetY = offsetY;
        this.mouseDownHandler = () => {};
        this.mouseUpHandler = () => {};
        this.touchStart = () => {};
        this.touchEnd = () => {};
    }

    /**
     * 绘制
     * @param ctx canvas二维绘制对象
     * @param ownerBound 所属的Entity的设备坐标系
     */
    public abstract draw(ctx: CanvasRenderingContext2D): void;

    /**
     * 获得屏幕坐标系
     */
    public abstract bound(): Rectangle;
}

/**
 * 图片按钮
 */
export class ImageControl extends Control {
    private get src() {
        return this._image.src;
    }
    private get width() {
        return this._image.width;
    }
    private get height() {
        return this._image.height;
    }
    private _image: HTMLImageElement;
    /**
     * _image是否load
     */
    private get imgLoaded() {
        return this._image ? this._image.complete && this._image.naturalHeight !== 0 : false;
    }

    public constructor(src: string, size?: {width: number, height: number}, base = ControlBase.o, offsetX = 0, offsetY = 0) {
        super(base, offsetX, offsetY);
        let image = new Image(60, 25);
        if (size) {
            image = new Image(size.width, size.height);
        }
        image.src = src;

        this._image = image;
    }
    public draw(ctx: CanvasRenderingContext2D): void {
        if (this.owner !== undefined) {
            const drawImage = () => {
                const location = this.leftTop;
                ctx.translate(location!.x, location!.y);
                ctx.rotate(-this.owner!.bound.angle);

                ctx.drawImage(this._image, 0, 0, this._image.width, this._image.height);
                ctx.resetTransform();
            };

            if (this.imgLoaded) {
                drawImage();
            } else {
                this._image.onload = () => {
                    drawImage();
                };
            }
        }
    }

    public bound(): Rectangle {
        if (this.owner) {
            const location = this.leftTop;
            const angle = this.owner.bound.angle;
            const dirVectX = GraphicsAssist.getNormalVectorByAngle(-angle); // 因为逆时针旋转，所以这里angle必须用负数
            const dirVectY = GraphicsAssist.getNormalVectorByAngle(-angle + Math.PI * 0.5);
            dirVectX.scale(this.width * 0.5);
            dirVectY.scale(this.height * 0.5);
            location.translate(dirVectX);
            location.translate(dirVectY);
            const rectangle = new Rectangle(location, this.width, this.height);
            rectangle.angle = angle;
            return rectangle;
        }

        return new Rectangle(new Point(0, 0), this.width, this.height);
    }
}

/**
 * 文字按钮
 */
class TextControl extends Control {
    public text: string;
    public color = "black";
    public fontSize = 10;
    public font = "微软雅黑";
    public borderWidth = 1;
    public borderColor = "black";
    public borderRadius = 0;
    public constructor(text: string, base = ControlBase.o, offsetX = 0, offsetY = 0) {
        super(base, offsetX, offsetY);
        this.text = text;
    }
    public draw(ctx: CanvasRenderingContext2D): void {
        throw new Error("Method not implemented.");
    }

    public bound(): Rectangle {
        throw new Error("Method not implemented.");
    }
}

export default Control;
