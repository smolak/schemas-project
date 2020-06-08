import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import tmp from 'tmp';
import path from 'path';
import mkdirp from 'mkdirp';
import rimraf from 'rimraf';
import fs from 'fs';
import { buildModules } from '../../../src/modules-generator/buildModules';
import schemaData from '../../dummy-data/schemaData.json';

describe('buildModules', () => {
    const schemasInSchemaData = Object.keys(schemaData.schemas);
    const testBuildFolder = 'build';
    let tempDir;

    beforeEach(() => {
        tempDir = tmp.dirSync({ mode: 0o750, prefix: 'myTmpDir_' });
        mkdirp.sync(path.resolve(tempDir.name, testBuildFolder));
    });

    afterEach(() => {
        rimraf.sync(path.resolve(tempDir.name, testBuildFolder));

        tempDir.removeCallback();
    });

    describe('buildPath config option', () => {
        describe("when path doesn't exist", () => {
            it('should throw', () => {
                const buildPath = '/some/non-existent/or/non-accessible/build/path';

                expect(() => buildModules({ buildPath })).to.throw('Build path is not accessible.');
            });
        });
    });

    it('should create modules named after Schemas coming from schema data', () => {
        const buildPath = path.resolve(tempDir.name, testBuildFolder);

        buildModules({ buildPath, schemaData });

        const fileNames = fs.readdirSync(buildPath);
        const expectedFileNames = schemasInSchemaData.map((schemaName) => `${schemaName}.js`);

        expect(fileNames).to.include.members(expectedFileNames);
    });

    describe('built modules', () => {
        const importBuiltModules = (buildPath) => {
            const modules = schemasInSchemaData.map(async (schemaName) => {
                const fileName = `${schemaName}.js`;
                const filePath = path.resolve(buildPath, fileName);
                const importedModule = await import(filePath);

                return {
                    module: importedModule.default,
                    schemaName
                };
            });

            return Promise.all(modules);
        };

        it('should be objects', () => {
            const buildPath = path.resolve(tempDir.name, testBuildFolder);

            buildModules({ buildPath, schemaData });

            return importBuiltModules(buildPath).then((resolvedModules) => {
                resolvedModules.forEach(({ module }) => {
                    expect(typeof module).to.equal('object');
                });
            });
        });

        it("should contain all schema's own properties as functions", () => {
            const buildPath = path.resolve(tempDir.name, testBuildFolder);

            buildModules({ buildPath, schemaData });

            return importBuiltModules(buildPath).then((resolvedModules) => {
                resolvedModules.forEach(({ module, schemaName }) => {
                    const ownProperties = schemaData.schemas[schemaName].properties.own;

                    ownProperties.forEach((propertyName) => {
                        expect(typeof module[propertyName]).to.equal('function');
                    });
                });
            });
        });

        it("should have access to properties inherited from all of schema's ancestors", () => {
            const buildPath = path.resolve(tempDir.name, testBuildFolder);

            buildModules({ buildPath, schemaData });

            return importBuiltModules(buildPath).then((resolvedModules) => {
                resolvedModules.forEach(({ module, schemaName }) => {
                    const properties = schemaData.schemas[schemaName].properties;
                    const ancestorProperties = properties.all.filter((property) => !properties.own.includes(property));

                    ancestorProperties.forEach((propertyName) => {
                        expect(typeof module[propertyName]).to.equal('function');
                    });
                });
            });
        });

        describe('every property', () => {
            it('should return itemprop for itself', () => {
                const buildPath = path.resolve(tempDir.name, testBuildFolder);

                buildModules({ buildPath, schemaData });

                return importBuiltModules(buildPath).then((resolvedModules) => {
                    resolvedModules.forEach(({ module, schemaName }) => {
                        const allProperties = schemaData.schemas[schemaName].properties.all;

                        allProperties.forEach((propertyName) => {
                            expect(module[propertyName]()).to.equal(`itemprop="${propertyName}"`);
                        });
                    });
                });
            });
        });
    });
});
