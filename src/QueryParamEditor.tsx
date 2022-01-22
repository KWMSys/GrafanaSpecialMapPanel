import { StandardEditorProps } from "@grafana/data";
import React from "react";
import { Button, Field, HorizontalGroup, IconButton, InlineField, InlineLabel, Input, Label } from '@grafana/ui';


let addKeyValue = '';
export const QueryParamEditor: React.FC<StandardEditorProps<{[key: string]: string}>> = ({ value, onChange, context, item, children }) => {
    // return <Button onClick={() => onChange(!value)}>{value ? 'Disable' : 'Enable'}</Button>;
    
    if (value == null) {
        value = {};
    }

    const addValue = () => {
        if (value[addKeyValue] != null || addKeyValue.trim() == '') {
            return;
        }
        value[addKeyValue] = '';
        addKeyValue = '';
        onChange(value);
    }

    const removeValue = (key: string) => {
        delete value[key];
        onChange(value);
    }

    const changeValue = (key: string, val: string) => {
        value[key] = val;
        onChange(value);
    }

    

    return <div>
        {Object.keys(value).map(key => 
        <HorizontalGroup>
            
            <Label description="">
                {key}
            </Label>
            <Input name="paramValue" value={value[key]} onChange={e => changeValue(key, addKeyValue = e.currentTarget.value)} required css={undefined} />
            <IconButton name={"trash-alt"} onClick={() => removeValue(key)}></IconButton>
        </HorizontalGroup>
        )}
        <HorizontalGroup>
            <Field label="Param Key">
                <Input name="paramKey" onChange={e => addKeyValue = e.currentTarget.value} required css={undefined} />
            </Field>
            <IconButton name={"plus-circle"} onClick={addValue}></IconButton>
        </HorizontalGroup>
    </div>;
  };