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
    fetch(this.props.options.mapEndpoint + `?from=${from}&to=${to}`)
      .then(data => data.json())
      .then(data => {
        console.log('API data', data);

        // Set time of fetch
        this.time.to = to;
        this.time.from = from;

        // Set layout
        const layout = data?.layout;
        if (layout != null) {
          this.map?.setZoom(layout?.zoom);
          this.map?.setView(layout?.center);
        }

        // Clear map
        this.layers.forEach(x => this.map?.removeLayer(x));

        // Set data
        const points = data?.data as DataPoint[];
        if (points != null && this.map != null) {
          for (let point of points) {
            const pointType = point.type;
            // TODO: Keep already created map things and only change them
            // Create a new point
            switch (pointType) {
              case DataPointType.Circle:
                this.layers.push(
                  Leaf.circle({ lat: point.data.lat, lng: point.data.lng }, point.data?.options).addTo(this.map)
                );
                break;
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
