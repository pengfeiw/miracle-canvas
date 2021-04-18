/**
 * 极坐标
 */
export interface PolarCoord {
    angle: number; // 角度
    length: number; // 模长
}
export class Point {
    public x: number;
    public y: number;
    public constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    /**
     * 求到另一个点的向量
     */
    public getVectorTo(point: Point) {
        return new Vector(point.x - this.x, point.y - this.y);
    }
}
export class Vector {
    public x: number;
    public y: number;
    public constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    /**
     * 向量点积
     */
    public static dotProduct(vec1: Vector, vec2: Vector) {
        return vec1.x * vec2.x + vec1.y * vec2.y;
    }

    /**
     * 向量乘积
     * 注意：向量的乘积本质上是一个矢量，但是这里适用于二维向量，求得结果是向量的模长。
     */
    public static multiProduct_Len(vec1: Vector, vec2: Vector) {
        return Math.abs(vec1.x * vec2.y - vec1.y * vec2.x);
    }

    /**
     * 求单位向量
     */
    public normalize() {
        const l = Math.sqrt(this.x * this.x + this.y * this.y);
        return new Vector(this.x / l, this.y / l);
    }
}

/**
 * 矩形区域，高和宽可以为负数
 */
export class Rectangle {
    public location: Point; // 矩形中点
    public angle: number; // 按照中心点的旋转角度
    private _width: number; // 宽度
    private _height: number; // 高度

    public get width() {
        return this._width;
    }

    public get height() {
        return this._height;
    }

    /**
     * 左上角点
     */
    public get lt() {
        const lt_normal  = new Point(this.location.x - this.width * 0.5, this.location.y - this.height * 0.5);
        return GraphicsAssist.rotatePoint(this.location, lt_normal, this.angle);
    }

    /**
     * 左下角点
     */
    public get ld() {
        const ld_normal = new Point(this.location.x - this.width * 0.5, this.location.y + this.height * 0.5);
        return GraphicsAssist.rotatePoint(this.location, ld_normal, this.angle);
    }

    /**
     * 右上角点
     */
    public get rt() {
        const rt_normal = new Point(this.location.x + this.width * 0.5, this.location.y - this.height * 0.5);
        return GraphicsAssist.rotatePoint(this.location, rt_normal, this.angle);
    }

    /**
     * 右下角点
     */
    public get rd() {
        const rd_normal = new Point(this.location.x + this.width * 0.5, this.location.y + this.height * 0.5);
        return GraphicsAssist.rotatePoint(this.location, rd_normal, this.angle);
    }

    /**
     * @param location 矩形的位置，左上角坐标
     * @param w 矩形的宽度
     * @param h 矩形的高度
     */
    public constructor(location: Point, w: number, h: number) {
        this.location = location;
        this.angle = 0;
        this._width = w;
        this._height = h;
    }

    /**
     * 求一组Point构成的包围框
     * @param points 点数组
     */
    public static bound(points: Point[]) {
        if (points.length <= 1) {
            throw new Error("Point的个数不能小于2");
        }
        let max_x = points[0].x;
        let max_y = points[0].y;
        let min_x = points[0].x;
        let min_y = points[0].y;
        for (let i = 1; i < points.length; i++) {
            max_x = Math.max(max_x, points[i].x);
            max_y = Math.max(max_y, points[i].y);
            min_x = Math.min(min_x, points[i].x);
            min_y = Math.min(min_y, points[i].y);
        }
        const lt = new Point(min_x, min_y);
        const w = max_x - min_x;
        const h = max_y - min_y;
        return new Rectangle(new Point(lt.x + w * 0.5, lt.y + h * 0.5), w, h);
    }

    /**
     * 求一组Rectangle构成的包围框矩形
     * @param rects 一组矩形
     */
    public static union(rects: Rectangle[]) {
        if (rects.length < 1) {
            throw new Error("Rectangle的个数不能小于1");
        }

        const points: Point[] = [];

        for (let i = 0; i < rects.length; i++) {
            points.push(rects[i].lt, rects[i].ld, rects[i].rt, rects[i].rd);
        }

