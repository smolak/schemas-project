import { ensureSchemaVariableNameIsSyntaxCompatible } from './utils';

const createOwnPropertiesCode = (properties) =>
    properties.own
        .sort()
        .reduce((code, propertyName) => {
            return `${code}
    ${propertyName}(value) { return this._itemprop('${propertyName}', value); },`;
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

const _base = {
    _itemprop(propertyName, value) {
        const itemprop = \`itemprop="\${propertyName}"\`;
        let content = '';
        
        if (value) {
            if (value.schemaName) {
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

export const createModuleCode = ({ schemaName, parentSchemaNames, properties }) => {
    const schemaVariableName = ensureSchemaVariableNameIsSyntaxCompatible(schemaName);
    const ancestorModulesImportCode = createAncestorModulesImportCode(schemaName, parentSchemaNames);
    const moduleBodyCode = `${schemaName === 'Thing' ? '..._base,' : ''}
    ${ancestorModulesImportCode ? createAncestorPropertiesInclusionCode(parentSchemaNames) : ''}
    ${createOwnPropertiesCode(properties)}`.trim();

    return `${ancestorModulesImportCode}

const ${schemaVariableName} = {
    ${moduleBodyCode}
}

export default ${schemaVariableName};`.trim();
};
