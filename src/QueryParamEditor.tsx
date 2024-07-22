import { StandardEditorProps } from '@grafana/data';
import React from 'react';
import { Field, HorizontalGroup, IconButton, Input, Label } from '@grafana/ui';

let addKeyValue = '';
export const QueryParamEditor: React.FC<StandardEditorProps<{ [key: string]: string }>> = ({ value, onChange }) => {
  if (value == null) {
    value = {};
  }

  const addValue = () => {
    if (value[addKeyValue] != null || addKeyValue.trim() === '') {
      return;
    }
    value[addKeyValue] = '';
    addKeyValue = '';
    onChange(value);
  };

  const removeValue = (key: string) => {
    delete value[key];
    onChange(value);
  };

  const changeValue = (key: string, val: string) => {
    value[key] = val;
    onChange(value);
  };

  return (
    <div>
      {Object.keys(value).map(key => (
        <HorizontalGroup key={key}>
          <Label description="">{key}</Label>
          <Input
            name="paramValue"
            value={value[key]}
            onChange={e => changeValue(key, (addKeyValue = e.currentTarget.value))}
            required
          />
          <IconButton aria-label="" name={'trash-alt'} onClick={() => removeValue(key)}></IconButton>
        </HorizontalGroup>
      ))}
      <HorizontalGroup>
        <Field label="Param Key">
          <Input name="paramKey" onChange={e => (addKeyValue = e.currentTarget.value)} required />
        </Field>
        <IconButton aria-label="" name={'plus-circle'} onClick={addValue}></IconButton>
      </HorizontalGroup>
    </div>
  );
};
