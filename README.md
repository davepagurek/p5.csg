# p5.csg

This is a library for doing <a href="https://en.wikipedia.org/wiki/Constructive_solid_geometry">constructive solid geometry (CSG)</a> in p5.js. It is powered under the hood by <a href="https://github.com/evanw/csg.js/">csg.js</a> by Evan Wallace, augmented to accept and return <a href="https://p5js.org/reference/#/p5.Geometry">p5.Geometry.</a>

## Usage

### Adding the library

Add the library in a script tag:

```html
<script src="https://cdn.jsdelivr.net/npm/@davepagurek/p5.csg@0.0.3"></script>
```

Or on OpenProcessing, add the CDN link as a library:

```
https://cdn.jsdelivr.net/npm/@davepagurek/p5.csg@0.0.3
```

If you're using p5 without importing it globally, you can manually set up p5.csg:

```js
import P5 from 'p5'
import { setupCSG } from '@davepagurek/p5.csg'
setupCSG(P5)
```

### Example

<table>
<tr>
<td>

```js
let deathStar

function setup() {
  createCanvas(400, 400, WEBGL)

  deathStar = csg(() => sphere(50))
    .subtract(() => {
      translate(40, -40)
      sphere(25)
    })
    .union(() => sphere(40))
    .done()
}

function draw() {
  clear()
  orbitControl()
  noStroke()
  lights()
  model(deathStar)
}
```

</td>
<td>

<img width="296" alt="image" src="https://github.com/davepagurek/p5.csg/assets/5315059/a18828d9-e670-4194-a449-f6bed0c883c2">
  
</td>
</tr>
</table>

Live: https://editor.p5js.org/davepagurek/sketches/f5QmdBoVI

### Reference

Create a new CSG wrapper object with the `csg` function. It takes one of the following two inputs:

```ts
// Pass in an existing p5.Geometry
csg(geometry: p5.Geometry): CSGWrapper

// Pass in an input to `buildGeometry()`, which we will automatically
// convert into a new p5.Geometry under the hood
csg(buildGeometryCallback: Function): CSGWrapper
```

Once a CSG wrapper object has been created, you can apply a Boolean operation to create a new CSG object, or call `done()` on it to get a `p5.Geometry` you can draw:

```ts
// Take the boundary of both shapes
myCSG.union(other: CSGInput, options?: BooleanOptions): CSGWrapper

// Take a bite out of the current geometry, in the shape of the other
myCSG.subtract(other: CSGInput, options?: BooleanOptions): CSGWrapper

// Take just the region that overlaps between two shapes
myCSG.intersect(other: CSGInput, options?: BooleanOptions): CSGWrapper

// Flip the inside and outside of the current shape
myCSG.invert(): CSGWrapper

myCSG.done(): p5.Geometry

// Inputs to CSG methods can be either another CSG wrapper object,
// a p5.Geometry, or a `buildGeometry` callback function.
type CSGInput = CSGWrapper | p5.Geometry | Function

// Optionally specify whether or not to include faces from one input
// or another in the end result. By default, both are included, so
// if you subtract one shape from another, you will still get a closed
// shape as a result. If you do not include the other shape's faces,
// the subtraction will leave a hole.
type BooleanOptions = {
  includeSelfFaces?: boolean;
  includeOtherFaces?: boolean;
}
```
