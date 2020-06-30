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

export const createBaseModuleCode = () => {
    return `const escapeDoubleQuotes = (str) => {
    return str.replace(/\\\\([\\s\\S])|(")/g, '\\\\$1$2');
};

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
        throw new Error(\`Cant't create a scope using DataType schema (\${schemaName} used).\`);
    }
}

const _base = {
    _itemprop(propertyName, value) {
        const itemprop = \`itemprop="\${propertyName}"\`;
        let content = '';
        
        if (value) {
            const isSchemaClass = Boolean(value.schemaName);
        
            if (isSchemaClass) {
                throwIfCanNotCreateAScope(value);

                content = \` itemscope itemtype="http://schema.org/\${value.schemaName}"\`;
            } else {
                content = \` content="\${escapeDoubleQuotes(value)}"\`;
            }
        }

        return \`\${itemprop}\${content}\`;
    }    
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
