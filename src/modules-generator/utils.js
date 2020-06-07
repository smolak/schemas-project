export const createFileName = (moduleName) => `${moduleName}.js`;
export const isANumber = (character) => Number.isInteger(Number(character));
export const ensureSchemaVariableNameIsSyntaxCompatible = (schemaName) => {
    const firstCharacterIsANumber = isANumber(schemaName.charAt(0));

    if (firstCharacterIsANumber) {
        return `_${schemaName}`;
    }

    return schemaName;
};
