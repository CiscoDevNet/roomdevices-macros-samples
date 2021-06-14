/**
 * Author and Project Lead: Zacharie Gignac
 * Co-Author and Tester: Robert McGonigle 
 * 
 * CIFSS - Université Laval
 * Harvard University Information Technology
 * 
 * Released: November 2020
 * Updated: February 2021
 * 
 * Description; Asynchronous read/write permanent memory
 * 
 * Use: Allow the storage of persistant information while working within the Macro editor of Cisco Video Room Devices
 *  For more information, please refer to the guide at
 *  https://github.com/Bobby-McGonigle/Cisco-RoomDevice-Macro-Projects-Examples/tree/master/Macro%20Memory%20Storage
 */

import xapi from 'xapi';

const config = {
    "storageMacro": "Memory_Storage", //Name for Storage Macro
    "autoImport": {
        "mode": "false", //Use: <true, false, "activeOnly", "custom">
        "customImport": []//Only used when Auto import mode is set to custom
    }
};

var mem = {
    "localScript": module.name
};

function memoryInit() {
    return new Promise((resolve) => {
        xapi.command('macros macro get', {
            Name: config.storageMacro
        }).then(() => {

        }).catch(e => {
            console.warn('Uh-Oh, no storage Macro found, building "' + config.storageMacro);
            xapi.command('macros macro save', {
                Name: config.storageMacro
            },
                `var memory = {\n\t"./_$Info": {\n\t\t"Warning": "Do NOT modify this document, as other Scripts/Macros may rely on this information", \n\t\t"AvailableFunctions": {\n\t\t\t"local": ["mem.read('key')", "mem.write('key', 'value')", "mem.remove('key')", "mem.print()"],\n\t\t\t"global": ["mem.read.global('key')", "mem.write.global('key', 'value')", "mem.remove.global('key')", "mem.print.global()"]\n\t\t},\n\t\t"Guide": "https://github.com/Bobby-McGonigle/Cisco-RoomDevice-Macro-Projects-Examples/tree/master/Macro%20Memory%20Storage"\n\t},\n\t"ExampleKey": "Example Value"\n}`
            ).then(() => {
                mem.print.global();
            });

        });
        resolve();
    });
};

