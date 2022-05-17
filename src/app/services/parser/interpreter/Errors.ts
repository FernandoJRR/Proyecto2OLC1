import { Nodo, NodoRaiz, Terminal, TipoDato } from "../ast/AST";
import { Token } from "../model/Token";
import { ValorEvaluado } from "./Interpreter";

export class ErrorTipo extends Error {
    tipo: TipoDato
    constructor(mensaje: string, tipo: TipoDato) {
        super(mensaje);
        this.tipo = tipo;
        //Se debe declarar el prototipo
        Object.setPrototypeOf(this, ErrorTipo.prototype);
    }
}

export class ErrorCasteo extends Error {
    tipoOrigen: TipoDato
    tipoDestino: TipoDato
    constructor(mensaje: string, tipoOrigen: TipoDato, tipoDestino: TipoDato) {
        super(mensaje);
        this.tipoOrigen = tipoOrigen;
        this.tipoDestino = tipoDestino;
        //Se debe declarar el prototipo
        Object.setPrototypeOf(this, ErrorCasteo.prototype);
    }
}

export class ErrorTipoOperacion extends Error {
    primerTipo: TipoDato;
    segundoTipo: TipoDato;
    operacion: string;
    posicion: number[];
    constructor(mensaje: string, primerTipo: TipoDato, segundoTipo: TipoDato, operacion: string, posicion:  number[]) {
        super(mensaje);
        this.primerTipo = primerTipo;
        this.segundoTipo = segundoTipo;
        this.operacion = operacion;
        this.posicion = posicion;
        //Se debe declarar el prototipo
        Object.setPrototypeOf(this, ErrorTipoOperacion.prototype);
    }
}

export class ErrorVariableDuplicada extends Error {
    variable: Token;
    constructor(mensaje: string, variable: Token) {
        super(mensaje);
        this.variable = variable;
        //Se debe declarar el prototipo
        Object.setPrototypeOf(this, ErrorVariableDuplicada.prototype);
    }
}

export class ErrorFuncionRetornaVoid extends Error {
    identificador: Token;
    constructor(mensaje: string, identificador: Token) {
        super(mensaje);
        this.identificador = identificador;
        //Se debe declarar el prototipo
        Object.setPrototypeOf(this, ErrorFuncionRetornaVoid.prototype);
    }
}

export class ErrorFuncionInvalida extends Error {
    identificador: Token;
    constructor(mensaje: string, identificador: Token) {
        super(mensaje);
        this.identificador = identificador;
        //Se debe declarar el prototipo
        Object.setPrototypeOf(this, ErrorFuncionInvalida.prototype);
    }
}

export class ErrorVariableNoDefinida extends Error {
    variable: Token;
    constructor(mensaje: string, variable: Token) {
        super(mensaje);
        this.variable = variable;
        //Se debe declarar el prototipo
        Object.setPrototypeOf(this, ErrorVariableNoDefinida.prototype);
    }
}

export class ErrorVariableNoInicializada extends Error {
    variable: Token;
    constructor(mensaje: string, variable: Token) {
        super(mensaje);
        this.variable = variable;
        //Se debe declarar el prototipo
        Object.setPrototypeOf(this, ErrorVariableNoInicializada.prototype);
    }
}

export class ErrorOperacion extends Error {
    valor: ValorEvaluado
    otroValor: ValorEvaluado | undefined
    constructor(mensaje: string, valor: ValorEvaluado, otroValor?: ValorEvaluado) {
        super(mensaje);
        this.valor = valor;
        this.otroValor = otroValor;
        
        //Se debe declarar el prototipo
        Object.setPrototypeOf(this, ErrorOperacion.prototype);
    }
}

export class ErrorCasteoValor extends Error {
    valor: any
    constructor(mensaje: string, valor: any) {
        super(mensaje);
        this.valor = valor;
        
        //Se debe declarar el prototipo
        Object.setPrototypeOf(this, ErrorCasteoValor.prototype);
    }
}