        return Rectangle.bound(points);
    }
    /**
     * 判断两个矩形是否相交
     */
    public static intersection(rect1: Rectangle, rect2: Rectangle) {
        if (rect1.height === 0 || rect1.width === 0 || rect2.height === 0 || rect1.width ===0) {
            // 非矩形的情况
            return false;
        }
        const isLtInRect = GraphicsAssist.isPointInRectangle(rect1.lt, rect2);
        const isLdInRect = GraphicsAssist.isPointInRectangle(rect1.ld, rect2);
        const isRdInRect = GraphicsAssist.isPointInRectangle(rect1.rd, rect2);
        const isRtInRect = GraphicsAssist.isPointInRectangle(rect1.rt, rect2);

        const isLtInRect2 = GraphicsAssist.isPointInRectangle(rect2.lt, rect1);
        const isLdInRect2 = GraphicsAssist.isPointInRectangle(rect2.ld, rect1);
        const isRdInRect2 = GraphicsAssist.isPointInRectangle(rect2.rd, rect1);
        const isRtInRect2 = GraphicsAssist.isPointInRectangle(rect2.rt, rect1);
        return isLtInRect || isLdInRect || isRdInRect || isRtInRect || isLtInRect2 || isLdInRect2 || isRdInRect2 || isRtInRect2;
    };
}

export namespace GraphicsAssist {
    /**
     * 求两个点的中点
     */
    export const mid = (point1: Point, point2: Point) => {
        return new Point(0.5 * (point1.x + point2.x), 0.5 * (point1.y + point2.y));
    };

    /**
     * 判断点是否处于一个矩形中
     */
    export const isPointInRectangle = (point: Point, rect: Rectangle) => {
        const vectLtp = rect.lt.getVectorTo(point);
        const vectRtp = rect.rt.getVectorTo(point);
        const vectLdp = rect.ld.getVectorTo(point);
        const vectRdp = rect.rd.getVectorTo(point);

        const vectLtp_normal = vectLtp.normalize();
        const vectRtp_normal = vectRtp.normalize();
        const vectLdp_normal = vectLdp.normalize();
        const vectRdp_normal = vectRdp.normalize();

        // 1.判断point是否处于rect的边界上
        // 上边界
        if (vectLtp_normal.x === -vectRtp_normal.x && vectLtp_normal.y === -vectRtp_normal.y) {
            return true;
        }
        // 左边界
        if (vectLtp_normal.x === -vectLdp_normal.x && vectLtp_normal.y === -vectLdp_normal.y) {
            return true;
        }
        // 下边界
        if (vectLdp_normal.x === -vectRdp_normal.x && vectLdp_normal.y === -vectRdp_normal.y) {
            return true;
        }
        // 右边界
        if (vectRtp_normal.x === -vectRdp_normal.x && vectRtp_normal.y === -vectRdp_normal.y) {
            return true;
        }

        // 2.判断point是否处于rect的内部，通过求面积法。如果点位于矩形内部，那么由点和矩形四个点构成的四个三角形总面积必定等于矩形的面积
        const area1 = Vector.multiProduct_Len(vectLtp, vectLdp) * 0.5;
        const area2 = Vector.multiProduct_Len(vectLdp, vectRdp) * 0.5;
        const area3 = Vector.multiProduct_Len(vectRdp, vectRtp) * 0.5;
        const area4 = Vector.multiProduct_Len(vectLtp, vectRtp) * 0.5;
        const areaRect = rect.height * rect.width;

        // 精度控制在0.1
        if (Math.abs(area1 + area2 + area3 + area4 - areaRect) < 0.1) {
            return true;
        }
        return false;
    }

    /**
     * 笛卡尔坐标转极坐标
     */
    export const cartesianToPolar = (point: Point): PolarCoord => {
        const length = Math.sqrt(point.x * point.x + point.y * point.y);
        const angle = Math.atan2(point.y, point.x);
        return {length, angle};
    }

    /**
     * 极坐标转笛卡尔
     */
    export const polarToCartesian = (point: PolarCoord): Point => {
        const x = Math.cos(point.angle) * point.length;
        const y = Math.sin(point.angle) * point.length;

        return new Point(x, y);
    }

    /**
     * 将一个点，绕着另一个点旋转一定的角度
     * @param origin 旋转中心
     * @param point 旋转点
     * @param anticlockwiseAngle 旋转角度
     */
    export const rotatePoint = (origin: Point, point: Point, anticlockwiseAngle: number) => {
        const p1 = new Point(point.x - origin.x, point.y - origin.y);
        
        const p1_polar = cartesianToPolar(p1);
        const p1_polar_rotate: PolarCoord = {
            length: p1_polar.length,
            angle: p1_polar.angle - anticlockwiseAngle // 因为屏幕坐标系Y轴向上，所以这里用减法
        };

        const p1_rotate = polarToCartesian(p1_polar_rotate);

        return new Point(p1_rotate.x + origin.x, p1_rotate.y + origin.y);
    }
}
