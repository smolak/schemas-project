export const createFileName = (moduleName) => `${moduleName}.js`;
export const isANumber = (character) => Number.isInteger(Number(character));
export const ensureSchemaVariableNameIsSyntaxCompatible = (schemaName) => {
    const firstCharacterIsANumber = isANumber(schemaName.charAt(0));

    if (firstCharacterIsANumber) {
        return `_${schemaName}`;
    }

    return schemaName;
};
export const escapeDoubleQuotes = (string) => string.replace(/\\([\s\S])|(")/g, '&quot;$1');
export const stripUprightDashIfPresent = (string) => (string.charAt(0) === '-' ? string.substr(1) : string);
export const stripMilliseconds = (isoDateTimeString) => `${isoDateTimeString.split('.')[0]}Z`;
