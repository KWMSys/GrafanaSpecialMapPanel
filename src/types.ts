import * as Leaf from 'leaflet';

export interface SimpleOptions {
  mapEndpoint: string;
}

export enum DataPointType {
  Circle = 'circle',
  Marker = 'marker',
  Polygon = 'polygon',
  Polyline = 'polyline',
}

export interface DataPoint {
  id: number;
  tooltip?: TooltipDataPointExtension;
  popup?: PopupDataPointExtension;
  data: CircleDataPoint | MarkerDataPoint | PolygonDataPoint | PolylineDataPoint;
}

//#region DataPoint Types

export interface CircleDataPoint {
  type: DataPointType.Circle;
  lat: number;
  lng: number;
  options?: Leaf.CircleMarkerOptions;
}

export interface PolygonDataPoint {
  type: DataPointType.Polygon;
  points: Array<{
    lat: number;
    lng: number;
  }>;
  options?: Leaf.PolylineOptions;
}

export interface PolylineDataPoint {
  type: DataPointType.Polyline;
  points: Array<{
    lat: number;
    lng: number;
  }>;
  options?: Leaf.PolylineOptions;
}

export interface MarkerDataPoint {
  type: DataPointType.Marker;
  lat: number;
  lng: number;
  options?: Leaf.MarkerOptions & {
    icon?: Leaf.IconOptions;
  };
}

//#endregion

//#region DataPoint extensions

export interface TooltipDataPointExtension {
  content: string;
  options?: Leaf.TooltipOptions;
}

export interface PopupDataPointExtension {
  content: string;
  options?: Leaf.PopupOptions;
}

//#endregion
