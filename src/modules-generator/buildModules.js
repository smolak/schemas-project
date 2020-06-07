import fs from 'fs';
import path from 'path';

export const buildModules = ({ buildPath, schemaData }) => {
    try {
        fs.accessSync(buildPath);
    } catch (_) {
        throw new Error('Build path is not accessible.');
    }

    const schemaNames = Object.keys(schemaData.schemas);
    const createFileName = (moduleName) => `${moduleName}.js`;
    const isANumber = (character) => Number.isInteger(Number(character));
    const ensureSchemaVariableNameIsSyntaxCompatible = (schemaName) => {
        const firstCharacterIsANumber = isANumber(schemaName.charAt(0));

        if (firstCharacterIsANumber) {
            return `_${schemaName}`;
        }

        return schemaName;
    };
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

    schemaNames.forEach(async (schemaName) => {
        const fileName = createFileName(schemaName);
        const filePath = path.resolve(buildPath, fileName);
        const { properties } = schemaData.schemas[schemaName];

        const parentSchemaNames = Object.keys(properties).filter(
            (propertiesGroupName) => propertiesGroupName !== 'all' && propertiesGroupName !== 'own'
        );

        const ancestorModulesImportCode = createAncestorModulesImportCode(parentSchemaNames);
        const schemaVariableName = ensureSchemaVariableNameIsSyntaxCompatible(schemaName);
        const moduleBodyCode = `${
            ancestorModulesImportCode ? createAncestorPropertiesInclusionCode(parentSchemaNames) : ''
        }
    ${createOwnPropertiesCode(properties)}`.trim();

        const moduleCode = `${ancestorModulesImportCode}

const ${schemaVariableName} = {
    ${moduleBodyCode}
}

export default ${schemaVariableName};`.trim();

        fs.writeFileSync(filePath, moduleCode);
    });
};
