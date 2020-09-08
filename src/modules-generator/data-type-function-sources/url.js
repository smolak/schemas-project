import { escapeDoubleQuotes } from '../utils';

export const urlDataTypeSourceCode = (value) => {
    try {
        // eslint-disable-next-line no-new
        new URL(value);
    } catch (_) {
        throw new Error(`Value passed (${value}) is not a URL.`);
    }

    return {
        _schemaName: 'URL',
        _dataType: true,
        _content: ` content="${escapeDoubleQuotes(value.trim())}"`
    };
};
