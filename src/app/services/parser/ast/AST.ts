import { Token } from "../model/Token";

export class AST{
    raiz: NodoRaiz;
    
    constructor(){
        this.raiz = new NodoRaiz();
    }
    
    recorrer():void {
        interpretar(this.raiz);
    }
    
    obtenerRecorrido(): string{
        return interpretar(this.raiz);
    }
    
    nuevaImportacion(archivo: Terminal){
        let nodoImportacion: NodoInstruccion = new NodoInstruccion(TipoInstruccion.Importacion)
        
        nodoImportacion.agregarHijo(archivo);
        this.raiz.agregarHijo(nodoImportacion);
    }
    
    nuevaIncerteza(expresion: NodoExpresion){
        let nodoIncerteza: NodoInstruccion = new NodoInstruccion(TipoInstruccion.Incerteza);

        nodoIncerteza.agregarHijo(expresion);
        this.raiz.agregarHijo(nodoIncerteza);        
    }
    
    nuevaInstruccion(nodo: NodoInstruccion){
        this.raiz.agregarHijo(nodo);
    }
    
    nuevaDeclaracionVariable(tipo: TerminalTipoDato, identificadores: NodoNoTerminal, expresion?: NodoExpresion | Terminal ){
        let nodoDeclaracion: NodoInstruccion = new NodoInstruccion(TipoInstruccion.DeclaracionVariable);

        nodoDeclaracion.agregarHijo(tipo);
        nodoDeclaracion.agregarHijo(identificadores);
        
        if (expresion != undefined) {
            nodoDeclaracion.agregarHijo(expresion);
        }
        
        this.raiz.agregarHijo(nodoDeclaracion);
    }
    
    nuevaDeclaracionFuncion(tipo: TerminalTipoDato, identificador: Terminal, declaracionParametros?: NodoNoTerminal){
        let nodoDeclaracion = new NodoInstruccion(TipoInstruccion.DeclaracionFuncion);

        nodoDeclaracion.agregarHijo(tipo);
        nodoDeclaracion.agregarHijo(identificador);
        
        if (declaracionParametros != undefined) {
            nodoDeclaracion.agregarHijo(declaracionParametros);
        }

        return nodoDeclaracion;
    }
}

/**
 * Clase dedicada a las utilidades para la produccion de nodos dentro del parser
 */
export class UtilidadesAST{
    //TODO: agregar instrucciones a otras instrucciones

    nuevaDeclaracionVariable(tipo: TerminalTipoDato, identificadores: NodoNoTerminal, expresion?: NodoExpresion | Terminal){
        let nodoDeclaracion: NodoInstruccion = new NodoInstruccion(TipoInstruccion.DeclaracionVariable);

        nodoDeclaracion.agregarHijo(tipo);
        nodoDeclaracion.agregarHijo(identificadores);
        
        if (expresion != undefined) {
            nodoDeclaracion.agregarHijo(expresion);
        }
        
        return nodoDeclaracion;
    }

    nuevaAsignacion(identificador: Terminal, expresion: NodoExpresion|Terminal){
        let nodo = new NodoInstruccion(TipoInstruccion.Asignacion);

        nodo.agregarHijo(identificador);
        nodo.agregarHijo(expresion);
        
        return nodo;
    }

    nuevaInstruccionMostrar(parametros: NodoNoTerminal){
        let nodo = new NodoInstruccion(TipoInstruccion.Mostrar);

        nodo.agregarHijo(parametros);
        return nodo;    
    }

    nuevaInstruccionDibujarAST(identificador: Terminal){
        let nodo = new NodoInstruccion(TipoInstruccion.DibujarExpresion);
        
        nodo.agregarHijo(identificador);
        return nodo;
    }

    nuevaInstruccionDibujarExpresion(expresion: NodoExpresion|Terminal){
        let nodo = new NodoInstruccion(TipoInstruccion.DibujarExpresion);
        
        nodo.agregarHijo(expresion);
        return nodo;
    }

    nuevaInstruccionDibujarTabla(){
        return new NodoInstruccion(TipoInstruccion.DibujarTabla);
    }

