import { escapeDoubleQuotes } from '../utils';

export const cssSelectorDataTypeSourceCode = (value) => {
    const valueType = typeof value;

    if (valueType !== 'string') {
        throw new Error(`String value expected. '${valueType}' (${value}) passed.`);
    }

    const trimmedValue = value.trim();

    if (trimmedValue === '') {
        throw new Error("Empty string passed. Value can't be empty.");
    }

    return {
        _schemaName: 'CssSelectorType',
        _dataType: true,
        _content: ` content="${escapeDoubleQuotes(trimmedValue)}"`
    };
};
