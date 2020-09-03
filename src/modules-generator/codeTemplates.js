import { ensureSchemaVariableNameIsSyntaxCompatible } from './utils';

const createOwnPropertiesCode = (schemaProperties, allProperties) =>
    schemaProperties.own
        .sort()
        .reduce((code, propertyName) => {
            const { valueTypes } = allProperties[propertyName];
            const stringifiedValueTypes = valueTypes.map((valueType) => `'${valueType}'`).toString();

            return `${code}
    ${propertyName}(value) { return this._itemprop('${propertyName}', value, [${stringifiedValueTypes}]); },`;
        }, '')
        .trim();

const createAncestorModulesImportCode = (schemaName, parentSchemaNames) => {
    let baseModuleImportCode = '';

    if (schemaName === 'Thing' || schemaName === 'DataType') {
        baseModuleImportCode = "import _base from './_base.js';";
    }

    const ancestorModulesImportCode = parentSchemaNames
        .reduce((code, moduleName) => {
            const syntaxCompatibleSchemaName = ensureSchemaVariableNameIsSyntaxCompatible(moduleName);

            return `${code}
import ${syntaxCompatibleSchemaName} from './${moduleName}';`;
        }, '')
        .trim();

    return `${baseModuleImportCode}
${ancestorModulesImportCode}`.trim();
};

const createAncestorPropertiesInclusionCode = (parentSchemaNames) =>
    parentSchemaNames
        .reduce((code, moduleName) => {
            const syntaxCompatibleSchemaName = ensureSchemaVariableNameIsSyntaxCompatible(moduleName);

            return `${code}
    ...${syntaxCompatibleSchemaName},`;
        }, '')
        .trim();

const throwIfDoesNotAcceptSchemaAsValue = (schemaName, propertyName, allowedValues) => {
    if (!allowedValues.includes(schemaName)) {
        throw new Error(
            `'${schemaName}' can't be used as value for '${propertyName}' property. '${propertyName}' accepts only: '${allowedValues.join(
                "', "
            )}'.`
        );
    }
};

