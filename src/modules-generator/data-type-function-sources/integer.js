export const integerDataTypeSourceCode = (value) => {
    const valueType = typeof value;

    if (!Number.isInteger(value)) {
        throw new Error(`Integer value expected. '${valueType}' (${value}) passed.`);
    }

    return {
        _schemaName: 'Integer',
        _dataType: true,
        _content: ` content="${value}"`
    };
};
