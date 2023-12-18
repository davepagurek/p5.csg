import type P5 from "p5";
import CSG from "csg";

type CSGInput = (() => void) | P5.Geometry;
type CSGWrapperInput = CSGWrapper | CSGInput;

declare module "P5" {
  interface p5InstanceExtensions {
    P5(): P5;
    csg(input: CSGInput): CSGWrapper;
    buildGeometry(cb: () => void): P5.Geometry;
    Geometry: { new (...args: any[]): P5.Geometry };
  }

  interface Geometry {
    faces: Array<[number, number, number]>;
    vertices: Array<P5.Vector>;
    vertexNormals: Array<P5.Vector>;
  }
}

function geometryToCSG(geom: P5.Geometry) {
  return CSG.fromPolygons(
    geom.faces.map(
      (indices) =>
        new CSG.Polygon(
          indices.map(
            (i) =>
              new CSG.Vertex(
                new CSG.Vector(geom.vertices[i].array()),
                geom.vertexNormals[i]
                  ? new CSG.Vector(geom.vertexNormals[i].array())
                  : undefined,
              ),
          ),
        ),
    ),
  );
}

function csgToGeometry(p5: P5 | P5.p5InstanceExtensions, csg): P5.Geometry {
  return p5.buildGeometry(() => {
    const polygons = csg.toPolygons();
    for (const polygon of polygons) {
      p5.beginShape();
      for (const vert of polygon.vertices) {
        p5.normal(vert.normal.x, vert.normal.y, vert.normal.z);
        p5.vertex(vert.pos.x, vert.pos.y, vert.pos.z);
      }
      p5.endShape();
    }
  });
}

class CSGWrapper {
  csg: any;
  p5: P5 | P5.p5InstanceExtensions;

  constructor(p5: P5 | P5.p5InstanceExtensions, input: CSGInput) {
    this.p5 = p5;
    this.csg = this.inputToCSG(input);
  }

  private inputToGeom(input: CSGInput): P5.Geometry {
    if (input instanceof (this.p5.constructor as any as P5).Geometry) {
      return input as P5.Geometry;
    } else {
      return this.p5.buildGeometry(input);
    }
  }

  private inputToCSG(input: CSGInput): any {
    if (input instanceof CSG) {
      return input;
    } else {
      return geometryToCSG(this.inputToGeom(input));
    }
  }

  private inputToCSGWrapper(input: CSGWrapperInput) {
    if (input instanceof CSGWrapper) {
      return input;
    } else {
      return new CSGWrapper(this.p5, this.inputToGeom(input));
    }
  }

  union(other: CSGWrapperInput) {
    return new CSGWrapper(
      this.p5,
      this.csg.union(this.inputToCSGWrapper(other).csg),
    );
  }

  subtract(other: CSGWrapperInput) {
    return new CSGWrapper(
      this.p5,
      this.csg.subtract(this.inputToCSGWrapper(other).csg),
    );
  }

  intersect(other: CSGWrapperInput) {
    return new CSGWrapper(
      this.p5,
      this.csg.intersect(this.inputToCSGWrapper(other).csg),
    );
  }

  invert() {
    return new CSGWrapper(this.p5, this.csg.invert());
  }

  done() {
    return csgToGeometry(this.p5, this.csg);
  }
}

function csg(p5: P5.p5InstanceExtensions, input: CSGInput) {
  return new CSGWrapper(p5, input);
}

export const setupCSG = (p5: P5) => {
  // @ts-ignore
  p5.prototype.csg = function (input: CSGInput) {
    return csg(this, input);
  };
};
// @ts-ignore
if (window.p5) setupCSG(window.p5);