function importMem() {
    return new Promise((resolve) => {
        xapi.command('Macros Macro Get', {
            Content: 'True',
        }).then((event) => {
            let regex = /(\s*import\s*xapi\s*from\s*'xapi'(;|\s*)(\n|\t)*\s*)?(\n*\t*\s*)?(import\s*{\s*mem\s*}\s*from\s*'.\/Memory_Functions'(;|\s*)(\n|\t)*)?(\s*mem.localScript\s*=\s*module.name(;|\s*\n*\t*))?/;
            for (let i = 0; i < event.Macro.length; i++) {
                let searchXapi = event.Macro[i].Content.search(/\s*import\s*xapi\s*from\s*'xapi'/);
                let searchMemFunc = event.Macro[i].Content.search("Memory_Functions");
                let searchlocalScript = event.Macro[i].Content.search(/mem.localScript\s*=\s*module.name;/);
                if (searchXapi < 0 || (searchMemFunc < 0 || searchlocalScript < 0)) {
                    if (event.Macro[i].Name != 'Memory_Functions' && event.Macro[i].Name != config.storageMacro) {
                        switch (config.autoImport.mode) {
                            case true:
                            case "true":
                                console.log("Added \"import { mem } from './Memory_Functions'\" to Macro: " + event.Macro[i].Name);
                                let addImport = event.Macro[i].Content.replace(regex, "import xapi from \'xapi\';\nimport { mem } from \'./Memory_Functions\'; mem.localScript = module.name;\n\n");
                                xapi.command('Macros Macro Save', {
                                    Name: event.Macro[i].Name
                                },
                                    `${addImport}`
                                );
                                break;
                            case false:
                            case "false":

                                break;
                            case 'activeOnly':
                                if (event.Macro[i].Active === 'True') {
                                    console.log("Added \"import { mem } from './Memory_Functions'\" to Macro: " + event.Macro[i].Name);
                                    let addImport = event.Macro[i].Content.replace(regex, "import xapi from \'xapi\';\nimport { mem } from \'./Memory_Functions\'; mem.localScript = module.name;\n\n");
                                    xapi.command('Macros Macro Save', {
                                        Name: event.Macro[i].Name
                                    },
                                        `${addImport}`
                                    )
                                } else {

                                };
                                break;
                            case "custom":
                                for (let q = 0; q < config.autoImport.customImport.length; q++) {
                                    if (event.Macro[i].Name === config.autoImport.customImport[q]) {
                                        console.log("Added \"import { mem } from './Memory_Functions'\" to Macro: " + event.Macro[i].Name);
                                        let addImport = event.Macro[i].Content.replace(regex, "import xapi from \'xapi\';\nimport { mem } from \'./Memory_Functions\'; mem.localScript = module.name;\n\n");
                                        xapi.command('Macros Macro Save', {
                                            Name: event.Macro[i].Name
                                        },
                                            `${addImport}`
                                        )
                                    } else {

                                    };
                                };
                                break;
                            case 'customActive':
                                if (event.Macro[i].Active === 'True') {
                                    for (let q = 0; q < config.autoImport.customImport.length; q++) {
                                        if (event.Macro[i].Name === config.autoImport.customImport[q]) {
                                            console.log("Added \"import { mem } from './Memory_Functions'\" to Macro: " + event.Macro[i].Name);
                                            let addImport = event.Macro[i].Content.replace(regex, "import xapi from \'xapi\';\nimport { mem } from \'./Memory_Functions\'; mem.localScript = module.name;\n\n");
                                            xapi.command('Macros Macro Save', {
                                                Name: event.Macro[i].Name
                                            },
                                                `${addImport}`
                                            )
                                        } else {

                                        };
                                    };
                                } else {

                                };
                                break;
                            default:
                                let error = {
                                    "type": "Configuration Error",
                                    "message": "config.autoImport.mode does not accept \"" + config.autoImport.mode + "\" as a value. Defaulting to false.",
                                    "solution": " Aceepted Values for config.autoImport.mode are [true, false, \"activeOnly\", \"custom\", \"customActive\"] Please change \"" + module.name + "\" config constant on line 23",
                                    "affected_Macro": event.Macro[i].Name
                                };
                                console.error(error);
                                break;
                        }
                    }
                } else {

                };
            };
        });
        resolve();
    });
};

memoryInit().then(() => {
    importMem();
}).catch(e => {
    console.log(e)
});

