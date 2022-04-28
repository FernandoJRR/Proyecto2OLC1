"use strict";
exports.__esModule = true;
exports.ErrorList = void 0;
var ErrorList = /** @class */ (function () {
    function ErrorList() {
        this.errores = [];
        console.log("");
    }
    ErrorList.prototype.agregarError = function (error) {
        this.errores.push(error);
    };
    ErrorList.prototype.agregarErrorParametros = function (lexema, linea, columna, descripcion) {
        this.errores.push(new InterpreterError(lexema, linea, columna, descripcion));
    };
    ErrorList.prototype.toString = function () {
        var errorString = "";
        this.errores.forEach(function (error) {
            errorString += error + "\n";
        });
        return errorString;
    };
    return ErrorList;
}());
exports.ErrorList = ErrorList;
var InterpreterError = /** @class */ (function () {
    function InterpreterError(lexema, linea, columna, descripcion) {
        this.lexema = lexema;
        this.linea = linea;
        this.columna = columna;
        this.descripcion = descripcion;
    }
    InterpreterError.prototype.toString = function () {
        var errorString = "";
        if (typeof this.lexema == null) {
            errorString = "Error en linea: " + this.linea + " y columna: " + this.columna + "\n" + this.descripcion;
        }
        else {
            var lexema = this.lexema;
            if (lexema === "\n") {
                lexema = lexema.replace("\n", "SALTO_DE_LINEA");
            }
            else if (lexema === "\r") {
                lexema = lexema.replace("\r", "RETORNO_DE_CARRO");
            }
            else if (lexema === "\t") {
                lexema = lexema.replace("\t", "TABULACION");
            }
            errorString = "Error con: " + lexema + " en linea: " + this.linea + " y columna: " + this.columna + "\n" + this.descripcion;
        }
        return errorString;
    };
    return InterpreterError;
}());
