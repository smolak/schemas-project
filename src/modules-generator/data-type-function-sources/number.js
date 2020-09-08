export const numberDataTypeSourceCode = (value) => {
    const valueType = typeof value;

    if (valueType !== 'number') {
        throw new Error(`Number value expected. '${valueType}' (${value}) passed.`);
    }

    if (!Number.isFinite(value)) {
        throw new Error('Infinite value passed. Use finite number.');
    }

    return {
        _schemaName: 'Number',
        _dataType: true,
        _content: ` content="${value}"`
    };
};
