import { stripUprightDashIfPresent } from '../utils';

export const throwIfInvalidDateFormat = (value) => {
    const yearOrYearMonthOrYearMonthDay = /^(-?)\d{4}(-\d{2})?(-\d{2})?$/;
    const matches = yearOrYearMonthOrYearMonthDay.test(value);

    if (matches) {
        const sanitizedDateString = stripUprightDashIfPresent(value);

        if (Number.isInteger(Date.parse(sanitizedDateString))) {
            return;
        }
    }

    throw new Error(`Date in ISO 8601 format expected. ${value} passed.`);
};

export const dateDataTypeSourceCode = (value) => {
    let date;

    if (typeof value === 'string') {
        throwIfInvalidDateFormat(value);

        date = value;
    } else if (value instanceof Date) {
        const [isoStringDate] = value.toISOString().split('T');

        date = isoStringDate;
    } else {
        throw new Error(`String or Date instance value expected. '${typeof value}' (${value}) passed.`);
    }

    return {
        _schemaName: 'Date',
        _dataType: true,
        _content: ` content="${date}"`
    };
};
