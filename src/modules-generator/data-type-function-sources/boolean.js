export const booleanDataTypeSourceCode = (value) => {
    const valueType = typeof value;

    if (valueType !== 'boolean') {
        throw new Error(`Boolean value expected. '${valueType}' (${value}) passed.`);
    }

    return {
        _schemaName: 'Boolean',
        _dataType: true,
        _content: ` content="${value}"`
    };
};
