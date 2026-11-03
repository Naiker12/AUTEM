import "leaflet";

declare module "leaflet-rotate";

declare module "leaflet" {
  interface MapOptions {
    rotate?: boolean;
    bearing?: number;
    rotateControl?: boolean | Record<string, unknown>;
    touchRotate?: boolean;
    shiftKeyRotate?: boolean;
    pitchDrag?: boolean;
    compassBearing?: boolean;
  }
  interface Map {
    setBearing(degrees: number, options?: { animate?: boolean; duration?: number }): this;
    getBearing(): number;
  }
  interface MarkerOptions {
    rotation?: number;
    rotateWithView?: boolean;
  }
  interface Marker {
    setRotation?(radians: number): this;
  }
}
