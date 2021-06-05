import { PanelPlugin } from '@grafana/data';
import { SimpleOptions } from './types';
import { SimplePanel } from './SimplePanel';

import 'leaflet/dist/leaflet.css';

export const plugin = new PanelPlugin<SimpleOptions>(SimplePanel).setPanelOptions(builder => {
  return builder.addTextInput({
    path: 'mapEndpoint',
    name: 'Endpoint for Map',
    description:
      'This endpoint gets called on data collection and will be responsible for map layout and datapoint displayment.',
    defaultValue: '/api/datasources/proxy/[dataSourceId]/[pathToAPI]',
  });
  // .addBooleanSwitch({
  //   path: 'showSeriesCount',
  //   name: 'Show series counter',
  //   defaultValue: false,
  // })
  // .addRadio({
  //   path: 'seriesCountSize',
  //   defaultValue: 'sm',
  //   name: 'Series counter size',
  //   settings: {
  //     options: [
  //       {
  //         value: 'sm',
  //         label: 'Small',
  //       },
  //       {
  //         value: 'md',
  //         label: 'Medium',
  //       },
  //       {
  //         value: 'lg',
  //         label: 'Large',
  //       },
  //     ],
  //   },
  //   showIf: config => config.showSeriesCount,
  // });
});
