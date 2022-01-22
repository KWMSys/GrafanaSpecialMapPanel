import { PanelPlugin } from '@grafana/data';
import { SimpleOptions } from './types';
import { SimplePanel } from './SimplePanel';

import 'leaflet/dist/leaflet.css';
import { QueryParamEditor } from 'QueryParamEditor';

export const plugin = new PanelPlugin<SimpleOptions>(SimplePanel).setPanelOptions(builder => {
  return builder
    .addSelect({
      category: ['Endpoint'],
      name: 'Request method',
      path: 'mapEndpointMethod',
      settings: {
        options: [
          { value: 'GET', label: 'GET' },
          { value: 'PUT', label: 'PUT' },
          { value: 'POST', label: 'POST' },
        ],
      },
    })
    .addTextInput({
      category: ['Endpoint'],
      path: 'mapEndpoint',
      name: 'Endpoint for Map',
      description:
        'This endpoint gets called on data collection and will be responsible for map layout and datapoint displayment. Values for [from, to, firstRequest] will be applied to the end of the URL as QueryParams. The time will be a unix timestamp in seconds.',
      defaultValue: '/api/datasources/proxy/[dataSourceId]/[pathToAPI]',
    })
    .addCustomEditor({
      category: ['Endpoint'],
      id: 'queryParams',
      path: 'queryParams',
      name: 'Query Parameters',
      editor: QueryParamEditor
    });
});
