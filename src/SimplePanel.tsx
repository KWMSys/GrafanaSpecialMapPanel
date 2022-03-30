import React from 'react';
import { PanelProps } from '@grafana/data';
import { SimpleOptions, DataPoint, DataPointType } from 'types';
import { css } from 'emotion';
// import { stylesFactory, useTheme } from '@grafana/ui';
import * as Leaf from 'leaflet';

interface Props extends PanelProps<SimpleOptions> {}

const errorStatusColor = '#ff0000b8';
const defaultStatusColor = '#141619b8';

export class SimplePanel extends React.Component<Props> {
  private mapId: string;
  private map: Leaf.Map | undefined;
  private time: { from?: number; to?: number } = {};
  private layers: Leaf.Layer[] = [];
  private status?: { color: string; msg: string } | null = null;

  private isForcedReload = false;

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
    // TODO: improve check for query params
    let endpointQueryString =
      (endpoint.includes('?') ? '&' : '?') + `from=${from}&to=${to}&firstRequest=${firstRequest ? 'true' : 'false'}`;

    if (this.props.options.queryParams != null) {
      const qp = this.props.options.queryParams;
      Object.keys(qp).map(x => {
        const paramString = this.props.replaceVariables(qp[x], undefined, 'json');

        let pValues: string[] =
          paramString.startsWith('[') && paramString.endsWith(']') ? JSON.parse(paramString) : [paramString];
        if (pValues.length > 0) {
          endpointQueryString += '&' + pValues.map(y => `${x}=${encodeURI(y)}`).join('&');
        }
      });
    }
    const headers = new Headers();
    if (body != null) {
      headers.append('Content-Type', 'application/json');
    }

    this.status = {
      color: defaultStatusColor,
      msg: 'Loading...',
    };
    this.triggerUpdate();
    fetch(endpoint + endpointQueryString, { method, body, headers })
      .then(data => {
        if (data.ok) {
          return data.json();
        }
        this.status = {
          color: errorStatusColor,
          msg: 'Fetching failed (a page reload may be required)',
        };
        console.error('Fetching failed', data);
        this.triggerUpdate();
        return Promise.reject(null);
      })
      .then(data => {
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
              case DataPointType.CircleMarker:
                pointLayer = Leaf.circleMarker({ lat: point.data.lat, lng: point.data.lng }, point.data?.options);
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

        this.status = null;
        this.triggerUpdate();
      })
      .catch(e => {
        if (e == null) {
          return;
        }
        console.error('Fetching failed', e);
        this.status = {
          color: errorStatusColor,
          msg: "Can't fetch data! Please check connection and try reloading the page.",
        };
        this.triggerUpdate();
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
      url: 'https://{s}.tile.cdn.kwmsys.de/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: 'abcd',
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

  private triggerUpdate() {
    this.isForcedReload = true;
    this.forceUpdate();
  }

  componentDidMount() {
    console.log('MOUNT EVENT');
    if (this.map == null) {
      this.initializeMap();
    }
    this.setMapFromMapData();
  }

  componentDidUpdate() {
    if (this.isForcedReload) {
      this.isForcedReload = false;
      return;
    }
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
        className={css`
          widht: 100%;
          height: 100%;
          position: relative;
        `}
      >
        <div
          id={this.mapId}
          className={css`
            widht: 100%;
            height: 100%;
          `}
        ></div>
        {this.status != null && (
          <div
            className={css`
              position: absolute;
              right: 0;
              top: 0;
              background-color: ${this.status.color};
              padding: 0.25rem 1rem;
              color: #eee;
              z-index: 999;
            `}
          >
            {this.status.msg}
          </div>
        )}
      </div>
    );
  }
}