    nuevaInstruccionContinuar(terminal: Terminal){
        let nodoContinuar = new NodoInstruccion(TipoInstruccion.Continuar);

        nodoContinuar.agregarHijo(terminal);
        return nodoContinuar;
    }

    nuevaInstruccionDetener(terminal: Terminal){
        let nodoContinuar = new NodoInstruccion(TipoInstruccion.Detener);

        nodoContinuar.agregarHijo(terminal);
        return nodoContinuar;
    }

    nuevaInstruccionRetorno(terminal: Terminal, expresion?: NodoExpresion|Terminal){
        let nodoContinuar = new NodoInstruccion(TipoInstruccion.Retorno);

        nodoContinuar.agregarHijo(terminal);
        
        if (expresion != undefined) {
            nodoContinuar.agregarHijo(expresion);
        }

        return nodoContinuar;
    }

    nuevaInstruccionMientras(condicion: NodoExpresion|Terminal){
        let nodoMientras = new NodoInstruccion(TipoInstruccion.Mientras);

        nodoMientras.agregarHijo(condicion);

        return nodoMientras;
    }

    nuevaInstruccionPara(variableExpresion: NodoNoTerminal, condicion: NodoNoTerminal|Terminal, direccion: Terminal): NodoInstruccion{
        let nodoPara = new NodoInstruccion(TipoInstruccion.Para);

        nodoPara.agregarHijo(variableExpresion);
        nodoPara.agregarHijo(condicion);
        nodoPara.agregarHijo(direccion);

        return nodoPara;
    }

    nuevaInstruccionSi(condicion: NodoExpresion | Terminal): NodoInstruccion{
        let nodoSi = new NodoInstruccion(TipoInstruccion.Si);

        nodoSi.agregarHijo(condicion);

        return nodoSi;
    }

    nuevaCondicionInicial(identificador: Terminal, expresion: NodoExpresion|Terminal): NodoNoTerminal{
        let nodoCondicion = new NodoNoTerminal(TipoNoTerminal.CondicionInicialPara);

        nodoCondicion.agregarHijo(identificador);
        nodoCondicion.agregarHijo(expresion);

        return nodoCondicion;
    }

    nuevaInstruccionSino(): NodoInstruccion{
        return new NodoInstruccion(TipoInstruccion.Sino);
    }

    nuevoTerminal(lexema:string, linea: number, columna: number): Terminal {
        let token: Token = new Token(lexema, linea, columna);
        return new Terminal(token);
    }

    nuevoNodoTipo(tokenTipo: Token, tipoDato: TipoDato): TerminalTipoDato {
        return new TerminalTipoDato(tokenTipo, tipoDato);
    }

    nuevoTerminalDato(lexema: string, linea: number, columna: number, tipoDato: TipoDato): TerminalTipoDato {
        let token: Token = new Token(lexema, linea, columna);
        let terminal: TerminalTipoDato = new TerminalTipoDato(token, tipoDato);

        return terminal;
    }

    nuevasVariables(variables: Terminal[]): NodoNoTerminal {
        let nodoVariables = new NodoNoTerminal(TipoNoTerminal.Identificadores);

        variables.forEach(variable => {
            nodoVariables.agregarHijo(variable);
        });

        return nodoVariables;
    }

    nuevaDeclaracionParametros(declaraciones?: NodoNoTerminal[]): NodoNoTerminal{
        let nodoDeclaraciones = new NodoNoTerminal(TipoNoTerminal.DeclaracionParametros);

        if (declaraciones != null) {
            declaraciones.forEach(declaracion => {
                nodoDeclaraciones.agregarHijo(declaracion);
            });
        }
        
        return nodoDeclaraciones;    
    }

    nuevaDeclaracionParametro(tipo: TerminalTipoDato, identificador: Terminal): NodoNoTerminal{
        let nodoDeclaracion = new NodoNoTerminal(TipoNoTerminal.DeclaracionParametro);
        
        nodoDeclaracion.agregarHijo(tipo);
        nodoDeclaracion.agregarHijo(identificador);
        
        return nodoDeclaracion;
    }

    nuevosParametros(parametros: (NodoExpresion | Terminal)[]): NodoNoTerminal {
        let nodoParametros = new NodoNoTerminal(TipoNoTerminal.Parametros);

        parametros.forEach(parametro => {
            nodoParametros.agregarHijo(parametro);
        });
        
        return nodoParametros;
    }

