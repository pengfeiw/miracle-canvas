# miracle-canvas
You can add moveable、resizeable、zoomable、rotateable object(text、shape and iamge etc) on html canvas with this library.

![](https://cdn.jsdelivr.net/gh/pengfeiw/personal-image-cdn@1.0.0/image/1.gif)

### install
You can install the library with npm:
```bash
npm install miracle-canvas
```
with yarn:
```bash
yarn add mriacle-canvas
```

### how to use
First set canvas with miracle:
```javascript
import Miracle from "miracle-canvas";

const miracle = new Miracle(canvas);
```

Add some entity(shape、image etc):
```javascript
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

You can also set the visible of entity and the control point.
```javascript
// set the visible of entity
triangle.visible = false;

// set visible of operate control 
miracle.xLocked = false;
miracle.yLocked = false;
miracle.diagLocked = false;
miracle.rotateLocked = false;
```
