"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MainClass = void 0;
const fs = __importStar(require("fs"));
const xlsx = __importStar(require("node-xlsx"));
const { app, BrowserWindow } = require("electron");
class MainClass {
    createMapXslx() {
        let curWorkFilePath = process.cwd();
        let mapDataPath = curWorkFilePath + MainClass.MAP_FILES_PATH;
        let isHavePath = fs.existsSync(mapDataPath);
        if (!isHavePath) {
            console.log("ERR:MapData folder not found, please create {mapData} folder");
            return;
        }
        let mapFileList = this._getAllMapList(mapDataPath);
        if (!mapFileList || mapFileList.length === 0) {
            console.log("Mapdata not found in mapdata directory:", mapFileList);
            return;
        }
        mapFileList.forEach((filePath, index) => {
            let mapData = {};
            fs.readFile(`${mapDataPath}/${filePath}`, "utf-8", (err, data) => {
                if (err) {
                    console.log(err);
                    return;
                }
                mapData = data;
                let mapName = filePath.replace(".json", "");
                this._setNewXlsx(mapData, mapName);
            });
        });
    }
    _getAllMapList(path) {
        let mapFileList = fs.readdirSync(path);
        return mapFileList;
    }
    _resolveMapData(mapdata) {
        let mapdataObj = JSON.parse(mapdata);
        let mapLayerData = mapdataObj.layers[0];
        let areaLayerData = mapdataObj.layers[1];
        let bornLayerData = mapdataObj.layers[2];
        let tiledEventIDMap = new Map();
        let tiledBronTypeMap = new Map();
        let tiledRegionTypeMap = new Map();
        mapdataObj.tilesets.forEach((tileSetData, index) => {
            let firstGid = tileSetData.firstgid;
            for (let mapId in tileSetData.tileproperties) {
                let data = tileSetData.tileproperties[mapId];
                if (!data) {
                    console.log("Block ID Repeatedly failed to obtain block data. Block ID:", mapId);
                    continue;
                }
                let globalGid = parseInt(mapId) + firstGid;
                if (tiledEventIDMap.has(globalGid)) {
                    console.log("The block ID is repeated", globalGid);
                    continue;
                }
                if (data.hasOwnProperty("id")) {
                    tiledEventIDMap.set(globalGid, parseInt(data.id));
                    continue;
                }
                if (data.hasOwnProperty("bron")) {
                    tiledBronTypeMap.set(globalGid, parseInt(data.bron));
                    continue;
                }
                if (data.hasOwnProperty("quyu")) {
                    tiledRegionTypeMap.set(globalGid, parseInt(data.quyu));
                    continue;
                }
            }
        });
        let finalData = [];
        let layerWidth = mapLayerData.width;
        let layerHeight = mapLayerData.height;
        if (!mapLayerData) {
            return;
        }
        mapLayerData.data.forEach((id, index) => {
            let tileData = [];
            tileData[0] = index + 1;
            let tileX = index % layerWidth;
            let tileY = Math.floor(index / layerWidth);
            tileData[1] = `${tileX},${tileY}`;
            if (!tiledEventIDMap.has(id)) {
                tileData[2] = 0;
            }
            else {
                tileData[2] = tiledEventIDMap.get(id);
            }
            finalData.push(tileData);
        });
        if (!bornLayerData) {
            return finalData;
        }
        bornLayerData.data.forEach((id, index) => {
            let tileData = finalData[index];
            if (!tiledBronTypeMap.has(id)) {
                tileData[3] = 0;
            }
            else {
                tileData[3] = tiledBronTypeMap.get(id);
            }
        });
        if (!areaLayerData) {
            return finalData;
        }
        areaLayerData.data.forEach((id, index) => {
            let tileData = finalData[index];
            if (!tiledRegionTypeMap.has(id)) {
                tileData[4] = 0;
            }
            else {
                tileData[4] = tiledRegionTypeMap.get(id);
            }
        });
        return finalData;
    }
    _setNewXlsx(mapData, mapName) {
        let data = [
            ["id=int", "coordinate=string", "evenId=int", "region=int", "bron=int"],
            ["id", "坐标", "地块事件id，对应事件表", "所属区域", "出生点类型(0：障碍物，1：区域1，2：区域2，3：区域3)"],
        ];
        let layerData = this._resolveMapData(mapData);
        if (!layerData) {
            return;
        }
        data = data.concat(layerData);
        let arrayBuffer = xlsx.build([
            {
                name: "t_s_sydg_map",
                data: data,
            },
        ]);
        let buffer = Buffer.from(arrayBuffer);
        let curWorkFilePath = process.cwd();
        let outPath = curWorkFilePath + MainClass.XLSX_FILES_PATH;
        let isHavePath = fs.existsSync(outPath);
        if (!isHavePath) {
            console.log("There is no table export directory; it has been created", outPath);
            fs.mkdir(outPath, null, (err, path) => {
                if (err) {
                    console.log(err);
                    return;
                }
                fs.writeFile(`${outPath}/${mapName}` + MainClass.OUT_XLSX_NAME, buffer, null, (err) => {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    console.log(`Map file:${mapName}Creating a successful`);
                });
            });
            return;
        }
        fs.writeFile(`${outPath}/${mapName}` + MainClass.OUT_XLSX_NAME, buffer, null, (err) => {
            if (err) {
                console.log(err);
                return;
            }
            console.log(`form document${mapName}Creating a successful`);
        });
    }
}
exports.MainClass = MainClass;
MainClass.MAP_FILES_PATH = "/mapData";
MainClass.XLSX_FILES_PATH = "/outXlsx";
MainClass.OUT_XLSX_NAME = ".xlsx";
