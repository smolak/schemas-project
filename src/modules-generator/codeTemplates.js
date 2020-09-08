import {
    ensureSchemaVariableNameIsSyntaxCompatible,
    escapeDoubleQuotes,
    stripMilliseconds,
    stripUprightDashIfPresent,
    throwIfDoesNotAcceptSchemaAsValue
} from './utils';
import { textDataTypeSourceCode } from './data-type-function-sources/text';
import { cssSelectorDataTypeSourceCode } from './data-type-function-sources/cssSelector';
import { booleanDataTypeSourceCode } from './data-type-function-sources/boolean';
import { numberDataTypeSourceCode } from './data-type-function-sources/number';
import { xPathTypeDataTypeSourceCode } from './data-type-function-sources/xPathType';
import { urlDataTypeSourceCode } from './data-type-function-sources/url';
import { integerDataTypeSourceCode } from './data-type-function-sources/integer';
import { dateDataTypeSourceCode, throwIfInvalidDateFormat } from './data-type-function-sources/date';
import { dateTimeDataTypeSourceCode, throwIfInvalidDateTimeFormat } from './data-type-function-sources/dateTime';
import { timeDataTypeSourceCode, throwIfInvalidTimeFormat } from './data-type-function-sources/time';

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
                content = ` itemscope itemtype="https://schema.org/${value._schemaName}"`;
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

const createStripUprightDashIfPresentCode = () =>
    `const stripUprightDashIfPresent = ${stripUprightDashIfPresent.toString()};`;

const createThrowIfInvalidDateFormatCode = () =>
    `const throwIfInvalidDateFormat = ${throwIfInvalidDateFormat.toString()};`;

const createThrowIfInvalidDateTimeFormatCode = () =>
    `const throwIfInvalidDateTimeFormat = ${throwIfInvalidDateTimeFormat.toString()};`;

const createThrowIfInvalidTimeFormat = () => `const throwIfInvalidTimeFormat = ${throwIfInvalidTimeFormat.toString()};`;

const createStripMillisecondsCode = () => `const stripMilliseconds = ${stripMilliseconds.toString()};`;

const dataTypeCode = `
    text: ${textDataTypeSourceCode.toString()},
    cssSelectorType: ${cssSelectorDataTypeSourceCode.toString()},
    boolean: ${booleanDataTypeSourceCode.toString()},
    number: ${numberDataTypeSourceCode.toString()},
    xPathType: ${xPathTypeDataTypeSourceCode.toString()},
    url: ${urlDataTypeSourceCode.toString()},
    integer: ${integerDataTypeSourceCode.toString()},
    date: ${dateDataTypeSourceCode.toString()},
    dateTime: ${dateTimeDataTypeSourceCode.toString()},
    time: ${timeDataTypeSourceCode.toString()},
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