    nuevaLlamadaFuncion(identificador: Terminal, parametros?: NodoNoTerminal): NodoInstruccion{
        let nodoLlamada = new NodoInstruccion(TipoInstruccion.LlamadaFuncion);    
        
        nodoLlamada.agregarHijo(identificador);
        if (parametros != undefined) {
            nodoLlamada.agregarHijo(parametros);
        }
        
        return nodoLlamada;
    }

    nuevaExpresion(tipoOperacion: TipoExpresionMatematica, expresion: NodoExpresion | NodoNoTerminal | Terminal, 
                                                            expresion2?: NodoExpresion | NodoNoTerminal | Terminal){
        let expresiones: (NodoExpresion|NodoNoTerminal|Terminal)[] = [];
        expresiones.push(expresion);
        if (expresion2 != undefined) {
            expresiones.push(expresion2);
        }
        return new NodoExpresion(tipoOperacion, expresiones);
    }
    
    nuevaExpresionRelacional(tipoOperacion: TipoExpresionRelacional, expresion: NodoExpresion | NodoNoTerminal | Terminal, 
                                                                    expresion2?: NodoExpresion | NodoNoTerminal | Terminal){
                                                                                
        let expresiones: (NodoExpresion|NodoNoTerminal|Terminal)[] = [];
        expresiones.push(expresion);
        if (expresion2 != undefined) {
            expresiones.push(expresion2);
        }
        return new NodoExpresion(tipoOperacion, expresiones);
    }
    
    nuevaExpresionLogica(tipoOperacion: TipoExpresionLogica, expresion: NodoExpresion | NodoNoTerminal | Terminal, 
                                                            expresion2?: NodoExpresion | NodoNoTerminal | Terminal){
                                                                                
        let expresiones: (NodoExpresion|NodoNoTerminal|Terminal)[] = [];
        expresiones.push(expresion);
        if (expresion2 != undefined) {
            expresiones.push(expresion2);
        }
        return new NodoExpresion(tipoOperacion, expresiones);
    }
    
    nuevasInstrucciones(instrucciones: NodoInstruccion[]): NodoNoTerminal{
        let nodoInstrucciones = new NodoNoTerminal(TipoNoTerminal.Instrucciones);

        instrucciones.forEach(instruccion => {
            nodoInstrucciones.agregarHijo(instruccion);
        });

        return nodoInstrucciones;
    }
    
    agregarInstruccionAPadreInstruccion(nodoPadre: NodoInstruccion, nodoHijo: NodoInstruccion){
        let tipoInstruccion = nodoPadre.tipoInstruccion;
        if (tipoInstruccion >= 12 && tipoInstruccion <= 16) {
            if (nodoPadre.hijos[nodoPadre.hijos.length-1] instanceof NodoNoTerminal) {
                if ((nodoPadre.hijos[nodoPadre.hijos.length-1] as NodoNoTerminal).tipoNoTerminal == TipoNoTerminal.Instrucciones) {
                    (nodoPadre.hijos[nodoPadre.hijos.length-1] as NodoNoTerminal).agregarHijo(nodoHijo);
                } else {
                    nodoPadre.agregarHijo(new NodoNoTerminal(TipoNoTerminal.Instrucciones));
                    (nodoPadre.hijos[nodoPadre.hijos.length-1] as NodoNoTerminal).agregarHijo(nodoHijo);
                }
            } else {
                nodoPadre.agregarHijo(new NodoNoTerminal(TipoNoTerminal.Instrucciones));
                (nodoPadre.hijos[nodoPadre.hijos.length-1] as NodoNoTerminal).agregarHijo(nodoHijo);
            }
        }        
        return nodoPadre;
    }
    
    obtenerLineaNodo(nodo: Nodo|Terminal): number{
        if (nodo instanceof Terminal) {
            return (nodo as Terminal).token.linea;
        } else {
            return this.obtenerLineaNodo(nodo.hijos[0]);
        }
    }
}


