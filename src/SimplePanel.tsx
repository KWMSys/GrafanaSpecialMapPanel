import React from 'react';
import { PanelProps } from '@grafana/data';
import { SimpleOptions } from 'types';
import { css } from 'emotion';
// import { stylesFactory, useTheme } from '@grafana/ui';
import * as Leaf from 'leaflet';

interface Props extends PanelProps<SimpleOptions> {}

export class SimplePanel extends React.Component<Props> {
  private mapId: string;

  constructor(props: Readonly<Props> | Props) {
    super(props);

    const id = props.id;
    this.mapId = `special-map-${id}`;
  }

  componentDidMount() {
    const map = Leaf.map(this.mapId, {
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
    }).addTo(map);
  }

  render() {
    const id = this.props.id;
    this.mapId = `special-map-${id}`;

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
