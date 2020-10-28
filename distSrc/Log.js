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
exports.Log = void 0;
const util = __importStar(require("util"));
var LEVEL = {
    ALL: Infinity,
    INFO: 3,
    WARN: 2,
    ERROR: 1,
    NONE: -Infinity,
};
var COLOR = {
    RESET: "\u001b[0m",
    INFO: "\u001b[32m",
    WARN: "\u001b[33m",
    ERROR: "\u001b[31m",
};
var globalLevel = LEVEL.ALL;
var coloredOutput = true;
class Log {
    static info(format, ...param) {
        if (LEVEL.INFO <= globalLevel) {
            Log._log(LEVEL.INFO, util.format(format, ...param));
        }
    }
    static warn(format, ...param) {
        if (LEVEL.WARN <= globalLevel) {
            Log._log(LEVEL.WARN, util.format(format, ...param));
        }
    }
    static error(format, ...param) {
        if (LEVEL.ERROR <= globalLevel) {
            Log._log(LEVEL.ERROR, util.format(format, ...param));
        }
    }
    static _newPrepareStackTrace(error, structuredStack) {
        return structuredStack;
    }
    static _getCurTime() {
        var now = new Date();
        var getFullYear = now.getFullYear();
        var getMonth = now.getMonth() + 1;
        var getDate = now.getDate();
        var getHours = now.getHours();
        var getMinutes = now.getMinutes();
        var getSeconds = now.getSeconds();
        var getMilliseconds = now.getMilliseconds();
        var timeStr = getFullYear + "" + getMonth + "" + getDate + " " + getHours + ":" + getMinutes + ":" + getSeconds + " " + getMilliseconds;
        return timeStr;
    }
    static _log(level, message) {
        var oldPrepareStackTrace = Error.prepareStackTrace;
        Error.prepareStackTrace = Log._newPrepareStackTrace;
        var structuredStack = new Error().stack;
        Error.prepareStackTrace = oldPrepareStackTrace;
        var caller = structuredStack[2];
        var lineSep = process.platform == "win32" ? "\\" : "/";
        var fileNameSplited = caller.getFileName().split(lineSep);
        var fileName = fileNameSplited[fileNameSplited.length - 1];
        var lineNumber = caller.getLineNumber();
        var columnNumber = caller.getColumnNumber();
        var curTime = Log._getCurTime();
        var levelString;
        switch (level) {
            case LEVEL.INFO:
                levelString = "[INFO]";
                break;
            case LEVEL.WARN:
                levelString = "[WARN]";
                break;
            case LEVEL.ERROR:
                levelString = "[ERROR]";
                break;
            default:
                levelString = "[]";
                break;
        }
        var output = util.format("%s%s %s(%d) %s", curTime, levelString, fileName, lineNumber, message);
        if (!coloredOutput) {
            console.log(output);
        }
        else {
            switch (level) {
                case LEVEL.INFO:
                    console.log(COLOR.INFO, output, COLOR.RESET);
                    break;
                case LEVEL.WARN:
                    console.log(COLOR.WARN, output, COLOR.RESET);
                    break;
                case LEVEL.ERROR:
                    console.log(COLOR.ERROR, output, COLOR.RESET);
                    break;
                default:
                    break;
            }
        }
    }
}
exports.Log = Log;