//Se interpreta el AST nodo por nodo recursivamente
function interpretar(nodo: Nodo | Terminal): string {
    //Se obtiene la clase de nodo que se esta interpretando
    let retornoString = "";
    if (nodo instanceof Nodo) {
        if (nodo instanceof NodoRaiz) {											//se espera la estructura -> hijos: instruccion, instruccion,...,instruccion

            retornoString = "(Programa:\n";
            nodo.hijos.forEach(hijo => {
                retornoString += interpretar(hijo);
            });
            retornoString += ")";
            return retornoString;
            
        } else if (nodo instanceof NodoInstruccion) {
            
            retornoString = "(Instruccion:\n";
            switch (nodo.tipoInstruccion) {
                case TipoInstruccion.Importacion:								//se espera la estructura -> hijos: Terminal(Token(Archivo))
                    
                    let archivo: Token = (nodo.hijos[0] as Terminal).token; 
                    retornoString += "(Importacion:"+archivo.lexema+")\n";
                    break;

                case TipoInstruccion.Incerteza:									//se espera la estructura -> hijos: NodoExpresion

                    let nodoExpresion: NodoExpresion = nodo.hijos[0] as NodoExpresion;
                    retornoString += "(Incerteza:"+interpretar(nodoExpresion)+")\n";
                    break;
                    
                case TipoInstruccion.DeclaracionVariable:						//se espera la estructura -> hijos: TerminalTipodato(TipoDato), NodoNoTerminal(Identificadores) [, NodoExpresion|Terminal]?
                    
                    let tipoDato: string = interpretar(nodo.hijos[0]);
                    let identificadores: string = interpretar(nodo.hijos[1]);
                    retornoString += "(DeclaracionVariable: "+tipoDato+"|Identificadores:"+identificadores;
                    if (nodo.hijos.length === 3) {
                        retornoString += "|Expresion:"+interpretar(nodo.hijos[2]);
                    }
                    retornoString += ")\n";
                    break;
                    
                case TipoInstruccion.Asignacion:                                //se espera la estructura -> hijos: Terminal(Token(Identificador)), NodoExpresion|Terminal
                    let identificador: string = interpretar(nodo.hijos[0]);
                    let valorAsignado: string = interpretar(nodo.hijos[1]);

                    retornoString += "(Asignacion: Identificador:"+identificador+"|Valor:"+valorAsignado;
                    break;
                case TipoInstruccion.DeclaracionFuncion:                        //se espera la estructura -> hijos: TerminalTipoDato(TipoDato), Terminal(Token(Identificador)), [, NodoNoTerminal(DeclaracionParametros)]
                    let tipoDatoFuncion: string = interpretar(nodo.hijos[0]);
                    let identificadorFuncion: string = interpretar(nodo.hijos[1]);
                    let parametrosFuncion: string = "";
                    let instruccionesFuncion: string = "";
                    if (nodo.hijos.length === 3) {
                        parametrosFuncion = interpretar(nodo.hijos[2]);
                    } else if (nodo.hijos.length === 4) {
                        instruccionesFuncion = interpretar(nodo.hijos[3]);
                    }
                    
                    retornoString += "(Declaracion: "+tipoDatoFuncion+"|"+identificadorFuncion+"|Parametros:"+parametrosFuncion+"|Instrucciones:"+instruccionesFuncion;
                    break;
                case TipoInstruccion.LlamadaFuncion:                            //se espera la estructura -> hijos: Terminal(Identificador)[, NodoNoTerminal(Parametros)]
                    let identificadorLlamada = interpretar(nodo.hijos[0]);
                    let parametrosLlamada: string = "";
                    if (nodo.hijos.length == 2) {
                        parametrosLlamada = interpretar(nodo.hijos[1]);
                    }
                    retornoString += "(Llamada: "+identificadorLlamada+"|Parametros:"+parametrosLlamada;
                    break;
                case TipoInstruccion.Continuar:
                    retornoString += "(Continuar)"
                    break;    
                case TipoInstruccion.Detener:
                    retornoString += "(Detener)"
                    break;    
                case TipoInstruccion.Retorno:
                    let valorRetornado = "VOID";
                    if(nodo.hijos.length == 2){
                        valorRetornado = interpretar(nodo.hijos[1]);
                    }
                    retornoString += "(Retorno:"+valorRetornado+")";
                    break;    
                    /*
                case TipoInstruccion.Mostrar:
                    break;
                case TipoInstruccion.DibujarAST:
                    break;
                case TipoInstruccion.DibujarTabla:
                    break;
                case TipoInstruccion.DibujarExpresion:
                    break;
                */
                case TipoInstruccion.Mientras:                                  //se espera la estructura -> hijos: NodoExpresion|Terminal [, Instrucciones]
                    let condicionMientras = interpretar(nodo.hijos[0]);
                    let instruccionesMientras = interpretar(nodo.hijos[1]);
                    retornoString += "(Mientras: Condicion:"+condicionMientras+"|Instrucciones:"+instruccionesMientras;
                    break;
                case TipoInstruccion.Para:                                      //se espera la estructura -> hijos: NodoNoTerminal(CondicionInicialPara(Terminal(Identificador),NodoExpresion|Terminal)), NodoExpresion|Terminal, Terminal [, Instrucciones]
                    let condicionInicial = interpretar(nodo.hijos[0]);
                    let condicion = interpretar(nodo.hijos[1]);
                    let cambio = interpretar(nodo.hijos[2]);
                    let instrucciones = interpretar(nodo.hijos[3]);
                    
                    retornoString += "(Para: CondicionInicial:"+condicionInicial+"|Condicion:"+condicion+"|Cambio:"+cambio+"|Instrucciones:"+instrucciones+"FINPARA";
                    break;
                default:
                    retornoString += "(ERROR";
                    break;
            }
            retornoString += ")\n"
            
        } else if (nodo instanceof NodoExpresion) {
            
            retornoString = "(Expresion:\n";
            switch (nodo.operador) {
                case TipoExpresionMatematica.Suma:
                    retornoString += "["+interpretar(nodo.hijos[0]) + "+" + interpretar(nodo.hijos[1])+"]";
                    break;
                case TipoExpresionMatematica.Resta:
                    retornoString += "["+interpretar(nodo.hijos[0]) + "-" + interpretar(nodo.hijos[1])+"]";
                    break;
                case TipoExpresionMatematica.Multiplicacion:
                    retornoString += "["+interpretar(nodo.hijos[0]) + "*" + interpretar(nodo.hijos[1])+"]";
                    break;
                case TipoExpresionMatematica.Division:
                    retornoString += "["+interpretar(nodo.hijos[0]) + "/" + interpretar(nodo.hijos[1])+"]";
                    break;
                case TipoExpresionMatematica.Modulo:
                    retornoString += "["+interpretar(nodo.hijos[0]) + "%" + interpretar(nodo.hijos[1])+"]";
                    break;
                case TipoExpresionMatematica.Potencia:
                    retornoString += "["+interpretar(nodo.hijos[0]) + "^" + interpretar(nodo.hijos[1])+"]";
                    break;
                case TipoExpresionMatematica.Grupo:
                    retornoString += "[(" + interpretar(nodo.hijos[0]) + ")]";
                    break;
                case TipoExpresionMatematica.MenosUnitario:
                    retornoString += "[-" + interpretar(nodo.hijos[0])+"]";
                    break;
                case TipoExpresionRelacional.MayorQue:
                    retornoString += "["+interpretar(nodo.hijos[0]) + ">" + interpretar(nodo.hijos[1])+"]";
                    break;
                case TipoExpresionRelacional.MenorQue:
                    retornoString += "["+interpretar(nodo.hijos[0]) + "<" + interpretar(nodo.hijos[1])+"]";
                    break;
                case TipoExpresionRelacional.MayorIgualQue:
                    retornoString += "["+interpretar(nodo.hijos[0]) + ">=" + interpretar(nodo.hijos[1])+"]";
                    break;
                case TipoExpresionRelacional.MenorIgualQue:
                    retornoString += "["+interpretar(nodo.hijos[0]) + "<=" + interpretar(nodo.hijos[1])+"]";
                    break;
                case TipoExpresionRelacional.Igualdad:
                    retornoString += "["+interpretar(nodo.hijos[0]) + "==" + interpretar(nodo.hijos[1])+"]";
                    break;
                case TipoExpresionRelacional.Diferencia:
                    retornoString += "["+interpretar(nodo.hijos[0]) + "!=" + interpretar(nodo.hijos[1])+"]";
                    break;
                case TipoExpresionRelacional.Incerteza:
                    retornoString += "["+interpretar(nodo.hijos[0]) + "~" + interpretar(nodo.hijos[1])+"]";
                    break;
                case TipoExpresionLogica.And:
                    retornoString += "["+interpretar(nodo.hijos[0]) + "&&" + interpretar(nodo.hijos[1])+"]";
                    break;
                case TipoExpresionLogica.Or:
                    retornoString += "["+interpretar(nodo.hijos[0]) + "||" + interpretar(nodo.hijos[1])+"]";
                    break;
                case TipoExpresionLogica.Xor:
                    retornoString += "["+interpretar(nodo.hijos[0]) + "|&" + interpretar(nodo.hijos[1])+"]";
                    break;
                case TipoExpresionLogica.Not:
                    retornoString += "[!" + interpretar(nodo.hijos[0])+"]";
                    break;
                default:
                    retornoString += "ERROR";
                    break;
            }
            
            retornoString += ")\n";

        } else if (nodo instanceof NodoNoTerminal) {

            switch (nodo.tipoNoTerminal) {
                case TipoNoTerminal.Identificadores:                            //se espera estructura -> hijos: Terminal(Token(Identificador)),...,Terminal(Token(Identificador))
                    nodo.hijos.forEach(hijo => {
                        retornoString += "("+(hijo as Terminal).token.lexema+")"
                    });
                    break;
                case TipoNoTerminal.DeclaracionParametros:                      //se espera estructura -> hijos: [NodoNoTerminal(DeclaracionParametro),...,NodoNoTerminal(DeclaracionParametro)]
                    nodo.hijos.forEach(hijo => {
                        retornoString += interpretar(hijo)+",";
                    });
                    break;
                case TipoNoTerminal.DeclaracionParametro:                       //Se espera estructura -> hijos: TerminalTipoDato(TipoDato), Terminal(Identificador)
                    let tipoParametro = interpretar(nodo.hijos[0]);
                    let identificadorParametro = interpretar(nodo.hijos[1]);
                    retornoString += "("+tipoParametro+"|"+identificadorParametro+")";
                    break;
                case TipoNoTerminal.Instrucciones:
                    nodo.hijos.forEach(hijo => {
                        retornoString += interpretar(hijo);
                    });
                    retornoString += "\n";
                    break;
                case TipoNoTerminal.Parametros:                                 //se espera estructura -> hijos: NodoExpresion|Terminal,...,NodoExpresion|Terminal
                    nodo.hijos.forEach(hijo => {
                        retornoString += "(Parametro:"+interpretar(hijo)+")"
                    });
                    break;
                case TipoNoTerminal.Instrucciones:
                    console.log(nodo);
                    nodo.hijos.forEach(hijo => {
                        retornoString += "(Instruccion:"+interpretar(hijo)+")"
                    });
                    break;
                case TipoNoTerminal.CondicionInicialPara:
                    let identificadorPara = interpretar(nodo.hijos[0]);
                    let valorAsignado = interpretar(nodo.hijos[1]);
                    retornoString += "Identificador:"+identificadorPara+"|Valor:"+valorAsignado;
                    break;
                default:
                    retornoString += "ERROR";
                    break;
            }
            
        } else {
            retornoString = "ERROR";
        } 
            
    } else if (nodo instanceof Terminal) {
        if (nodo instanceof TerminalTipoDato) {
            if (TipoDato[nodo.tipoDato] === nodo.token.lexema) {
                return "Tipo:"+TipoDato[nodo.tipoDato];
            } else {
                return "Tipo:"+TipoDato[nodo.tipoDato]+"|Lexema:"+nodo.token.lexema;
            }
        } else if (nodo instanceof Terminal) {
            return "Identificador:"+nodo.token.lexema;
        } else {
            retornoString = "ERROR";
        }
        
    } else {
        retornoString = "ERROR";
    }
    
    return retornoString;
}

