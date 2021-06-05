export interface SimpleOptions {
  mapEndpoint: string;
}

export enum DataPointType {
  Circle = 'circle',
}

export interface DataPoint {
  id: number;
  type: DataPointType;
  data: CircleDataPoint;
}

export interface CircleDataPoint {
  lat: number;
  lng: number;
  options?: {
    radius?: number;
    stroke?: boolean;
    color?: string;
    weight?: number;
    opacity?: number;
    dashArray?: string | number[];
    dashOffset?: string;
    fill?: boolean;
    fillColor?: string;
    fillOpacity?: number;
  };
}
