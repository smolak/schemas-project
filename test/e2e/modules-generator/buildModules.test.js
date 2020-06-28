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

            describe('when called with a string value', () => {
                it('should return that value in content attribute', () => {
                    const buildPath = path.resolve(tempDir.name, testBuildFolder);
                    const anyStringValue = 'I am some value';

                    buildModules({ buildPath, schemaData });

                    return importBuiltModules(buildPath).then((resolvedModules) => {
                        resolvedModules.forEach(({ module, schemaName }) => {
                            const allProperties = schemaData.schemas[schemaName].properties.all;

                            allProperties.forEach((propertyName) => {
                                expect(module[propertyName](anyStringValue)).to.contain(`content="${anyStringValue}"`);
                            });
                        });
                    });
                });

                describe('when that string contains double quotes', () => {
                    it('should escape them', () => {
                        const buildPath = path.resolve(tempDir.name, testBuildFolder);
                        const stringValueWithDoublequotes = 'I am "some" value';

                        // prettier-ignore
                        const expectedContent = 'content="I am \\"some\\" value"';

                        buildModules({ buildPath, schemaData });

                        return importBuiltModules(buildPath).then((resolvedModules) => {
                            resolvedModules.forEach(({ module, schemaName }) => {
                                const allProperties = schemaData.schemas[schemaName].properties.all;

                                allProperties.forEach((propertyName) => {
                                    expect(module[propertyName](stringValueWithDoublequotes)).to.contain(
                                        expectedContent
                                    );
                                });
                            });
                        });
                    });
                });
            });

            describe('when called with a schema class', () => {
                it('should create a scope for that schema', () => {
                    const buildPath = path.resolve(tempDir.name, testBuildFolder);

                    buildModules({ buildPath, schemaData });

                    return importBuiltModules(buildPath).then((resolvedModules) => {
                        const PropertyValue = resolvedModules.find(({ schemaName }) => schemaName === 'PropertyValue');

                        resolvedModules.forEach(({ module, schemaName }) => {
                            const propertyThatCanCreateAScope = 'identifier';

                            // Not all schemas have properties, hence the check
                            if (module.hasOwnProperty(propertyThatCanCreateAScope)) {
                                const result = module[propertyThatCanCreateAScope](PropertyValue);

                                expect(result).to.contain('itemscope itemtype="http://schema.org/PropertyValue"');
                            }
                        });
                    });
                });

                describe('when that schema is one of DataTypes', () => {
                    it('should not allow that', () => {
                        const dataTypeModuleNames = ['Boolean', 'Date', 'DateTime', 'Number', 'Text', 'Time'];
                        const propertyThatCanCreateAScope = 'identifier';
                        const buildPath = path.resolve(tempDir.name, testBuildFolder);

                        buildModules({ buildPath, schemaData });

                        return importBuiltModules(buildPath).then((resolvedModules) => {
                            dataTypeModuleNames.forEach((dataTypeModuleName) => {
                                const DataTypeModule = resolvedModules.find(
                                    ({ schemaName }) => schemaName === dataTypeModuleName
                                );

                                resolvedModules.forEach(({ module }) => {
                                    // Not all schemas have properties, hence the check
                                    if (module.hasOwnProperty(propertyThatCanCreateAScope)) {
                                        expect(() => module[propertyThatCanCreateAScope](DataTypeModule)).to.throw(
                                            `Cant't create a scope using DataType schema (${dataTypeModuleName} used).`
                                        );
                                    }
                                });
                            });
                        });
                    });
                });

                describe('when that schema is one of descendant of DataType', () => {
                    it('should not allow that', () => {
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
                        const propertyThatCanCreateAScope = 'identifier';
                        const buildPath = path.resolve(tempDir.name, testBuildFolder);

                        buildModules({ buildPath, schemaData });

                        return importBuiltModules(buildPath).then((resolvedModules) => {
                            dataTypeDescendantsModuleNames.forEach((dataTypeModuleName) => {
                                const DataTypeModule = resolvedModules.find(
                                    ({ schemaName }) => schemaName === dataTypeModuleName
                                );

                                resolvedModules.forEach(({ module }) => {
                                    // Not all schemas have properties, hence the check
                                    if (module.hasOwnProperty(propertyThatCanCreateAScope)) {
                                        expect(() => module[propertyThatCanCreateAScope](DataTypeModule)).to.throw(
                                            `Cant't create a scope using DataType schema (${dataTypeModuleName} used).`
                                        );
                                    }
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});