class Nodo{
    hijos: (Nodo|Terminal)[];   
    
    constructor(){
        this.hijos = [];
    }

    agregarHijo(hijo: Nodo | Terminal){
        this.hijos.push(hijo);       
    }
}

class NodoRaiz extends Nodo{}
class NodoInstruccion extends Nodo{
    tipoInstruccion: TipoInstruccion;

    constructor(tipoInstruccion: TipoInstruccion){
        super();
        this.tipoInstruccion = tipoInstruccion;
    }
}

class NodoExpresion extends Nodo{
    operador: TipoExpresionMatematica | TipoExpresionRelacional | TipoExpresionLogica;
    
    constructor(operador: TipoExpresionMatematica | TipoExpresionRelacional | TipoExpresionLogica, expresiones: (NodoExpresion|NodoNoTerminal|Terminal)[] ){
        super();
        this.operador = operador;
        expresiones.forEach(expresion => {
            super.agregarHijo(expresion);
        });
    }
}

class NodoNoTerminal extends Nodo{
    tipoNoTerminal: TipoNoTerminal;

    constructor(tipoNoTerminal: TipoNoTerminal){
        super();
        this.tipoNoTerminal = tipoNoTerminal;
    }
}

class Terminal {
    token: Token

    constructor(token: Token){
        this.token = token;
    }
}

