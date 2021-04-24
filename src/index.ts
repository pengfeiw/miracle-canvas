import Entity from "./entity";
import MiracleMouseControl from "./mouse";
import * as MiracleEntity from "./entity";
import * as MiracleGraphic from "./graphic";
import * as MiracleControl from "./control";

export interface Viewport {
    height: number;
    width: number;
}

export class Miracle {
    private low_canvas: HTMLCanvasElement;
    private up_canvas: HTMLCanvasElement | null;

    //============canvas store property, Recover when dispose=================
    private low_canvas_className_store = "";
    //============canvas store property, Recover when dispose=================


    /**
     * 限制entity在canvas内部
     */
    public set limitInCanvas(value: boolean) {
        if (this.mouseControl) {
            this.mouseControl.limitInCanvas = value;
        }
    }
    /**
     * 所有entity
     */
    public readonly entities: Entity[];
    /**
     * 当前canvas的视口
     */
    public get viewport(): Viewport {
        if (this.up_canvas) {
            return {
                height: this.up_canvas.height,
                width: this.up_canvas.width
            }
        }
        return {height: 0, width: 0};
    }
    /**
     * x方向缩放是否禁用
     */
    public set xLocked(value: boolean) {
        this.entities.forEach((ent) => ent.xLocked = value);
    }
    /**
     * y方向缩放是否禁用
     */
    public set yLocked(value: boolean) {
        this.entities.forEach((ent) => ent.yLocked = value);
    }
    /**
     * 对角线缩放是否禁用
     */
    public set diagLocked(value: boolean) {
        this.entities.forEach((ent) => ent.diagLocked = value);
    }
    /**
     *  旋转是否禁用
     */
    public set rotateLocked(value: boolean) {
        this.entities.forEach((ent) => ent.rotateLocked = value);
    }

    private mouseControl?: MiracleMouseControl;
    constructor(canvas: HTMLCanvasElement, entities = []) {
        this.entities = entities;
        this.low_canvas = canvas;
        const parentElement = canvas.parentElement;

        // 存储canvas原有属性
        this.low_canvas_className_store = this.low_canvas.className;

        this.up_canvas = null;
        if (parentElement) {
            parentElement.removeChild(canvas);
            this.up_canvas = canvas.cloneNode(true) as HTMLCanvasElement;
            const canvasContainer = document.createElement("div");
            canvasContainer.style.backgroundColor = "transparent";
            canvasContainer.style.display = "relative";
            canvasContainer.style.height = canvas.style.height;
            canvasContainer.style.width = canvas.style.width;
            canvasContainer.style.display = "inline-block";
            canvasContainer.style.border = canvas.style.border;
            canvasContainer.className = "miracle-container";

            this.up_canvas.style.position = "absolute";
            this.up_canvas.style.left = "0";
            this.up_canvas.style.top = "0";
            this.up_canvas.style.backgroundColor = "transparent";
            this.up_canvas.className = `up-canvas ${this.up_canvas.className}`;

            this.low_canvas.style.position = "absolute";
            this.low_canvas.style.left = "0";
            this.low_canvas.style.top = "0";
            this.low_canvas.className = `lower-canvas ${this.low_canvas.className}`;

            canvasContainer.appendChild(this.low_canvas);
            canvasContainer.appendChild(this.up_canvas);
            parentElement.appendChild(canvasContainer);
            this.mouseControl = new MiracleMouseControl(this.entities, this.up_canvas);
        }
    }

    public dispose() {
        // 恢复原有canvas的属性
        this.low_canvas.className = this.low_canvas_className_store;

        if (this.up_canvas) {
            const canvasContainer = this.up_canvas.parentElement;
            if (canvasContainer) {
                canvasContainer.removeChild(this.up_canvas);
            }
        }
    }
    /**
     * 添加entity
     */
    public addEntity(...entities: Entity[]) {
        this.entities.push(...entities);

        const ctx = this.up_canvas?.getContext("2d");
        if (ctx) {
            for (let i = 0; i < entities.length; i++) {
                this.entities[i].draw(ctx);
            }
        }
    }

    /**
     * 重绘
     */
    public redraw() {
        const ctx = this.up_canvas?.getContext("2d");
        if (ctx) {
            ctx.clearRect(-2, -2, ctx.canvas.clientWidth + 4, ctx.canvas.clientHeight + 4);
            for (let i = 0; i < this.entities.length; i++) {
                this.entities[i].draw(ctx);
            }
        }
    }

    /**
     * 获得当前激活的、可见的entity
     */
    public getActiveEntities() {
        return this.entities.filter((ent) => ent.visible && ent.isActive);
    }

    /**
     * 删除一个entity
     */
    public removeEntity(...entities: Entity[]) {
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            const index = this.entities.indexOf(entity);
            if (index > -1) {
                this.entities.splice(index, 1);
                this.redraw();
            } else {
                throw new Error("要删除的entity，不存在。")
            }
        }
    }

    /**
     * 删除所有entity，清空画布
     */
    public removeAll() {
        while(this.entities.length > 0) {
            this.entities.pop();
        }

        this.redraw();
    }

    /**
     * 转换成图片base64 dataurl
     * @param scale 在当前大小的基础上在缩放一个比例值 
     * @param type （与HTMLCanvasElement.toDataURL的第一个参数相同）图片格式
     * @param quality （与HTMLCanvasElement.toDataURL的第二个参数相同）在指定图片格式为 image/jpeg 或 image/webp的情况下，可以从 0 到 1 的区间内选择图片的质量。如果超出取值范围，将会使用默认值 0.92。
     */
    public toDataUrl(type?: string, scale?: {x: number, y: number}, quality?: any) {
        if (this.up_canvas) {
            const canvas = this.up_canvas.cloneNode() as HTMLCanvasElement;
            if (scale) {
                canvas.style.height = `${scale.y * this.viewport.height}px`;
                canvas.style.width = `${scale.x * this.viewport.width}px`;
                canvas.height = scale.y * this.viewport.height;
                canvas.width = scale.x * this.viewport.width;
            }

            const ctx = canvas.getContext("2d");

            if (scale) {
                ctx?.scale(scale.x, scale.y);
            }
            if (ctx) {
                ctx.drawImage(this.up_canvas, 0, 0);
                return canvas.toDataURL(type, quality);
            }
        }
    }
}

export {MiracleEntity, MiracleGraphic, MiracleControl};
