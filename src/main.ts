// import * as electron from "electron";
import * as fs from "fs";
import * as xlsx from "node-xlsx";
const { app, BrowserWindow } = require("electron");

export class MainClass {
	private static MAP_FILES_PATH = "/mapData";
	private static XLSX_FILES_PATH = "/outXlsx";
	private static OUT_XLSX_NAME = ".xlsx";

	// private _win: any;

	// public createWindow() {
	// 	let curWorkFilePath = process.cwd();
	// 	// 创建浏览器窗口.
	// 	this._win = new BrowserWindow({ width: 800, height: 600, autoHideMenuBar: true });

	// 	this._win.setMenu(null);

	// 	// 加载项目的index.html文件.
	// 	// this._win.loadURL(
	// 	// 	url.format({
	// 	// 		pathname: curWorkFilePath + "index.html",
	// 	// 		protocol: "file:",
	// 	// 		// 当窗口关闭时候的事件.
	// 	// 		slashes: true,
	// 	// 	})
	// 	// );

	// 	// 打开开发工具.
	// 	this._win.webContents.openDevTools();
	// 	this.createMapXslx();

	// 	this._win.on("closed", () => {
	// 		// 取消引用窗口对象, 如果你的应用程序支持多窗口，通常你会储存windows在数组中，这是删除相应元素的时候。
	// 		console.log("haha");

	// 		this._win = null;
	// 	});
	// }

	public createMapXslx() {
		let curWorkFilePath = process.cwd();
		let mapDataPath = curWorkFilePath + MainClass.MAP_FILES_PATH;

		let isHavePath = fs.existsSync(mapDataPath);
		if (!isHavePath) {
			console.log("ERR:MapData folder not found, please create {mapData} folder");
			return;
		}
		let mapFileList: string[] = this._getAllMapList(mapDataPath);

		if (!mapFileList || mapFileList.length === 0) {
			console.log("Mapdata not found in mapdata directory:", mapFileList);
			return;
		}
		mapFileList.forEach((filePath: string, index: number) => {
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

	private _getAllMapList(path): string[] {
		let mapFileList: string[] = fs.readdirSync(path);
		return mapFileList;
	}

	// 解析地图数据
	private _resolveMapData(mapdata: any) {
		let mapdataObj = JSON.parse(mapdata);
		// 地图层
		let mapLayerData = mapdataObj.layers[0];
		// 区域层
		let areaLayerData = mapdataObj.layers[1];
		// 出生点层
		let bornLayerData = mapdataObj.layers[2];

		// ---------------------gId---eventId-----
		let tiledEventIDMap = new Map<number, number>();
		// ---------------------gId---bronType-----
		let tiledBronTypeMap = new Map<number, number>();
		// ---------------------gId---RegionType-----
		let tiledRegionTypeMap = new Map<number, number>();
		mapdataObj.tilesets.forEach((tileSetData, index) => {
			// console.log("atlasData: ", tileSetData);
			let firstGid = tileSetData.firstgid;
			for (let mapId in tileSetData.tileproperties) {
				let data = tileSetData.tileproperties[mapId];
				if (!data) {
					// console.log("获取图块数据失败，图块id：", mapId);
					console.log("Block ID Repeatedly failed to obtain block data. Block ID:", mapId);
					continue;
				}
				let globalGid = parseInt(mapId) + firstGid;
				if (tiledEventIDMap.has(globalGid)) {
					// console.log("图块id重复", globalGid);
					console.log("The block ID is repeated", globalGid);
					continue;
				}
				if (data.hasOwnProperty("id")) {
					// console.log("图块数据中没有id数据");
					// console.log("There is no ID data in the block data");
					tiledEventIDMap.set(globalGid, parseInt(data.id));
					continue;
				}
				if (data.hasOwnProperty("bron")) {
					// console.log("图块数据中没有id数据");
					// console.log("There is no ID data in the block data");
					tiledBronTypeMap.set(globalGid, parseInt(data.bron));
					continue;
				}
				if (data.hasOwnProperty("quyu")) {
					// console.log("图块数据中没有id数据");
					// console.log("There is no ID data in the block data");
					tiledRegionTypeMap.set(globalGid, parseInt(data.quyu));
					continue;
				}
			}
		});
		// console.log("tiledIdMap", tiledEventIDMap);
		// console.log("tiledBronTypeMap", tiledBronTypeMap);
		// console.log("tiledRegionTypeMap", tiledRegionTypeMap);
		let finalData = [];
		let layerWidth = mapLayerData.width;
		let layerHeight = mapLayerData.height;

		if (!mapLayerData) {
			return;
		}
		// 地图数据
		mapLayerData.data.forEach((id: number, index: number) => {
			let tileData = [];
			tileData[0] = index + 1; //id
			let tileX = index % layerWidth;
			let tileY = Math.floor(index / layerWidth);
			tileData[1] = `${tileX},${tileY}`; //坐标
			// if (id === 0) {
			// 	return;
			// }
			if (!tiledEventIDMap.has(id)) {
				// console.log("该图块暂未配置数据，如有需要，请核查，gid:", id);
				tileData[2] = 0; //事件id
			} else {
				tileData[2] = tiledEventIDMap.get(id);
			}
			finalData.push(tileData);
		});
		if (!bornLayerData) {
			return finalData;
		}
		// 出生点数据
		bornLayerData.data.forEach((id: number, index: number) => {
			let tileData = finalData[index];
			if (!tiledBronTypeMap.has(id)) {
				// console.log("该图块暂未配置数据，如有需要，请核查，gid:", id);
				tileData[3] = 0; //出生点
			} else {
				tileData[3] = tiledBronTypeMap.get(id);
			}
		});
		if (!areaLayerData) {
			return finalData;
		}
		// 所属区域数据
		areaLayerData.data.forEach((id: number, index: number) => {
			let tileData = finalData[index];
			if (!tiledRegionTypeMap.has(id)) {
				// console.log("该图块暂未配置数据，如有需要，请核查，gid:", id);
				tileData[4] = 0; //所属区域
			} else {
				tileData[4] = tiledRegionTypeMap.get(id);
			}
		});
		return finalData;
	}

	private _setNewXlsx(mapData: any, mapName: string) {
		// let data = [];
		let data = [
			["id=int", "coordinate=string", "evenId=int", "region=int", "bron=int"],
			["id", "坐标", "地块事件id，对应事件表", "所属区域", "出生点类型(0：障碍物，1：区域1，2：区域2，3：区域3)"],
		];
		let layerData = this._resolveMapData(mapData);
		if (!layerData) {
			return;
		}
		data = data.concat(layerData);
		// 设置数据
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
				//将文件内容插入新的文件中
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
		//将文件内容插入新的文件中
		fs.writeFile(`${outPath}/${mapName}` + MainClass.OUT_XLSX_NAME, buffer, null, (err) => {
			if (err) {
				console.log(err);
				return;
			}
			console.log(`form document${mapName}Creating a successful`);
		});
	}
}