class TerminalTipoDato extends Terminal{
    tipoDato: TipoDato;

    constructor(token: Token, tipoDato: TipoDato){
        super(token);
        this.tipoDato = tipoDato;
    }
}

//Cada tipo tiene asignada un booleano que indica si puede tener mas instrucciones dentro o no
enum TipoInstruccion{
    //Instrucciones que NO pueden tener mas instrucciones anidadas 0-11
    Importacion,
    Incerteza,
    DeclaracionVariable,
    LlamadaFuncion,
    Asignacion,
    Continuar,
    Detener,
    Retorno,
    DibujarTabla,
    DibujarAST,
    DibujarExpresion,
    Mostrar,
    
    //Instrucciones que pueden tener mas instrucciones anidadas 12-16
    DeclaracionFuncion,
    Si,                     //Si puede tener al final del todo una instruccion SINO
    Sino,                   //Solo puede existir una instruccion sino si esta complementa una instruccion SI
    Mientras,
    Para,
}

enum TipoNoTerminal{
    Parametros,    
    Identificadores,
    DeclaracionParametro,
    DeclaracionParametros,
    CondicionInicialPara,
    
    Instrucciones
}


enum TipoDato{
    Int,    //0
    Double,     //1
    String,     //2
    Char,       //3
    Boolean,    //4
    Void        //5
}

