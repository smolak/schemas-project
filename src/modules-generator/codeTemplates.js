import { ensureSchemaVariableNameIsSyntaxCompatible } from './utils';

const createOwnPropertiesCode = (properties) =>
    properties.own
        .sort()
        .reduce((code, propertyName) => {
            return `${code}
    ${propertyName}: () => {},`;
        }, '')
        .trim();

const createAncestorModulesImportCode = (parentSchemaNames) =>
    parentSchemaNames
        .reduce((code, moduleName) => {
            const syntaxCompatibleSchemaName = ensureSchemaVariableNameIsSyntaxCompatible(moduleName);

            return `${code}
import ${syntaxCompatibleSchemaName} from './${moduleName}';`;
        }, '')
        .trim();

const createAncestorPropertiesInclusionCode = (parentSchemaNames) =>
    parentSchemaNames
        .reduce((code, moduleName) => {
            const syntaxCompatibleSchemaName = ensureSchemaVariableNameIsSyntaxCompatible(moduleName);

            return `${code}
    ...${syntaxCompatibleSchemaName},`;
        }, '')
        .trim();

export const createModuleCode = ({ schemaName, parentSchemaNames, properties }) => {
    const schemaVariableName = ensureSchemaVariableNameIsSyntaxCompatible(schemaName);
    const ancestorModulesImportCode = createAncestorModulesImportCode(parentSchemaNames);
    const moduleBodyCode = `${ancestorModulesImportCode ? createAncestorPropertiesInclusionCode(parentSchemaNames) : ''}
    ${createOwnPropertiesCode(properties)}`.trim();

    return `${ancestorModulesImportCode}

const ${schemaVariableName} = {
    ${moduleBodyCode}
}

export default ${schemaVariableName};`.trim();
};