mem.read = function (key) {
    return new Promise((resolve, reject) => {
        xapi.command('Macros Macro Get', {
            Content: 'True',
            Name: config.storageMacro
        }).then((event) => {
            let raw = event.Macro[0].Content.replace(/var.*memory.*=\s*{/g, '{')
            let store = JSON.parse(raw)
            let temp;
            if (store[mem.localScript] == undefined) {
                store[mem.localScript] = {}
                temp = store[mem.localScript]
            } else {
                temp = store[mem.localScript]
            }
            if (temp[key] != undefined) {
                resolve(temp[key])
            } else {
                reject(new Error('Local Read Error. Object Key: "' + key + '" not found in \'' + config.storageMacro + '\' from script "' + mem.localScript + '"'))
            }
        })
    });
}

mem.read.global = function (key) {
    return new Promise((resolve, reject) => {
        xapi.command('Macros Macro Get', {
            Content: 'True',
            Name: config.storageMacro
        }).then((event) => {
            let raw = event.Macro[0].Content.replace(/var.*memory.*=\s*{/g, '{')
            let store = JSON.parse(raw)
            if (store[key] != undefined) {
                resolve(store[key])
            } else {
                reject(new Error('Glabal Read Error. Object Key: "' + key + '" not found in \'' + config.storageMacro + '\''))
            }
        })
    });
}

mem.write = function (key, value) {
    return new Promise((resolve) => {
        xapi.command('Macros Macro Get', {
            Content: 'True',
            Name: config.storageMacro
        }).then((event) => {
            let raw = event.Macro[0].Content.replace(/var.*memory.*=\s*{/g, '{');
            let store = JSON.parse(raw);
            let temp;
            if (store[mem.localScript] == undefined) {
                store[mem.localScript] = {};
                temp = store[mem.localScript];
            } else {
                temp = store[mem.localScript]
            };
            temp[key] = value;
            store[mem.localScript] = temp;
            let newStore = JSON.stringify(store, null, 4);
            xapi.command('Macros Macro Save', {
                Name: config.storageMacro
            },
                `var memory = ${newStore}`
            ).then(() => {
                console.debug('Local Write Complete => "' + mem.localScript + '" : {"' + key + '" : "' + value + '"}');
                resolve(value);
            });
        });
    });
};

mem.write.global = function (key, value) {
    return new Promise((resolve) => {
        xapi.command('Macros Macro Get', {
            Content: 'True',
            Name: config.storageMacro
        }).then((event) => {
            let raw = event.Macro[0].Content.replace(/var.*memory.*=\s*{/g, '{');
            let store = JSON.parse(raw);
            store[key] = value;
            let newStore = JSON.stringify(store, null, 4);
            xapi.command('Macros Macro Save', {
                Name: config.storageMacro
            },
                `var memory = ${newStore}`
            ).then(() => {
                console.debug('Global Write Complete => "' + config.storageMacro + '" : {"' + key + '" : "' + value + '"}');
                resolve(value);
            });
        });
    });
};

mem.remove = function (key) {
    return new Promise((resolve, reject) => {
        xapi.command('Macros Macro Get', {
            Content: 'True',
            Name: config.storageMacro
        }).then((event) => {
            let raw = event.Macro[0].Content.replace(/var.*memory.*=\s*{/g, '{');
            let store = JSON.parse(raw);
            let temp;
            if (store[mem.localScript] == undefined) {
                store[mem.localScript] = {};
                temp = store[mem.localScript];
            } else {
                temp = store[mem.localScript];
            };
            if (temp[key] != undefined) {
                let track = temp[key];
                delete (temp[key]);
                store[mem.localScript] = temp;
                let newStore = JSON.stringify(store);
                xapi.command('Macros Macro Save', {
                    Name: config.storageMacro
                },
                    `var memory = ${newStore}`
                ).then(() => {
                    console.warn('WARNING: Local Object Key {"' + key + '" : "' + track + '"} has been deleted from ' + config.storageMacro + '. Deletetion occured in script "' + mem.localScript + '"');
                    resolve(key);
                });
            } else {
                reject(new Error('Local Delete Error. Object Key: "' + key + '" not found under Object "' + mem.localScript + '{}" in "' + config.storageMacro + '"'));
            };
        });
    });
};

mem.remove.global = function (key) {
    return new Promise((resolve, reject) => {
        xapi.command('Macros Macro Get', {
            Content: 'True',
            Name: config.storageMacro
        }).then((event) => {
            let raw = event.Macro[0].Content.replace(/var.*memory.*=\s*{/g, '{');
            let store = JSON.parse(raw);
            if (store[key] != undefined) {
                let track = store[key];
                delete (store[key]);
                let newStore = JSON.stringify(store, null, 4);
                xapi.command('Macros Macro Save', {
                    Name: config.storageMacro
                },
                    `var memory = ${newStore}`
                ).then(() => {
                    console.warn('WARNING: Global Object Key {"' + key + '" : "' + track + '"} has been deleted from ' + config.storageMacro + '. Deletetion occured in script "' + mem.localScript + '"');
                    resolve(key);
                });
            } else {
                reject(new Error('Global Delete Error. Object Key: "' + key + '" not found in "' + config.storageMacro + '"'))
            };
        });
    });
};

mem.print = function () {
    return new Promise((resolve, reject) => {
        mem.read.global(mem.localScript).then((log) => {
            console.log(log);
            resolve(log);
        }).catch(e => new Error('Local Print Error: No local key found in "' + config.storageMacro + '"'));
    });
};

mem.print.global = function () {
    return new Promise((resolve, reject) => {
        xapi.command('Macros Macro Get', {
            Content: 'True',
            Name: config.storageMacro
        }).then((event) => {
            let raw = event.Macro[0].Content.replace(/var.*memory.*=\s*{/g, '{');
            let store = JSON.parse(raw);
            console.log(store);
            resolve(store);
        });
    });
};

mem.info = function () {
        mem.read.global("./_$Info").then((log) => {
            console.log(log);
    });
};

export { mem };