import React from 'react';
import { PanelProps } from '@grafana/data';
import { SimpleOptions, DataPoint, DataPointType } from 'types';
import { css } from 'emotion';
// import { stylesFactory, useTheme } from '@grafana/ui';
import * as Leaf from 'leaflet';

interface Props extends PanelProps<SimpleOptions> {}

export class SimplePanel extends React.Component<Props> {
  private mapId: string;
  private map: Leaf.Map | undefined;
  private time: { from?: number; to?: number } = {};
  private layers: Leaf.Layer[] = [];

  private previousLayout: any = null;

  constructor(props: Readonly<Props> | Props) {
    super(props);

    const id = props.id;
    this.mapId = `special-map-${id}`;
  }

  private setMapFromMapData() {
    // No endpoint or same data? Then exit
    if (this.props.options.mapEndpoint == null || !this.hasTimeRangeChanged()) {
      return;
    }
    const from = this.props.timeRange.from.unix();
    const to = this.props.timeRange.to.unix();
    // Fetch data

    let endpoint = this.props.options.mapEndpoint;
    endpoint = this.props.replaceVariables(endpoint);
    const method = this.props.options.mapEndpointMethod ?? 'GET';
    const body = ['POST', 'PUT'].includes(method)
      ? JSON.stringify({
          panelId: this.props.id,
          options: this.props.options,
          transparent: this.props.transparent,
          title: this.props.title,
          timeRange: this.props.timeRange,
          timeZone: this.props.timeZone,
          width: this.props.width,
          height: this.props.height,
          renderCount: this.props.renderCounter,
        })
      : null;

    const firstRequest = this.previousLayout == null;
    const endpointQueryString = `?from=${from}&to=${to}&firstRequest=${firstRequest ? 'true' : 'false'}`;
    const headers = new Headers();
    if (body != null) {
      headers.append('Content-Type', 'application/json');
    }

    fetch(endpoint + endpointQueryString, { method, body, headers })
      .then(data => data.json())
      .then(data => {
        console.log('API data', data);

        // Set time of fetch
        this.time.to = to;
        this.time.from = from;

        // Set layout
        const layout = data?.layout;
        if (layout != null) {
          const layoutKeys = Object.keys(layout).filter(x => layout.hasOwnProperty(x));
          for (const layoutKey of layoutKeys) {
            const layoutValue = layout[layoutKey];
            switch (layoutKey) {
              case 'zoom':
                this.map?.setZoom(layoutValue);
                break;
              case 'center':
                console.log(layoutValue);
                this.map?.setView(layoutValue, layout.zoom ?? null);
                break;
              case 'area':
                this.map?.fitBounds(
                  new Leaf.LatLngBounds(layoutValue.sw, layoutValue.ne),
                  layoutValue?.options ?? null
                );
                break;
            }
          }

          // Set previous layout for later use (maybe)
          if (this.previousLayout == null) {
            this.previousLayout = layout;
          }
        }

        // Clear map
        this.layers.forEach(x => this.map?.removeLayer(x));

        // Set data
        const points = data?.data as DataPoint[];
        if (points != null && this.map != null) {
          for (let point of points) {
            // const pointType = point.type;
            let pointLayer: Leaf.Layer | null = null;

            // TODO: Keep already created map things and only change them
            // Create a new point
            switch (point.data.type) {
              case DataPointType.Circle:
                pointLayer = Leaf.circle({ lat: point.data.lat, lng: point.data.lng }, point.data?.options);
                break;
              case DataPointType.Polygon:
                pointLayer = Leaf.polygon(
                  point.data.points.map(x => [x.lat, x.lng]),
                  point.data?.options
                );
                break;
              case DataPointType.Polyline:
                pointLayer = Leaf.polyline(
                  point.data.points.map(x => [x.lat, x.lng]),
                  point.data?.options
                );
                break;
              case DataPointType.Marker:
                const markerOptions: Leaf.MarkerOptions = {
                  ...point?.data?.options,
                  icon: point.data.options?.icon != null ? Leaf.icon(point.data.options.icon) : undefined,
                };
                pointLayer = Leaf.marker({ lat: point.data.lat, lng: point.data.lng }, markerOptions);
                break;
            }

            if (pointLayer != null) {
              // Add tooltip if available
              if (point.tooltip != null) {
                const pointTooltip = point.tooltip;
                pointLayer.bindTooltip(pointTooltip.content, pointTooltip?.options);
              }
              // Add popup if available
              if (point.popup != null) {
                const pointPopup = point.popup;
                pointLayer.bindPopup(pointPopup.content, pointPopup?.options);
              }

              pointLayer.addTo(this.map);
              this.layers.push(pointLayer);
            }
          }
        }
      });
  }

  private initializeMap() {
    this.map = Leaf.map(this.mapId, {
      worldCopyJump: true,
      preferCanvas: true,
      zoom: 1,
      center: { lat: 49, lng: 8 },
    });

    const tileDetails = {
      url: 'https://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: 'abc',
    };

    Leaf.tileLayer(tileDetails.url, {
      maxZoom: 18,
      subdomains: tileDetails.subdomains,
      detectRetina: true,
      attribution: tileDetails.attribution,
    }).addTo(this.map);
  }

  private hasTimeRangeChanged() {
    const from = this.props.timeRange.from.unix();
    const to = this.props.timeRange.to.unix();
    if (this.time.from != null && this.time.to != null && this.time.from === from && this.time.to === to) {
      return false;
    }
    return true;
  }

  componentDidMount() {
    console.log('MOUNT EVENT');
    if (this.map == null) {
      this.initializeMap();
    }
    this.setMapFromMapData();
  }

  componentDidUpdate() {
    console.log('UPDATE EVENT');
    // Fix size of map
    this.map?.invalidateSize();
    // Update displayed data on change
    this.setMapFromMapData();
  }

  render() {
    console.log('RENDER EVENT');
    return (
      <div
        id={this.mapId}
        className={css`
          widht: 100%;
          height: 100%;
        `}
      ></div>
    );
  }
}
