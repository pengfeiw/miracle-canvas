import Entity from "./entity";
import MiracleMouseControl from "./mouse";
import * as MiracleEntity from "./entity";
import * as MiracleGraphic from "./graphic";
import * as MiracleControl from "./control";

export class Miracle {
    private low_canvas: HTMLCanvasElement;
    private up_canvas: HTMLCanvasElement | null;
    public entities: Entity[];
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
    public set rotateLocked(value: boolean){
        this.entities.forEach((ent) => ent.rotateLocked = value);
    }

    private mouseControl?: MiracleMouseControl;
    constructor(canvas: HTMLCanvasElement, entities = []) {
        this.entities = entities;
        this.low_canvas = canvas;
        const parentElement = canvas.parentElement;

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
            ctx.clearRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
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
    public removeEntity(entity: Entity) {
        const index = this.entities.indexOf(entity);
        if (index > -1) {
            this.entities.splice(index, 1);
            this.redraw();
        } else {
            throw new Error("要删除的entity，不存在。")
        }
    }
}

export {MiracleEntity, MiracleGraphic, MiracleControl};
