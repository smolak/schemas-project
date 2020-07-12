import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import tmp from 'tmp';
import path from 'path';
import mkdirp from 'mkdirp';
import rimraf from 'rimraf';
import fs from 'fs';
import { buildModules } from '../../../src/modules-generator/buildModules';
import { importBuiltModules } from '../../helpers/importBuiltModules';
import schemaData from '../../dummy-data/schemaData.json';

describe('buildModules', () => {
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
        const schemasInSchemaData = Object.keys(schemaData.schemas);
        const expectedFileNames = schemasInSchemaData.map((schemaName) => `${schemaName}.js`);

        expect(fileNames).to.include.members(expectedFileNames);
    });

    describe('built modules', () => {
        it('should be objects', () => {
            const buildPath = path.resolve(tempDir.name, testBuildFolder);

            buildModules({ buildPath, schemaData });

            return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                resolvedModules.forEach(({ module }) => {
                    expect(typeof module).to.equal('object');
                });
            });
        });

        it("should contain all schema's own properties as functions", () => {
            const buildPath = path.resolve(tempDir.name, testBuildFolder);

            buildModules({ buildPath, schemaData });

            return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
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

            return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                resolvedModules.forEach(({ module, schemaName }) => {
                    const { properties } = schemaData.schemas[schemaName];
                    const ancestorProperties = properties.all.filter((property) => !properties.own.includes(property));

                    ancestorProperties.forEach((propertyName) => {
                        expect(typeof module[propertyName]).to.equal('function');
                    });
                });
            });
        });

        describe('every property of built module', () => {
            it('should return itemprop for itself', () => {
                const buildPath = path.resolve(tempDir.name, testBuildFolder);

                buildModules({ buildPath, schemaData });

                return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                    resolvedModules.forEach(({ module, schemaName }) => {
                        const allProperties = schemaData.schemas[schemaName].properties.all;

                        allProperties.forEach((propertyName) => {
                            expect(module[propertyName]()).to.equal(`itemprop="${propertyName}"`);
                        });
                    });
                });
            });

            describe('when called with a schema class', () => {
                it('should create a scope for that schema', () => {
                    const buildPath = path.resolve(tempDir.name, testBuildFolder);

                    buildModules({ buildPath, schemaData });

                    return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                        const PropertyValue = resolvedModules.find(({ schemaName }) => schemaName === 'PropertyValue');

                        resolvedModules.forEach(({ module }) => {
                            const propertyThatCanCreateAScope = 'identifier';

                            // Not all schemas have properties, hence the check
                            if (module[propertyThatCanCreateAScope]) {
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

                        return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                            dataTypeModuleNames.forEach((dataTypeModuleName) => {
                                const DataTypeModule = resolvedModules.find(
                                    ({ schemaName }) => schemaName === dataTypeModuleName
                                );

                                resolvedModules.forEach(({ module }) => {
                                    // Not all schemas have properties, hence the check
                                    if (module[propertyThatCanCreateAScope]) {
                                        expect(() => module[propertyThatCanCreateAScope](DataTypeModule)).to.throw(
                                            `Cant't create a scope using DataType schema (${dataTypeModuleName} used).`
                                        );
                                    }
                                });
                            });
                        });
                    });
                });

                describe('when that schema is one of the descendants of DataType', () => {
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

                        return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                            dataTypeDescendantsModuleNames.forEach((dataTypeModuleName) => {
                                const DataTypeModule = resolvedModules.find(
                                    ({ schemaName }) => schemaName === dataTypeModuleName
                                );

                                resolvedModules.forEach(({ module }) => {
                                    // Not all schemas have properties, hence the check
                                    if (module[propertyThatCanCreateAScope]) {
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

        describe('valueTypes checking (types properties accept)', () => {
            describe('Text value type', () => {
                const propertyThatAcceptsTextValue = 'name';
                const moduleHasPropertyThatAcceptsTextValue = (module) => Boolean(module[propertyThatAcceptsTextValue]);

                it('should return given value as is in content attribute', () => {
                    const buildPath = path.resolve(tempDir.name, testBuildFolder);
                    const textValue = 'I am some text value';

                    buildModules({ buildPath, schemaData });

                    return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                        resolvedModules.forEach(({ module }) => {
                            if (moduleHasPropertyThatAcceptsTextValue(module)) {
                                expect(module[propertyThatAcceptsTextValue](textValue)).to.contain(
                                    `content="I am some text value"`
                                );
                            }
                        });
                    });
                });

                it('should not allow any other value than a text one', () => {
                    const buildPath = path.resolve(tempDir.name, testBuildFolder);
                    const nonTextValue = true;

                    buildModules({ buildPath, schemaData });

                    return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                        resolvedModules.forEach(({ module }) => {
                            if (moduleHasPropertyThatAcceptsTextValue(module)) {
                                expect(() => module[propertyThatAcceptsTextValue](nonTextValue)).to.throw(
                                    'Text value type expected.'
                                );
                            }
                        });
                    });
                });

                describe('when that text value contains double quotes', () => {
                    it('should escape them', () => {
                        const buildPath = path.resolve(tempDir.name, testBuildFolder);
                        const textValueWithDoublequotes = 'I am "double quoted" text value';

                        // prettier-ignore
                        const expectedContent = 'content="I am \\"double quoted\\" text value"';

                        buildModules({ buildPath, schemaData });

                        return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                            resolvedModules.forEach(({ module }) => {
                                if (moduleHasPropertyThatAcceptsTextValue(module)) {
                                    expect(module[propertyThatAcceptsTextValue](textValueWithDoublequotes)).to.contain(
                                        expectedContent
                                    );
                                }
                            });
                        });
                    });
                });
            });

            describe('Boolean value type', () => {
                const propertyThatTakesBooleanValue = 'isAccessibleForFree';
                const moduleHasPropertyThatTakesBooleanValue = (module) =>
                    Boolean(module[propertyThatTakesBooleanValue]);

                it('should return boolean value in content attribute', () => {
                    const buildPath = path.resolve(tempDir.name, testBuildFolder);

                    buildModules({ buildPath, schemaData });

                    return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                        resolvedModules.forEach(({ module }) => {
                            if (moduleHasPropertyThatTakesBooleanValue(module)) {
                                expect(module[propertyThatTakesBooleanValue](true)).to.contain(`content="true"`);
                                expect(module[propertyThatTakesBooleanValue](false)).to.contain(`content="false"`);
                            }
                        });
                    });
                });

                it('should not allow any other value than a boolean one', () => {
                    const nonBooleanValue = 'a string';
                    const buildPath = path.resolve(tempDir.name, testBuildFolder);

                    buildModules({ buildPath, schemaData });

                    return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                        resolvedModules.forEach(({ module }) => {
                            if (moduleHasPropertyThatTakesBooleanValue(module)) {
                                expect(() => module[propertyThatTakesBooleanValue](nonBooleanValue)).to.throw(
                                    'Boolean value type expected.'
                                );
                            }
                        });
                    });
                });
            });

            describe('Date data type', () => {
                const propertyThatTakesDateValue = 'expires';
                const moduleHasPropertyThatTakesDateValue = (module) => Boolean(module[propertyThatTakesDateValue]);

                describe('when value is a valid, date only string', () => {
                    it('should return that value as is in content attribute', () => {
                        const buildPath = path.resolve(tempDir.name, testBuildFolder);

                        buildModules({ buildPath, schemaData });

                        return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                            resolvedModules.forEach(({ module }) => {
                                if (moduleHasPropertyThatTakesDateValue(module)) {
                                    expect(module[propertyThatTakesDateValue]('2020')).to.contain(`content="2020"`);
                                    expect(module[propertyThatTakesDateValue]('2020-07')).to.contain(
                                        `content="2020-07"`
                                    );
                                    expect(module[propertyThatTakesDateValue]('2020-07-08')).to.contain(
                                        `content="2020-07-08"`
                                    );
                                    expect(module[propertyThatTakesDateValue]('2020.07.08')).to.contain(
                                        `content="2020.07.08"`
                                    );
                                    expect(module[propertyThatTakesDateValue]('2020/07/08')).to.contain(
                                        `content="2020/07/08"`
                                    );
                                }
                            });
                        });
                    });
                });

                describe('when value is an instance of Date', () => {
                    it('should return date in minus separated format in content attribute honoring UTC', () => {
                        const buildPath = path.resolve(tempDir.name, testBuildFolder);

                        buildModules({ buildPath, schemaData });

                        return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                            resolvedModules.forEach(({ module }) => {
                                if (moduleHasPropertyThatTakesDateValue(module)) {
                                    const date = new Date(Date.UTC(2020, 0, 1));

                                    expect(module[propertyThatTakesDateValue](date)).to.contain(`content="2020-01-01"`);
                                }
                            });
                        });
                    });
                });

                describe('when value is a valid, datetime string', () => {
                    it('should return date in minus separated format in content attribute honoring UTC', () => {
                        const buildPath = path.resolve(tempDir.name, testBuildFolder);

                        buildModules({ buildPath, schemaData });

                        return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                            resolvedModules.forEach(({ module }) => {
                                if (moduleHasPropertyThatTakesDateValue(module)) {
                                    expect(module[propertyThatTakesDateValue]('2020 14:15')).to.contain(
                                        `content="2020-01-01"`
                                    );
                                    expect(module[propertyThatTakesDateValue]('2020-02 14:15')).to.contain(
                                        `content="2020-02-01"`
                                    );
                                    expect(module[propertyThatTakesDateValue]('2020-02-23 14:15')).to.contain(
                                        `content="2020-02-23"`
                                    );
                                    expect(module[propertyThatTakesDateValue]('2020-02-23 14:15:16')).to.contain(
                                        `content="2020-02-23"`
                                    );
                                }
                            });
                        });
                    });
                });

                describe('when value is not a valid date string or Date instance', () => {
                    it('should not allow such a value', () => {
                        const buildPath = path.resolve(tempDir.name, testBuildFolder);

                        buildModules({ buildPath, schemaData });

                        return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                            resolvedModules.forEach(({ module }) => {
                                if (moduleHasPropertyThatTakesDateValue(module)) {
                                    const notADatetimeLikeString = 'foo';
                                    const notADateInstanceObject = new URL('http://example.com');

                                    expect(() => module[propertyThatTakesDateValue](notADatetimeLikeString)).to.throw(
                                        'Date type value expected.'
                                    );
                                    expect(() => module[propertyThatTakesDateValue](notADateInstanceObject)).to.throw(
                                        'Date type value expected.'
                                    );
                                }
                            });
                        });
                    });
                });
            });

            describe('DateTime data type', () => {
                const propertyThatTakesDateTimeValue = 'contentReferenceTime';
                const moduleHasPropertyThatTakesDateTimeValue = (module) =>
                    Boolean(module[propertyThatTakesDateTimeValue]);

                describe('when value is a valid, datetime string', () => {
                    it('should return datetime in ISO format honoring UTC', () => {
                        const buildPath = path.resolve(tempDir.name, testBuildFolder);

                        buildModules({ buildPath, schemaData });

                        return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                            resolvedModules.forEach(({ module }) => {
                                if (moduleHasPropertyThatTakesDateTimeValue(module)) {
                                    expect(module[propertyThatTakesDateTimeValue]('2020 14:15')).to.contain(
                                        `content="2020-01-01T14:15:00.000Z"`
                                    );
                                    expect(module[propertyThatTakesDateTimeValue]('2020-02 14:15')).to.contain(
                                        `content="2020-02-01T14:15:00.000Z"`
                                    );
                                    expect(module[propertyThatTakesDateTimeValue]('2020-02-23 14:15')).to.contain(
                                        `content="2020-02-23T14:15:00.000Z"`
                                    );
                                    expect(module[propertyThatTakesDateTimeValue]('2020-02-23 14:15:16')).to.contain(
                                        `content="2020-02-23T14:15:16.000Z"`
                                    );
                                }
                            });
                        });
                    });
                });

                describe('when value is an instance of Date', () => {
                    it('should return date in minus separated format in content attribute honoring UTC', () => {
                        const buildPath = path.resolve(tempDir.name, testBuildFolder);

                        buildModules({ buildPath, schemaData });

                        return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                            resolvedModules.forEach(({ module }) => {
                                if (moduleHasPropertyThatTakesDateTimeValue(module)) {
                                    const date = new Date('2020-01-01 00:00:00');

                                    expect(module[propertyThatTakesDateTimeValue](date)).to.contain(
                                        `content="2020-01-01T00:00:00.000Z"`
                                    );
                                }
                            });
                        });
                    });
                });

                describe('when value is not a valid date string or Date instance', () => {
                    it('should not allow such a value', () => {
                        const buildPath = path.resolve(tempDir.name, testBuildFolder);

                        buildModules({ buildPath, schemaData });

                        return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                            resolvedModules.forEach(({ module }) => {
                                if (moduleHasPropertyThatTakesDateTimeValue(module)) {
                                    const notADatetimeLikeString = 'foo';
                                    const notADateInstanceObject = new URL('http://example.com');

                                    expect(() =>
                                        module[propertyThatTakesDateTimeValue](notADatetimeLikeString)
                                    ).to.throw('DateTime type value expected.');
                                    expect(() =>
                                        module[propertyThatTakesDateTimeValue](notADateInstanceObject)
                                    ).to.throw('DateTime type value expected.');
                                }
                            });
                        });
                    });
                });
            });

            describe('Number data type', () => {
                const propertyThatTakesNumberValue = 'maxValue';
                const moduleHasPropertyThatTakesNumberValue = (module) => Boolean(module[propertyThatTakesNumberValue]);

                it('should return number in content attribute', () => {
                    const buildPath = path.resolve(tempDir.name, testBuildFolder);

                    buildModules({ buildPath, schemaData });

                    return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                        resolvedModules.forEach(({ module }) => {
                            if (moduleHasPropertyThatTakesNumberValue(module)) {
                                expect(module[propertyThatTakesNumberValue](42)).to.contain(`content="42"`);
                                expect(module[propertyThatTakesNumberValue](Math.PI)).to.contain(
                                    `content="${Math.PI}"`
                                );
                            }
                        });
                    });
                });

                describe('when value is not a number', () => {
                    it('should not allow such a value', () => {
                        const buildPath = path.resolve(tempDir.name, testBuildFolder);

                        buildModules({ buildPath, schemaData });

                        return importBuiltModules({ buildPath, schemaData }).then((resolvedModules) => {
                            resolvedModules.forEach(({ module }) => {
                                if (moduleHasPropertyThatTakesNumberValue(module)) {
                                    const notANumber = 'foo';

                                    expect(() => module[propertyThatTakesNumberValue](notANumber)).to.throw(
                                        'Number type value expected.'
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
