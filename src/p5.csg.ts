import type P5 from "p5";
import CSG from "csg";

type CSGInput = (() => void) | P5.Geometry;
type CSGWrapperInput = CSGWrapper | CSGInput;
type BooleanOptions = {
  includeSelfFaces?: boolean;
  includeOtherFaces?: boolean;
};

declare module "P5" {
  interface p5InstanceExtensions {
    P5(): P5;
    csg(input: CSGInput): CSGWrapper;
    buildGeometry(cb: () => void): P5.Geometry;
    Geometry: { new (...args: any[]): P5.Geometry };
  }

  interface Geometry {
    gid: string;
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
          { id: geom.gid },
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

  private ids(): Set<string> {
    const ids = new Set<string>();
    const polygons = this.csg.toPolygons();
    for (const polygon of polygons) {
      if (polygon.shared?.id !== undefined) {
        ids.add(polygon.shared.id);
      }
    }
    return ids;
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

  private applyBooleanOptions(
    csg,
    other: CSGWrapper,
    { includeSelfFaces = true, includeOtherFaces = true }: BooleanOptions,
  ) {
    if (includeSelfFaces && includeOtherFaces) return csg;

    const selfIDs = includeSelfFaces ? new Set<string>() : this.ids();
    const otherIDs = includeOtherFaces ? new Set<string>() : other.ids();
    return CSG.fromPolygons(
      csg.toPolygons().filter((polygon: CSG.Polygon) => {
        if (!includeSelfFaces && selfIDs.has(polygon.shared?.id)) {
          return false;
        }
        if (!includeOtherFaces && otherIDs.has(polygon.shared?.id)) {
          return false;
        }
        return true;
      }),
    );
  }

  union(other: CSGWrapperInput, options: BooleanOptions = {}) {
    const otherCSG = this.inputToCSGWrapper(other);
    return new CSGWrapper(
      this.p5,
      this.applyBooleanOptions(this.csg.union(otherCSG.csg), otherCSG, options),
    );
  }

  subtract(other: CSGWrapperInput, options: BooleanOptions = {}) {
    const otherCSG = this.inputToCSGWrapper(other);
    return new CSGWrapper(
      this.p5,
      this.applyBooleanOptions(
        this.csg.subtract(otherCSG.csg),
        otherCSG,
        options,
      ),
    );
  }

  intersect(other: CSGWrapperInput, options: BooleanOptions = {}) {
    const otherCSG = this.inputToCSGWrapper(other);
    return new CSGWrapper(
      this.p5,
      this.applyBooleanOptions(
        this.csg.intersect(otherCSG.csg),
        otherCSG,
        options,
      ),
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
