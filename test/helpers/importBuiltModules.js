import path from 'path';

export const importBuiltModules = ({ buildPath, schemaData }) => {
    const schemasInSchemaData = Object.keys(schemaData.schemas);
    const modules = schemasInSchemaData.map(async (schemaName) => {
        const fileName = `${schemaName}.js`;
        const filePath = path.resolve(buildPath, fileName);
        const importedModule = await import(filePath);

        return importedModule.default;
    });

    return Promise.all(modules);
};
