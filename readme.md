# miracle-canvas
You can add movable、resizable、zoomable、rotatable object(text、shape and image, etc) on html canvas with this library.

![](https://cdn.jsdelivr.net/gh/pengfeiw/personal-image-cdn@1.0.0/image/miracle-canvas.gif)

blog: [https://pengfeixc.com/blog/607c137a6d87a10eb2594fad](http://pengfeixc.com/blog/607c137a6d87a10eb2594fad)

github code: [https://github.com/pengfeiw/miracle-canvas](https://github.com/pengfeiw/miracle-canvas)

github demo: [https://github.com/pengfeiw/miracle-canvas-demo](https://github.com/pengfeiw/miracle-canvas-demo) 

### install
You can install the library with npm:
```bash
npm install miracle-canvas
```
with yarn:
```bash
yarn add mriacle-canvas
```
with cdn:
```js
// you can change the version number in src, below is version 1.0.6
<script src="https://cdn.jsdelivr.net/gh/pengfeiw/miracle-canvas@1.0.6/src/bundle.js"></script>
```

### how to use
1. First set canvas with miracle:

```javascript
import {Miracle} from "miracle-canvas";

const miracle = new Miracle(canvas);
```

2. Add some entity(shape、image etc):

```javascript
import {MiracleEntity, MiracleGraphic, MiracleControl} from "./miracle/index";

const {Circle, PolyShape, Image} = MiracleEntity;
const {ImageControl} = MiracleControl;
const {Point} = MiracleGraphic;

// create a rectangle
const rect = new PolyShape([
    new Point(150, 30),
    new Point(200, 30),
    new Point(200, 120),
    new Point(150, 120)
], false);
rect.filled = false;  // set filled false
rect.closed = true;

// create a circle
const circle = new Circle(new Point(400, 400), 50);
circle.strokeStyle = "green";

// create a triangle
const triangle = new PolyShape([
    new Point(100, 100),
    new Point(150, 150),
    new Point(100, 200)
]);
triangle.filled = true; // set filled true
triangle.closed = true;
triangle.fillStyle = "gray";

// create image with specific size
const img = new Image(new Point(200, 300), "/image.png", {
    height: 150,
    width: 180
});

// add the above entities
miracle.addEntity(circle, rect, triangle, img);
```

3. You can also set the visible of entity and the control point.

```javascript
// set the visible of entity
triangle.visible = false;

// set visible of operate control 
miracle.xLocked = false;
miracle.yLocked = false;
miracle.diagLocked = false;
miracle.rotateLocked = false;
```

4. Add custom control, only support `ImageControl` now.

```typescript
import {MiracleControl} from "./miracle/index";

const {ImageControl} = MiracleControl;

// create the button
const btn = new ImageControl("/clear.png", {width: 30, height: 30}, ControlBase.lt, -15, -30);
btn.mouseUpHandler = () => {
    window.alert("you click the button.");
};

// add the button to Entity
rect.addControl(btn);
```

5. if used with cdn. You access the class moudule under the `GlobalMiracle`:

```typescript
GlobalMiracle.Miracle;
GlobalMiracle.MiracleEntity;
GlobalMiracle.MiracleGraphic;
GlobalMiracle.MiracleControl;
```

### codepen

<iframe height="400" style="width: 100%;" scrolling="no" title="miracle-canvas" src="https://codepen.io/AhCola/embed/qBRgEQb?height=160&theme-id=light&default-tab=js" frameborder="no" loading="lazy" allowtransparency="true" allowfullscreen="true">
    See the Pen <a href='https://codepen.io/AhCola/pen/qBRgEQb'>miracle-canvas</a> by Pengfei Wang
    (<a href='https://codepen.io/AhCola'>@AhCola</a>) on <a href='https://codepen.io'>CodePen</a>.
</iframe>
