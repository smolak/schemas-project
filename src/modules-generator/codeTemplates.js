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

    if (schemaName === 'Thing') {
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

const throwIfCanNotCreateAScope = ({ schemaName }) => {
    const dataTypeModuleNames = ['Boolean', 'Date', 'DateTime', 'Number', 'Text', 'Time'];
    const dataTypeDescendantsModuleNames = [
        'False',
        'True',
        'Float',
        'Integer',
        'CssSelectorType',
        'PronounceableText',
        'URL',
        'XPathType'
    ];

    if ([...dataTypeModuleNames, ...dataTypeDescendantsModuleNames].includes(schemaName)) {
        throw new Error(`Cant't create a scope using DataType schema (${schemaName} used).`);
    }
};

const createBooleanValueContent = (booleanValue) => {
    return booleanValue ? 'true' : 'false';
};

const throwIfNotText = (value) => {
    if (typeof value !== 'string') {
        throw new Error('Text value type expected.');
    }
};

const throwIfNotBoolean = (value) => {
    if (typeof value !== 'boolean') {
        throw new Error('Boolean value type expected.');
    }
};

const throwIfNotDate = (value) => {
    if (isNaN(Date.parse(value))) {
        throw new Error('Date type value expected.');
    }
};

const escapeDoubleQuotes = (string) => {
    return string.replace(/\\([\s\S])|(")/g, '\\$1$2');
};

/* eslint-disable no-underscore-dangle */
const _base = {
    _itemprop(propertyName, value, propertyValueTypes) {
        const itemprop = `itemprop="${propertyName}"`;
        let content = '';

        if (value !== undefined) {
            const isSchemaClass = Boolean(value.schemaName);

            if (isSchemaClass) {
                throwIfCanNotCreateAScope(value);

                content = ` itemscope itemtype="http://schema.org/${value.schemaName}"`;
            } else {
                let contentValue = value;

                if (propertyValueTypes.includes('Text')) {
                    throwIfNotText(value);
                }

                if (propertyValueTypes.includes('Boolean')) {
                    throwIfNotBoolean(value);

                    contentValue = createBooleanValueContent(value);
                }

                if (propertyValueTypes.includes('Date')) {
                    throwIfNotDate(value);

                    if (value instanceof Date) {
                        contentValue = value.toISOString();
                    } else {
                        const hoursAndMinutesSeparator = ':';
                        const isDatetime = value.includes(hoursAndMinutesSeparator);

                        if (isDatetime) {
                            const date = new Date(value);

                            contentValue = date.toISOString();
                        }
                    }
                }

                content = ` content="${escapeDoubleQuotes(contentValue)}"`;
            }
        }

        return `${itemprop}${content}`;
    }
};

export const createBaseModuleCode = () => {
    return `const escapeDoubleQuotes = ${escapeDoubleQuotes.toString()}

const throwIfCanNotCreateAScope = ${throwIfCanNotCreateAScope.toString()}
const throwIfNotText = ${throwIfNotText.toString()}
const throwIfNotBoolean = ${throwIfNotBoolean.toString()}
const throwIfNotDate = ${throwIfNotDate.toString()}
const createBooleanValueContent = ${createBooleanValueContent.toString()}

const _base = {
    ${_base._itemprop.toString()}    
}    
    
export default _base;`;
};

export const createModuleCode = ({ schemaName, parentSchemaNames, schemaProperties, allProperties }) => {
    const schemaVariableName = ensureSchemaVariableNameIsSyntaxCompatible(schemaName);
    const ancestorModulesImportCode = createAncestorModulesImportCode(schemaName, parentSchemaNames);
    const moduleBodyCode = `${schemaName === 'Thing' ? '..._base,' : ''}
    ${ancestorModulesImportCode ? createAncestorPropertiesInclusionCode(parentSchemaNames) : ''}
    ${createOwnPropertiesCode(schemaProperties, allProperties)}`.trim();

    return `${ancestorModulesImportCode}

const ${schemaVariableName} = {
    ${moduleBodyCode}
}

export default ${schemaVariableName};`.trim();
};