enum TipoExpresionMatematica{
    Suma="SUMA",                        //Se espera -> expresion SUMA expresion
    Resta="RESTA",                      //Se espera -> expresion RESTA expresion
    Multiplicacion="MULTIPLICACION",    //Se espera -> expresion MULTIPLICACION expresion
    Division="DIVISION",                //Se espera -> expresion DIVISION expresion
    Modulo="MODULO",                    //Se espera -> expresion MODULO expresion
    Potencia="POTENCIA",                //Se espera -> expresion POTENCIA expresion
    MenosUnitario="MENOS_U",            //Se espera -> RESTA expresion
    Grupo="GRUPO"                       //Se espera -> PAR_IZQ expresion PAR_DER
}

enum TipoExpresionRelacional{
    MayorQue="MAYOR_QUE",               //Se espera -> expresion MAYOR_QUE expresion
    MenorQue="MENOR_QUE",               //Se espera -> expresion MENOR_QUE expresion
    MayorIgualQue="MAYOR_IGUAL_QUE",    //Se espera -> expresion MAYOR_IGUAL_QUE expresion
    MenorIgualQue="MENOR_IGUAL_QUE",    //Se espera -> expresion MENOR_IGUAL_QUE expresion
    Igualdad="IGUALDAD",                //Se espera -> expresion IGUALDAD expresion
    Diferencia="DIFERENCIA",            //Se espera -> expresion DIFERENCIA expresion
    Incerteza="INCERTEZA"               //Se espera -> expresion INCERTEZA expresion
}

enum TipoExpresionLogica{
    And="AND",      //Se espera -> expresion AND expresion
    Xor="XOR",      //Se espera -> expresion XOR expresion
    Or="OR",        //Se espera -> expresion OR expresion
    Not="NOT"       //Se espera -> NOT expresion
}