import { stripMilliseconds } from '../utils';

export const throwIfInvalidTimeFormat = (value) => {
    const schemaTimeFormat = /^\d{2}:\d{2}:\d{2}(Z?|(\+|-)\d{2}:\d{2})$/;

    if (!schemaTimeFormat.test(value)) {
        throw new Error(`Time in hh:mm:ss[Z|(+|-)hh:mm] format expected. ${value} passed.`);
    }
};

export const timeDataTypeSourceCode = (value) => {
    let time;

    if (typeof value === 'string') {
        throwIfInvalidTimeFormat(value);

        time = value;
    } else if (value instanceof Date) {
        time = stripMilliseconds(value.toISOString().split('T')[1]);
    } else {
        throw new Error(`String or Date instance value expected. '${typeof value}' (${value}) passed.`);
    }

    return {
        _schemaName: 'Time',
        _dataType: true,
        _content: ` content="${time}"`
    };
};
