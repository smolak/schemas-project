import { stripUprightDashIfPresent, stripMilliseconds } from '../utils';

export const throwIfInvalidDateTimeFormat = (value) => {
    const schemaISO8601Format = /^(-?)\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z?|(\+|-)\d{2}:\d{2})$/;
    const matches = schemaISO8601Format.test(value);

    if (matches) {
        const sanitizedDateString = stripUprightDashIfPresent(value);

        if (Number.isInteger(Date.parse(sanitizedDateString))) {
            return;
        }
    }

    throw new Error(`Date in [-]CCYY-MM-DDThh:mm:ss[Z|(+|-)hh:mm] format expected. ${value} passed.`);
};

export const dateTimeDataTypeSourceCode = (value) => {
    let date;

    if (typeof value === 'string') {
        throwIfInvalidDateTimeFormat(value);

        date = value;
    } else if (value instanceof Date) {
        date = stripMilliseconds(value.toISOString());
    } else {
        throw new Error(`String or Date instance value expected. '${typeof value}' (${value}) passed.`);
    }

    return {
        _schemaName: 'DateTime',
        _dataType: true,
        _content: ` content="${date}"`
    };
};