const escapeDoubleQuotes = (string) => {
    return string.replace(/\\([\s\S])|(")/g, '&quot;$1');
};

/* eslint-disable no-underscore-dangle */
const _base = {
    _itemprop(propertyName, value, propertyValueTypes) {
        const itemprop = `itemprop="${propertyName}"`;
        let content = '';

        if (value !== undefined) {
            throwIfDoesNotAcceptSchemaAsValue(value._schemaName, propertyName, propertyValueTypes);

            const isDataTypeSchema = Boolean(value._dataType);

            if (isDataTypeSchema) {
                content = value._content;
            } else {
                content = ` itemscope itemtype="http://schema.org/${value._schemaName}"`;
            }
        }

        return `${itemprop}${content}`.trim();
    }
};

export const createBaseModuleCode = () => {
    return `const throwIfDoesNotAcceptSchemaAsValue = ${throwIfDoesNotAcceptSchemaAsValue.toString()}

const _base = {
    ${_base._itemprop.toString()}    
}    
    
export default _base;`;
};

const textDataTypeCode = (value) => {
    const valueType = typeof value;

    if (valueType !== 'string') {
        throw new Error(`String value expected. '${valueType}' (${value}) passed.`);
    }

    const trimmedValue = value.trim();

    if (trimmedValue === '') {
        throw new Error("Empty string passed. Value can't be empty.");
    }

    return {
        _schemaName: 'Text',
        _dataType: true,
        _content: ` content="${escapeDoubleQuotes(trimmedValue)}"`
    };
};

const cssSelectorTypeDataTypeCode = (value) => {
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

const xPathTypeDataTypeCode = (value) => {
    const valueType = typeof value;

    if (valueType !== 'string') {
        throw new Error(`String value expected. '${valueType}' (${value}) passed.`);
    }

    const trimmedValue = value.trim();

    if (trimmedValue === '') {
        throw new Error("Empty string passed. Value can't be empty.");
    }

    return {
        _schemaName: 'XPathType',
        _dataType: true,
        _content: ` content="${trimmedValue}"`
    };
};

const urlDataTypeCode = (value) => {
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

const booleanDataTypeCode = (value) => {
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

const numberDataTypeCode = (value) => {
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

const integerDataTypeCode = (value) => {
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

const stripUprightDashIfPresent = (string) => (string.charAt(0) === '-' ? string.substr(1) : string);
const createStripUprightDashIfPresentCode = () =>
    `const stripUprightDashIfPresent = ${stripUprightDashIfPresent.toString()};`;

const throwIfInvalidDateFormat = (value) => {
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
const createThrowIfInvalidDateFormatCode = () =>
    `const throwIfInvalidDateFormat = ${throwIfInvalidDateFormat.toString()};`;

const throwIfInvalidDateTimeFormat = (value) => {
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
const createThrowIfInvalidDateTimeFormatCode = () =>
    `const throwIfInvalidDateTimeFormat = ${throwIfInvalidDateTimeFormat.toString()};`;

const throwIfInvalidTimeFormat = (value) => {
    const schemaTimeFormat = /^\d{2}:\d{2}:\d{2}(Z?|(\+|-)\d{2}:\d{2})$/;

    if (!schemaTimeFormat.test(value)) {
        throw new Error(`Time in hh:mm:ss[Z|(+|-)hh:mm] format expected. ${value} passed.`);
    }
};
const createThrowIfInvalidTimeFormat = () => `const throwIfInvalidTimeFormat = ${throwIfInvalidTimeFormat.toString()};`;

const stripMilliseconds = (isoDateTimeString) => `${isoDateTimeString.split('.')[0]}Z`;
const createStripMillisecondsCode = () => `const stripMilliseconds = ${stripMilliseconds.toString()};`;

const dateDataTypeCode = (value) => {
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

const dateTimeDataTypeCode = (value) => {
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

const timeDataTypeCode = (value) => {
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

const dataTypeCode = `
    text: ${textDataTypeCode.toString()},
    cssSelectorType: ${cssSelectorTypeDataTypeCode.toString()},
    boolean: ${booleanDataTypeCode.toString()},
    number: ${numberDataTypeCode.toString()},
    xPathType: ${xPathTypeDataTypeCode.toString()},
    url: ${urlDataTypeCode.toString()},
    integer: ${integerDataTypeCode.toString()},
    date: ${dateDataTypeCode.toString()},
    dateTime: ${dateTimeDataTypeCode.toString()},
    time: ${timeDataTypeCode.toString()},
`.trim();

const createEscapeDoubleQuotesCode = () => `const escapeDoubleQuotes = ${escapeDoubleQuotes.toString()};`;

export const createModuleCode = ({ schemaName, parentSchemaNames, schemaProperties, allProperties }) => {
    const schemaVariableName = ensureSchemaVariableNameIsSyntaxCompatible(schemaName);
    const ancestorModulesImportCode = createAncestorModulesImportCode(schemaName, parentSchemaNames);
    const ownPropertiesCode = createOwnPropertiesCode(schemaProperties, allProperties);
    const schemaDataCode = [
        createEscapeDoubleQuotesCode(),
        createStripUprightDashIfPresentCode(),
        createThrowIfInvalidDateFormatCode(),
        createThrowIfInvalidDateTimeFormatCode(),
        createThrowIfInvalidTimeFormat(),
        createStripMillisecondsCode()
    ].join('\n');

    const moduleBodyCode = `
    ${schemaName === 'Thing' || schemaName === 'DataType' ? '..._base,' : ''}
    ${ancestorModulesImportCode ? createAncestorPropertiesInclusionCode(parentSchemaNames) : ''}
    ${ownPropertiesCode}`.trim();

    return `${ancestorModulesImportCode}

${schemaName === 'DataType' ? schemaDataCode : ''}
const ${schemaVariableName} = {
    ${moduleBodyCode}
    ${schemaName === 'DataType' ? dataTypeCode : ''}
    _schemaName: '${schemaName}'
}

export default ${schemaVariableName};`.trim();
};
