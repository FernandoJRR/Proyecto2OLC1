import { ControlConsola } from "src/app/app.component";
import { AST, Nodo, NodoExpresion, NodoInstruccion, NodoNoTerminal, NodoRaiz, Terminal, TerminalTipoDato, TipoDato, TipoExpresionLogica, TipoExpresionMatematica, TipoExpresionRelacional, TipoInstruccion, TipoNoTerminal, UtilidadesAST } from "../ast/AST";
import { ErrorList } from "../manejo_error/ErrorList";
import { Token } from "../model/Token";
import { Atributo, AtributoFuncion, AtributoMostrar, AtributoVariable, TablaDeSimbolos } from "../tabla_de_simbolos/TablaDeSimbolos";
import { ErrorCasteo, ErrorCasteoValor, ErrorFuncionInvalida, ErrorFuncionRetornaVoid, ErrorOperacion, ErrorTipo, ErrorTipoOperacion, ErrorVariableNoDefinida, ErrorVariableNoInicializada } from "./Errors";
import { TablaCasteo } from "./SemanticAnalyzer";

export class Interpreter{
    ast: AST;
    tablaDeSimbolos: TablaDeSimbolos;    
    
    scopeActual: TablaDeSimbolos;
    retornoActual: TipoDato[] = [];
    
    output: ControlConsola;
    
    listaErrores: ErrorList;
    utilidaddes: UtilidadesAST;
    
    scopeCounter: number[] = []
    imprimirScope: boolean[] = []
    
    listadoAST: any[];
    listadoTablas: any[];
    dibujosExpresiones: any[];

    constructor(ast: AST, tablaDeSimbolos: TablaDeSimbolos, output: ControlConsola, listaErrores: ErrorList, listadosDibujos: any[]){
        this.ast = ast;
        this.tablaDeSimbolos = tablaDeSimbolos;
        this.scopeActual = tablaDeSimbolos;
        this.listaErrores = listaErrores;        
        this.utilidaddes = new UtilidadesAST;        
        this.output = output;
    
        this.listadoAST = listadosDibujos[0];
        this.listadoTablas = listadosDibujos[1];
        this.dibujosExpresiones = listadosDibujos[2];
    }
    
    cambiar_imprimir_scope_actual(){
        this.imprimirScope.pop()
        this.imprimirScope.push(true)
    }
    
    generarTablaScopeActual(){
        let tablaString = this.scopeActual.generarTablaString();
        this.listadoTablas.push(tablaString);        
    }
    
    aumentar_scope_actual(){
        let valor = this.scopeCounter.pop();
        if (valor != undefined) {
            this.scopeCounter.push(valor+1);
        }
    }
    
    reset_counter_actual(){
        this.scopeCounter.pop();
        this.scopeCounter.push(0);
    }
    
    peek_scope(){
        return this.scopeCounter[this.scopeCounter.length-1];
    }
    
    interpretar_ast(){
        let accion = this.interpretar(this.ast.raiz);
        if (accion != undefined) {
            return accion;
        }        
        return undefined;        
    }

    
    interpretar(nodo: Nodo|Terminal): object[]|undefined{
        if (nodo instanceof Nodo) {
            if (nodo instanceof NodoRaiz) {
                this.interpretar_raiz(nodo as NodoRaiz);
            } else if (nodo instanceof NodoInstruccion) {
                switch (nodo.tipoInstruccion) {
                    case TipoInstruccion.Importacion:
                        //pendiente
                        break;
                    case TipoInstruccion.Incerteza:
                        this.interpretar_incerteza(nodo);
                        break;
                    case TipoInstruccion.DeclaracionVariable:
                        this.interpretar_declaracion_variable(nodo);
                        break;
                    case TipoInstruccion.Asignacion:
                        this.interpretar_asignacion(nodo);
                        break;
                    case TipoInstruccion.DeclaracionFuncion:
                        let accion = this.interptretar_declaracion_funcion(nodo);
                        if (accion != undefined) {
                            return accion;
                        }
                        break;
                    default:
                        break;
                }
            }
        }
        return undefined;
    }
    
    interpretar_raiz(nodo: NodoRaiz){
        //Acciones Preorden
        this.scopeCounter.push(0)
        this.imprimirScope.push(false)
        
        //Se cambia el scope actual al scope global
        this.scopeActual = this.tablaDeSimbolos;
        
        //Acciones Inorden
        for (let i = 0; i < nodo.hijos.length; i++) {
            const hijo = nodo.hijos[i];
            let accion = this.interpretar(hijo);
            if (accion != undefined) {
                return accion;
            }            
        }
        
        //Acciones Postorden
        if (this.imprimirScope[this.imprimirScope.length-1]) {
            this.generarTablaScopeActual();
        }
        this.imprimirScope.pop()
        this.scopeCounter.pop()
        return undefined;
    }

    interpretar_incerteza(nodo: NodoInstruccion){
        try{
            let valor: ValorEvaluado = this.interpretar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal));
            let valorCasteado = Caster.castear_valor_evaluado(valor.tipo, TipoDato.Double, valor);
            if (valorCasteado.valor < 0) {
                this.listaErrores.agregarErrorParametros("Incerteza", this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo), "El grado de incerteza tiene que ser mayor o igual a 0");
            } else {
                this.scopeActual.update_valor_variable("@incerteza", valorCasteado.valor);
            }
        } catch (error) {
            if (error instanceof ErrorTipoOperacion) {
                let lineaError = error.posicion[0]
                let columnaError = error.posicion[1]
                let primerTipo = TipoDato[error.primerTipo];
                let segundoTipo = TipoDato[error.segundoTipo];
                let operacion = error.operacion;
                this.listaErrores.agregarErrorParametros("INCERTEZA, EXPRESION", lineaError, columnaError, "La expresion tiene una operacion "+operacion+" entre un:"+primerTipo+" y un "+segundoTipo+", lo cual no es posible");
            } else if (error instanceof ErrorVariableNoDefinida) {
                this.listaErrores.agregarErrorParametros(error.variable.lexema, error.variable.linea, error.variable.columna, "La variable no ha sido declarada al momento de intentar evaluarla");
            } else if (error instanceof ErrorVariableNoInicializada) {
                this.listaErrores.agregarErrorParametros(error.variable.lexema, error.variable.linea, error.variable.columna, "La variable puede no haber sido inicializada al momento de intentar evaluarla");
            } else if (error instanceof ErrorFuncionInvalida) {
                this.listaErrores.agregarErrorParametros(error.identificador.lexema, error.identificador.linea, error.identificador.columna, "La funcion ingresada tiene errores por lo que no se pudo determinar su tipo");
            } else if (error instanceof ErrorFuncionRetornaVoid) {
                this.listaErrores.agregarErrorParametros(error.identificador.lexema, error.identificador.linea, error.identificador.columna, error.message);
            } else {
                console.log(error)
            }
        }
    }
    
    interpretar_declaracion_variable(nodo: NodoInstruccion){
        let tipoDato: TipoDato = (nodo.hijos[0] as TerminalTipoDato).tipoDato;
        let identificadores: Token[] = this.obtener_terminales_variables(nodo.hijos[1] as NodoNoTerminal);
        let valorExpresion: ValorEvaluado;
        
        if (nodo.hijos.length === 3) {
            try{
                valorExpresion = this.interpretar_expresion(nodo.hijos[2] as NodoExpresion|Terminal);    

                let valorCasteado: ValorEvaluado = Caster.castear_valor_evaluado(valorExpresion.tipo, tipoDato, valorExpresion);
            
                identificadores.forEach(identificador => {
                    this.scopeActual.update_valor_variable(identificador.lexema, valorCasteado.valor);
                });
                
            } catch (error) {
                if (error instanceof ErrorTipoOperacion) {
                    let lineaError = error.posicion[0]
                    let columnaError = error.posicion[1]
                    let primerTipo = TipoDato[error.primerTipo];
                    let segundoTipo = TipoDato[error.segundoTipo];
                    let operacion = error.operacion;
                    this.listaErrores.agregarErrorParametros("DECLARACION_VARIABLES, EXPRESION", lineaError, columnaError, "La expresion tiene una operacion "+operacion+" entre un:"+primerTipo+" y un "+segundoTipo+", lo cual no es posible");
                } else if (error instanceof ErrorVariableNoDefinida) {
                    this.listaErrores.agregarErrorParametros(error.variable.lexema, error.variable.linea, error.variable.columna, "La variable no ha sido declarada al momento de intentar evaluarla");
                } else if (error instanceof ErrorVariableNoInicializada) {
                    this.listaErrores.agregarErrorParametros(error.variable.lexema, error.variable.linea, error.variable.columna, "La variable puede no haber sido inicializada al momento de intentar evaluarla");
                } else if (error instanceof ErrorFuncionInvalida) {
                    this.listaErrores.agregarErrorParametros(error.identificador.lexema, error.identificador.linea, error.identificador.columna, "La funcion ingresada tiene errores por lo que no se pudo determinar su tipo");
                } else if (error instanceof ErrorFuncionRetornaVoid) {
                    this.listaErrores.agregarErrorParametros(error.identificador.lexema, error.identificador.linea, error.identificador.columna, error.message);
                } else {
                    console.log(error);
                }
            }
        }
    }

    obtener_terminales_variables(nodo: NodoNoTerminal){
        let tokens: Token[] = []
        nodo.hijos.forEach(hijo => {
            tokens.push((hijo as Terminal).token);
        });    
        return tokens;        
    }

    interpretar_asignacion(nodo: NodoInstruccion){
        let tokenVariable: Token = (nodo.hijos[0] as Terminal).token;
        //Se comprueba si la variable a la que se quiere asignar existe y si existe se obtiene su tipo
        let variable: Atributo|undefined = this.scopeActual.lookup(tokenVariable.lexema);
        if (variable == undefined) {
            this.listaErrores.agregarErrorParametros(tokenVariable.lexema, tokenVariable.linea, tokenVariable.columna, "La variable no ha sido declarada al momento de intentar evaluarla");
        } else {
            try{
                let valorExpresion: ValorEvaluado = this.interpretar_expresion(nodo.hijos[1] as (NodoExpresion|Terminal));
                
                let valorCasteado: ValorEvaluado = Caster.castear_valor_evaluado(valorExpresion.tipo, valorExpresion.tipo, valorExpresion);
            
                this.scopeActual.update_valor_variable(tokenVariable.lexema, valorCasteado.valor);
            } catch (error) {
                if (error instanceof ErrorTipoOperacion) {
                    let lineaError = error.posicion[0]
                    let columnaError = error.posicion[1]
                    let primerTipo = TipoDato[error.primerTipo];
                    let segundoTipo = TipoDato[error.segundoTipo];
                    let operacion = error.operacion;
                    this.listaErrores.agregarErrorParametros("ASIGNACION_VARIABLE, EXPRESION", lineaError, columnaError, "La expresion tiene una operacion "+operacion+" entre un:"+primerTipo+" y un "+segundoTipo+", lo cual no es posible");
                } else if (error instanceof ErrorVariableNoDefinida) {
                    this.listaErrores.agregarErrorParametros(error.variable.lexema, error.variable.linea, error.variable.columna, "La variable no ha sido declarada al momento de intentar evaluarla");
                } else if (error instanceof ErrorVariableNoInicializada) {
                    this.listaErrores.agregarErrorParametros(error.variable.lexema, error.variable.linea, error.variable.columna, "La variable puede no haber sido inicializada al momento de intentar evaluarla");
                } else if (error instanceof ErrorFuncionInvalida) {
                    this.listaErrores.agregarErrorParametros(error.identificador.lexema, error.identificador.linea, error.identificador.columna, "La funcion ingresada tiene errores por lo que no se pudo determinar su tipo");
                } else if (error instanceof ErrorFuncionRetornaVoid) {
                    this.listaErrores.agregarErrorParametros(error.identificador.lexema, error.identificador.linea, error.identificador.columna, error.message);
                }
            }
        }
        
    }
    
    interptretar_declaracion_funcion(nodo: NodoInstruccion): object[]|undefined {
        this.scopeActual = this.scopeActual.nested_scopes[this.peek_scope()];
        this.scopeCounter.push(0);
        this.imprimirScope.push(false);

        let tipoRetorno: TipoDato = (nodo.hijos[0] as TerminalTipoDato).tipoDato;
        let tokenIdentificador: Token = (nodo.hijos[1] as Terminal).token;
        

        if (tokenIdentificador.lexema === "Principal") {
            //Si se encuentra la funcion Principal se ejecutan sus instrucciones
            this.retornoActual.push(tipoRetorno)
            if (nodo.hijos[3] != undefined) {
                let accion = this.interpretar_instrucciones(nodo.hijos[3] as NodoNoTerminal);
                if (accion != undefined && Array.isArray(accion)) {
                    return accion;
                }
            }        
            this.retornoActual.pop();
        }
        
        if (this.imprimirScope[this.imprimirScope.length-1]) {
            this.generarTablaScopeActual();
        }
        this.imprimirScope.pop()
        this.scopeActual = this.scopeActual.parent_scope!;
        this.scopeCounter.pop();
        this.aumentar_scope_actual();
        return undefined;
    }

    interpretar_instrucciones(nodo: NodoNoTerminal){
        for (let i = 0; i < nodo.hijos.length; i++) {
            const instruccion = nodo.hijos[i];
            
            let retornado = this.interpretar_instruccion(instruccion as NodoInstruccion);
            if (retornado != undefined) {
                return retornado;
            }
        }
        return undefined;
    }
    
    interpretar_instruccion(nodo: NodoInstruccion): string|object[]|undefined{
        switch (nodo.tipoInstruccion) {
            case TipoInstruccion.DeclaracionVariable:						//se espera la estructura -> hijos: TerminalTipodato(TipoDato), NodoNoTerminal(Identificadores) [, NodoExpresion|Terminal]?
                
                this.interpretar_declaracion_variable(nodo);
                break;
                
            case TipoInstruccion.Asignacion:                                //se espera la estructura -> hijos: Terminal(Token(Identificador)), NodoExpresion|Terminal
                
                this.interpretar_asignacion(nodo);
                break;
                
            case TipoInstruccion.LlamadaFuncion:                            //se espera la estructura -> hijos: Terminal(Identificador)[, NodoNoTerminal(Parametros)]
                this.interpretar_llamada_funcion(nodo);
                break;
            case TipoInstruccion.Continuar:                                 //se espera la estrcutura -> hijos: Terminal(Continuar)
                return "CONTINUAR"
            case TipoInstruccion.Detener:                                   //se espera la estructura -> hijos: Terminal(Detener)
                return "DETENER"
            case TipoInstruccion.Retorno:                                   //se espera la estructura -> hijos: Terminal(Retorno) [, NodoExpresion|Terminal]
                let accionRetorno = this.interpretar_retorno(nodo);
                if (accionRetorno != undefined) {
                    return accionRetorno;
                }
                break;
            case TipoInstruccion.Mostrar:                                   //se espera la estructura -> hijos: ParametrosMostrar -> hijos: TerminalTipoDato(Cadena) [, Terminal|TerminalTipoDato]*
                this.interpretar_mostrar(nodo.hijos[0] as NodoNoTerminal);
                break;
            case TipoInstruccion.DibujarAST:                                //se espera la estructura -> hijos: Terminal(Identificador) 
                this.interpretar_dibujar_ast(nodo);
                break;
            case TipoInstruccion.DibujarTabla:                              //se espera la estructura -> hijos:
                console.log("se cambia")
                this.cambiar_imprimir_scope_actual();
                console.log("se cambio")
                console.log("scopescambiado "+this.imprimirScope[this.imprimirScope.length-1])
                break;
            case TipoInstruccion.DibujarExpresion:                          //se espera la estructura -> hijos: NodoExpresion|Terminal
                this.interpretar_dibujar_expresion(nodo);
                break;
            case TipoInstruccion.Mientras:                                  //se espera la estructura -> hijos: NodoExpresion|Terminal [, Instrucciones]
                let accionMientras = this.interpretar_mientras(nodo);
                if (accionMientras != undefined) {
                    return accionMientras;
                }
                break;
            case TipoInstruccion.Para:                                      //se espera la estructura -> hijos: NodoNoTerminal(CondicionInicialPara(Terminal(Identificador),NodoExpresion|Terminal)), NodoExpresion|Terminal, Terminal [, Instrucciones]
                let accionPara = this.interpretar_para(nodo);
                if (accionPara != undefined) {
                    return accionPara;
                }
                break;
            case TipoInstruccion.Si:                                        //se espera la estructura -> hijos: NodoExpresion|Terminal [,Instrucciones] [,Sino]
                let accionSi =this.interpretar_si(nodo);
                if (accionSi != undefined) {
                    return accionSi;
                }
                break;
            case TipoInstruccion.Sino:                                      //se espera la estructura -> hijos: Terminal(SINO) [, Instrucciones]
                let accionSino = this.interpretar_sino(nodo);
                if (accionSino != undefined) {
                    return accionSino;
                }
                break;
            default:
                break;
        }
        return undefined;
    }

    interpretar_mostrar(nodo: NodoNoTerminal){ //se espera la estructura -> hijos: ParametrosMostrar -> hijos: TerminalTipoDato(Cadena) [, Terminal|TerminalTipoDato]*
        let tokenString = (nodo.hijos[0] as TerminalTipoDato).token;
        
        let formatMostrar = this.scopeActual.lookup("|mostrar"+tokenString.linea)! as AtributoMostrar;
        let stringFormato = "";
        formatMostrar.mostrarFormato.forEach(elemento => {
            if (Array.isArray(elemento)) {
                let numeroParametro = parseInt(elemento[0]);
                let valorParametro = this.interpretar_expresion(nodo.hijos[numeroParametro+1] as (NodoExpresion|Terminal));
                let valorCasteado = Caster.castear_valor_evaluado(valorParametro.tipo, TipoDato.String, valorParametro);
                stringFormato += valorCasteado.valor;
            } else {
                stringFormato += elemento;
            }
        });
        this.output.agregarOutput(stringFormato, false);
    }
    
    
    interpretar_mientras(nodo: NodoInstruccion): string|object[]|undefined {
        this.scopeActual = this.scopeActual.nested_scopes[this.peek_scope()];
        this.scopeCounter.push(0);
        this.imprimirScope.push(false);

        try{
            let estadoCondicion: ValorEvaluado = this.interpretar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal));
            estadoCondicion = Caster.castear_valor_evaluado(estadoCondicion.tipo, TipoDato.Boolean, estadoCondicion);
            
            if (nodo.hijos[1] != undefined) {
                
                while (estadoCondicion.valor) {
                    this.reset_counter_actual();
                    //se analizan las intrucciones de la funcion
                    let accion = this.interpretar_instrucciones(nodo.hijos[1] as NodoNoTerminal);
                    if (accion != undefined) {
                        if (accion == "CONTINUAR") {
                            estadoCondicion = this.interpretar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal));
                            estadoCondicion = Caster.castear_valor_evaluado(estadoCondicion.tipo, TipoDato.Boolean, estadoCondicion);
                            continue
                        } else if (accion == "DETENER") {
                            break
                        } else if (Array.isArray(accion)){
                            return accion;
                        }
                    }
                    
                    estadoCondicion = this.interpretar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal));
                    estadoCondicion = Caster.castear_valor_evaluado(estadoCondicion.tipo, TipoDato.Boolean, estadoCondicion);
                }
            }        
        } catch (error) {
            if (error instanceof ErrorTipoOperacion) {
                let lineaError = error.posicion[0]
                let columnaError = error.posicion[1]
                let primerTipo = TipoDato[error.primerTipo];
                let segundoTipo = TipoDato[error.segundoTipo];
                let operacion = error.operacion;
                this.listaErrores.agregarErrorParametros("MIENTRAS, EXPRESION", lineaError, columnaError, "La expresion tiene una operacion "+operacion+" entre un:"+primerTipo+" y un "+segundoTipo+", lo cual no es posible");
            } else if (error instanceof ErrorVariableNoDefinida) {
                this.listaErrores.agregarErrorParametros(error.variable.lexema, error.variable.linea, error.variable.columna, "La variable no ha sido declarada al momento de intentar evaluarla");
            } else if (error instanceof ErrorVariableNoInicializada) {
                this.listaErrores.agregarErrorParametros(error.variable.lexema, error.variable.linea, error.variable.columna, "La variable puede no haber sido inicializada al momento de intentar evaluarla");
            } else if (error instanceof ErrorFuncionInvalida) {
                this.listaErrores.agregarErrorParametros(error.identificador.lexema, error.identificador.linea, error.identificador.columna, "La funcion ingresada tiene errores por lo que no se pudo determinar su tipo");
            } else if (error instanceof ErrorFuncionRetornaVoid) {
                this.listaErrores.agregarErrorParametros(error.identificador.lexema, error.identificador.linea, error.identificador.columna, error.message);
            }
        }
        
        if (this.imprimirScope[this.imprimirScope.length-1]) {
            this.generarTablaScopeActual();
        }
        this.imprimirScope.pop()
        this.scopeActual = this.scopeActual.parent_scope!;
        this.scopeCounter.pop();
        this.aumentar_scope_actual();
        return undefined;
    }
    
    interpretar_para(nodo: NodoInstruccion): string|object[]|undefined {
        this.scopeActual = this.scopeActual.nested_scopes[this.peek_scope()];
        this.scopeCounter.push(0);
        this.imprimirScope.push(false);

        //se espera la estructura -> hijos: NodoNoTerminal(CondicionInicialPara(Terminal(Identificador),NodoExpresion|Terminal)), NodoExpresion|Terminal, Terminal [, Instrucciones]
        let variableCondicionInicial = ((nodo.hijos[0] as Nodo).hijos[0] as Terminal).token;
        let expresionCondicionInicial = ((nodo.hijos[0] as Nodo).hijos[1] as NodoExpresion|Terminal);
        let condicion = nodo.hijos[1] as NodoExpresion|Terminal;        
        
        let direccion = (nodo.hijos[2] as Terminal).token.lexema;
        
        //Se comprueba la validez de la expresion inicial
        try{
            //Se le da el valor inicial a la variable
            let valorInicial: ValorEvaluado = this.interpretar_expresion(expresionCondicionInicial);
            valorInicial = Caster.castear_valor_evaluado(valorInicial.tipo, TipoDato.Int, valorInicial);
            this.scopeActual.update_valor_variable(variableCondicionInicial.lexema, valorInicial.valor);

            //Se evalua la condicion
            let estadoCondicion: ValorEvaluado = this.interpretar_expresion(condicion);
            estadoCondicion = Caster.castear_valor_evaluado(estadoCondicion.tipo, TipoDato.Boolean, estadoCondicion);
            
            if (nodo.hijos[3] != undefined) {
                console.log("tiene instrucciones")
                //Si la condicion es verdadera se ejecutan las instrucciones
                while (estadoCondicion.valor) {
                    this.reset_counter_actual();

                    //se analizan las intrucciones de la funcion
                    let accion = this.interpretar_instrucciones(nodo.hijos[3] as NodoNoTerminal);
                    if (accion != undefined) {
                        if (accion == "CONTINUAR") {
                            //Se realiza el incremento o decremento
                            if(direccion == "++"){
                                let valorActual = (this.scopeActual.lookup(variableCondicionInicial.lexema)! as AtributoVariable).valor;
                                this.scopeActual.update_valor_variable(variableCondicionInicial.lexema,valorActual+1);
                            } else if (direccion == "--") {
                                let valorActual = (this.scopeActual.lookup(variableCondicionInicial.lexema)! as AtributoVariable).valor;
                                this.scopeActual.update_valor_variable(variableCondicionInicial.lexema,valorActual-1);
                            }
                            
                            estadoCondicion = this.interpretar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal));
                            estadoCondicion = Caster.castear_valor_evaluado(estadoCondicion.tipo, TipoDato.Boolean, estadoCondicion);
                            continue
                        } else if (accion == "DETENER") {
                            break
                        } else if (Array.isArray(accion)){
                            return accion;
                        }
                    }
                    
                    //Se realiza el incremento o decremento
                    if(direccion == "++"){
                        let valorActual = (this.scopeActual.lookup(variableCondicionInicial.lexema)! as AtributoVariable).valor;
                        this.scopeActual.update_valor_variable(variableCondicionInicial.lexema,valorActual+1);
                    } else if (direccion == "--") {
                        let valorActual = (this.scopeActual.lookup(variableCondicionInicial.lexema)! as AtributoVariable).valor;
                        this.scopeActual.update_valor_variable(variableCondicionInicial.lexema,valorActual-1);
                    }
                    
                    //Se reevalua la condicion
                    estadoCondicion = this.interpretar_expresion(condicion);
                    estadoCondicion = Caster.castear_valor_evaluado(estadoCondicion.tipo, TipoDato.Boolean, estadoCondicion);
                }
            }        
            
        } catch (error) {
            if (error instanceof ErrorTipoOperacion) {
                let lineaError = error.posicion[0]
                let columnaError = error.posicion[1]
                let primerTipo = TipoDato[error.primerTipo];
                let segundoTipo = TipoDato[error.segundoTipo];
                let operacion = error.operacion;
                this.listaErrores.agregarErrorParametros("MIENTRAS, EXPRESION", lineaError, columnaError, "La expresion tiene una operacion "+operacion+" entre un:"+primerTipo+" y un "+segundoTipo+", lo cual no es posible");
            } else if (error instanceof ErrorVariableNoDefinida) {
                this.listaErrores.agregarErrorParametros(error.variable.lexema, error.variable.linea, error.variable.columna, "La variable no ha sido declarada al momento de intentar evaluarla");
            } else if (error instanceof ErrorVariableNoInicializada) {
                this.listaErrores.agregarErrorParametros(error.variable.lexema, error.variable.linea, error.variable.columna, "La variable puede no haber sido inicializada al momento de intentar evaluarla");
            } else if (error instanceof ErrorFuncionInvalida) {
                this.listaErrores.agregarErrorParametros(error.identificador.lexema, error.identificador.linea, error.identificador.columna, "La funcion ingresada tiene errores por lo que no se pudo determinar su tipo");
            } else if (error instanceof ErrorFuncionRetornaVoid) {
                this.listaErrores.agregarErrorParametros(error.identificador.lexema, error.identificador.linea, error.identificador.columna, error.message);
            }
        }

        if (this.imprimirScope[this.imprimirScope.length-1]) {
            this.generarTablaScopeActual();
        }
        this.imprimirScope.pop()
        this.scopeActual = this.scopeActual.parent_scope!;
        this.scopeCounter.pop();
        this.aumentar_scope_actual();
        return undefined;
    }
    
    interpretar_si(nodo: NodoInstruccion): string|object[]|undefined {

        try{
            let condicion: ValorEvaluado = this.interpretar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal));
            condicion = Caster.castear_valor_evaluado(condicion.tipo, TipoDato.Boolean, condicion);
            

            if (nodo.hijos.length > 1) {
                this.scopeActual = this.scopeActual.nested_scopes[this.peek_scope()];
                this.scopeCounter.push(0);
                this.imprimirScope.push(false);

                if (nodo.hijos[1] instanceof NodoInstruccion) { //Tiene SINO pero no tiene instrucciones
                    if (this.imprimirScope[this.imprimirScope.length-1]) {
                        this.generarTablaScopeActual();
                    }
                    this.imprimirScope.pop()
                    this.scopeActual = this.scopeActual.parent_scope!;
                    this.scopeCounter.pop();
                    this.aumentar_scope_actual();
                    if (!condicion.valor) {
                        this.interpretar_sino(nodo.hijos[1] as NodoInstruccion);
                    }
                } else {                                        //Tiene instrucciones
                    if (condicion.valor) {
                        //se analizan las intrucciones de la funcion
                        let accion = this.interpretar_instrucciones(nodo.hijos[1] as NodoNoTerminal);
                        if (accion != undefined) {
                            return accion;
                        }

                        if (this.imprimirScope[this.imprimirScope.length-1]) {
                            this.generarTablaScopeActual();
                        }
                        this.imprimirScope.pop()
                        this.scopeActual = this.scopeActual.parent_scope!;
                        this.scopeCounter.pop();
                        this.aumentar_scope_actual();
                    } else {
                        if (this.imprimirScope[this.imprimirScope.length-1]) {
                            this.generarTablaScopeActual();
                        }
                        this.imprimirScope.pop()
                        this.scopeActual = this.scopeActual.parent_scope!;
                        this.scopeCounter.pop();
                        this.aumentar_scope_actual();
                        if (nodo.hijos.length > 2) {            //Tambien tiene SINO
                            this.interpretar_sino(nodo.hijos[2] as NodoInstruccion);
                        }
                    }
                }
            } 
        } catch (error) {
            if (this.imprimirScope[this.imprimirScope.length-1]) {
                this.generarTablaScopeActual();
            }
            this.imprimirScope.pop()
            this.scopeActual = this.scopeActual.parent_scope!;
            this.scopeCounter.pop();
            if (error instanceof ErrorTipoOperacion) {
                let lineaError = error.posicion[0]
                let columnaError = error.posicion[1]
                let primerTipo = TipoDato[error.primerTipo];
                let segundoTipo = TipoDato[error.segundoTipo];
                let operacion = error.operacion;
                this.listaErrores.agregarErrorParametros("MIENTRAS, EXPRESION", lineaError, columnaError, "La expresion tiene una operacion "+operacion+" entre un:"+primerTipo+" y un "+segundoTipo+", lo cual no es posible");
            } else if (error instanceof ErrorVariableNoDefinida) {
                this.listaErrores.agregarErrorParametros(error.variable.lexema, error.variable.linea, error.variable.columna, "La variable no ha sido declarada al momento de intentar evaluarla");
            } else if (error instanceof ErrorVariableNoInicializada) {
                this.listaErrores.agregarErrorParametros(error.variable.lexema, error.variable.linea, error.variable.columna, "La variable puede no haber sido inicializada al momento de intentar evaluarla");
            } else if (error instanceof ErrorFuncionInvalida) {
                this.listaErrores.agregarErrorParametros(error.identificador.lexema, error.identificador.linea, error.identificador.columna, "La funcion ingresada tiene errores por lo que no se pudo determinar su tipo");
            } else if (error instanceof ErrorFuncionRetornaVoid) {
                this.listaErrores.agregarErrorParametros(error.identificador.lexema, error.identificador.linea, error.identificador.columna, error.message);
            } else {
                console.log(error)
            }
        }
        return undefined;
    }
    
    interpretar_sino(nodo: NodoInstruccion): string|object[]|undefined{
        this.scopeActual = this.scopeActual.nested_scopes[this.peek_scope()];
        this.scopeCounter.push(0);
        this.imprimirScope.push(false);

        if (nodo.hijos.length > 1) {
            //se analizan las intrucciones de la funcion
            let accion = this.interpretar_instrucciones(nodo.hijos[1] as NodoNoTerminal);
            if (accion != undefined) {
                return accion;
            }
        }        
        
        if (this.imprimirScope[this.imprimirScope.length-1]) {
            this.generarTablaScopeActual();
        }
        this.imprimirScope.pop()
        this.scopeActual = this.scopeActual.parent_scope!;
        this.scopeCounter.pop();
        this.aumentar_scope_actual();
        return undefined;
    }
    
    interpretar_retorno(nodo: NodoInstruccion): object[]|undefined{
        let tokenRetorno = (nodo.hijos[0] as Terminal).token;
        if (nodo.hijos.length > 1) {
            let expresionRetornada = nodo.hijos[1];
            try{
                let valorRetorno :ValorEvaluado = this.interpretar_expresion(expresionRetornada as Terminal|NodoExpresion|NodoInstruccion);    
                valorRetorno = Caster.castear_valor_evaluado(valorRetorno.tipo, this.retornoActual[this.retornoActual.length-1], valorRetorno);
                return [valorRetorno];
            } catch (error) {
                if (error instanceof ErrorTipoOperacion) {
                    let lineaError = error.posicion[0]
                    let columnaError = error.posicion[1]
                    let primerTipo = TipoDato[error.primerTipo];
                    let segundoTipo = TipoDato[error.segundoTipo];
                    let operacion = error.operacion;
                    this.listaErrores.agregarErrorParametros("RETORNO, PARAMETRO, EXPRESION", lineaError, columnaError, "La expresion tiene una operacion "+operacion+" entre un:"+primerTipo+" y un "+segundoTipo+", lo cual no es posible");
                } else if (error instanceof ErrorVariableNoDefinida) {
                    this.listaErrores.agregarErrorParametros(error.variable.lexema, error.variable.linea, error.variable.columna, "La variable no ha sido declarada al momento de intentar evaluarla");
                } else if (error instanceof ErrorVariableNoInicializada) {
                    this.listaErrores.agregarErrorParametros(error.variable.lexema, error.variable.linea, error.variable.columna, "La variable puede no haber sido inicializada al momento de intentar evaluarla");
                } else if (error instanceof ErrorFuncionInvalida) {
                    this.listaErrores.agregarErrorParametros(error.identificador.lexema, error.identificador.linea, error.identificador.columna, "La funcion ingresada tiene errores por lo que no se pudo determinar su tipo");
                } else if (error instanceof ErrorFuncionRetornaVoid) {
                    this.listaErrores.agregarErrorParametros(error.identificador.lexema, error.identificador.linea, error.identificador.columna, error.message);
                }
            }
        } else {
            return []
        }
        return undefined;
    }

    interpretar_dibujar_ast(nodo: NodoInstruccion){
        if (nodo.tipoInstruccion == TipoInstruccion.DibujarAST) {
            let identificador = (nodo.hijos[0] as Terminal).token.lexema;
            let funciones: string[] = this.scopeActual.buscarFunciones(identificador, []);       
            funciones.forEach(llaveFuncion => {
                let atributoFuncion = this.scopeActual.lookup(llaveFuncion)! as AtributoFuncion;
                if (atributoFuncion.instrucciones != undefined) {
                    let dibujoFuncion = this.ast.recorrer_funcion(atributoFuncion.instrucciones);
                    dibujoFuncion["name"] = TipoDato[atributoFuncion.tipo]+":"+atributoFuncion.nombre+"("+atributoFuncion.parametros+")";
                    this.listadoAST.push([dibujoFuncion]);                
                } else {
                    let dibujoFuncion = { name: "", child: [] }
                    dibujoFuncion["name"] = TipoDato[atributoFuncion.tipo]+" : "+atributoFuncion.nombre+"("+atributoFuncion.parametros+")";
                    this.listadoAST.push([dibujoFuncion]);                
                }
            });
        }
    }

    interpretar_dibujar_expresion(nodo: NodoInstruccion){
        let expresionNodo = nodo.hijos[0];
        if (expresionNodo instanceof NodoExpresion || expresionNodo instanceof Terminal || expresionNodo instanceof NodoInstruccion) {
            try{
                let dibujo = this.ast.recorrer_expresion(expresionNodo);
                this.dibujosExpresiones.push([dibujo]);
            } catch (error) {
                if (error instanceof ErrorTipoOperacion) {
                    let lineaError = error.posicion[0]
                    let columnaError = error.posicion[1]
                    let primerTipo = TipoDato[error.primerTipo];
                    let segundoTipo = TipoDato[error.segundoTipo];
                    let operacion = error.operacion;
                    this.listaErrores.agregarErrorParametros("DIBUJAR_EXPRESION, PARAMETRO, EXPRESION", lineaError, columnaError, "La expresion tiene una operacion "+operacion+" entre un:"+primerTipo+" y un "+segundoTipo+", lo cual no es posible");
                } else if (error instanceof ErrorVariableNoDefinida) {
                    this.listaErrores.agregarErrorParametros(error.variable.lexema, error.variable.linea, error.variable.columna, "La variable no ha sido declarada al momento de intentar evaluarla");
                } else if (error instanceof ErrorVariableNoInicializada) {
                    this.listaErrores.agregarErrorParametros(error.variable.lexema, error.variable.linea, error.variable.columna, "La variable puede no haber sido inicializada al momento de intentar evaluarla");
                } else if (error instanceof ErrorFuncionInvalida) {
                    this.listaErrores.agregarErrorParametros(error.identificador.lexema, error.identificador.linea, error.identificador.columna, "La funcion ingresada tiene errores por lo que no se pudo determinar su tipo");
                } else if (error instanceof ErrorFuncionRetornaVoid) {
                    this.listaErrores.agregarErrorParametros(error.identificador.lexema, error.identificador.linea, error.identificador.columna, error.message);
                }
            }
        }
    }

    interpretar_llamada_funcion(nodo: NodoInstruccion){
        //se espera la estructura -> hijos: Terminal(Identificador)[, NodoNoTerminal(Parametros)]
        let tokenIdentificador = (nodo.hijos[0] as Terminal).token;
        let cantidadErrores = this.listaErrores.errores.length;
        let parametros: (TipoDato[]|ValorEvaluado[])[] = nodo.hijos[1]==undefined? [] : this.obtener_parametros_ingresados(nodo.hijos[1] as NodoNoTerminal);
        let parametrosTipos: TipoDato[] = parametros.length==0? [] : parametros[0] as TipoDato[];
        let parametrosValores: ValorEvaluado[] = parametros.length==0? [] : parametros[1] as ValorEvaluado[];
        
        if (tokenIdentificador.lexema != "Principal") {
            //Si despues de ingresar los parametros hay mas errores que antes de analizarlos no se analizara la existencia de la funcion
            if (this.listaErrores.errores.length == cantidadErrores) {
                let llaveFuncion = this.scopeActual.crearLlaveDeParametrosNumeros(tokenIdentificador.lexema, parametrosTipos);            
                let resultadoTabla: Atributo|undefined = this.scopeActual.lookup(llaveFuncion);
                
            }      
        } else {
            this.listaErrores.agregarErrorParametros(tokenIdentificador.lexema, tokenIdentificador.linea, tokenIdentificador.columna, "La funcion Principal no se puede llamar")
        }
    }
    
    obtener_parametros_ingresados(nodo: NodoNoTerminal){
        let tiposParametros: TipoDato[] = []
        let valoresParametros: ValorEvaluado[] = []
        //se espera estructura -> hijos: NodoExpresion|Terminal,...,NodoExpresion|Terminal
        if (nodo.tipoNoTerminal == TipoNoTerminal.Parametros) {
            nodo.hijos.forEach(hijo => {
                if (hijo instanceof Terminal || hijo instanceof NodoExpresion || hijo instanceof NodoInstruccion) {
                    //Analicemos que las expresiones parametro esten bien definidas
                    try{
                        let parametroValor = this.interpretar_expresion(hijo);    
                        tiposParametros.push(parametroValor.tipo);
                        valoresParametros.push(parametroValor);
                    } catch (error) {
                        if (error instanceof ErrorTipoOperacion) {
                            let lineaError = error.posicion[0]
                            let columnaError = error.posicion[1]
                            let primerTipo = TipoDato[error.primerTipo];
                            let segundoTipo = TipoDato[error.segundoTipo];
                            let operacion = error.operacion;
                            this.listaErrores.agregarErrorParametros("LLAMADA, PARAMETRO, EXPRESION", lineaError, columnaError, "La expresion tiene una operacion "+operacion+" entre un:"+primerTipo+" y un "+segundoTipo+", lo cual no es posible");
                        } else if (error instanceof ErrorVariableNoDefinida) {
                            this.listaErrores.agregarErrorParametros(error.variable.lexema, error.variable.linea, error.variable.columna, "La variable no ha sido declarada al momento de intentar evaluarla");
                        } else if (error instanceof ErrorVariableNoInicializada) {
                            this.listaErrores.agregarErrorParametros(error.variable.lexema, error.variable.linea, error.variable.columna, "La variable puede no haber sido inicializada al momento de intentar evaluarla");
                        } else if (error instanceof ErrorFuncionInvalida) {
                            this.listaErrores.agregarErrorParametros(error.identificador.lexema, error.identificador.linea, error.identificador.columna, "La funcion ingresada tiene errores por lo que no se pudo determinar su tipo");
                        } else if (error instanceof ErrorFuncionRetornaVoid) {
                            this.listaErrores.agregarErrorParametros(error.identificador.lexema, error.identificador.linea, error.identificador.columna, error.message);
                        }
                    }
                }
            });
        }
        return [tiposParametros, valoresParametros];
    }

    interpretar_expresion(nodo: NodoExpresion|Terminal|NodoInstruccion): ValorEvaluado{
        //Cuando se encuentre un terminal se devolvera su tipo
        if (nodo instanceof Terminal) {
            if (nodo instanceof TerminalTipoDato) {
                let valor: ValorEvaluado = ValorEvaluado.valor_de_terminal(nodo);
                return valor;
            } else { //En caso de que sea una variable se buscara en la tabla de simbolos
                let variable: AtributoVariable = this.scopeActual.lookup(nodo.token.lexema)! as AtributoVariable;
                return new ValorEvaluado(variable.tipo, variable.valor);
            }
            /*
        } else if (nodo instanceof NodoInstruccion) {
            let cantidadErrores = this.listaErrores.errores.length;
            this.analizar_llamada_funcion(nodo);
            let tokenIdentificador = (nodo.hijos[0] as Terminal).token;
            if (this.listaErrores.errores.length == cantidadErrores) {
                let parametros: TipoDato[] = nodo.hijos[1]==undefined? [] : this.obtener_parametros_ingresados(nodo.hijos[1] as NodoNoTerminal);
                let llaveFuncion = this.scopeActual.crearLlaveDeParametrosNumeros(tokenIdentificador.lexema, parametros);            
                let resultadoTabla: AtributoFuncion = this.scopeActual.lookup(llaveFuncion)! as AtributoFuncion;
                let tipoRetornoFuncion: TipoDato = resultadoTabla.tipo;                   
                if (tipoRetornoFuncion == TipoDato.Void) {
                    throw new ErrorFuncionRetornaVoid("La funcion no tiene un valor de retorno por lo que no es asignable ni operable", tokenIdentificador);
                } else {
                    return tipoRetornoFuncion;
                }
            } else {
                throw new ErrorFuncionInvalida("La funcion tiene errores por lo que no se pudo determinar su tipo", tokenIdentificador);
            }
            */
        } else if (nodo instanceof NodoExpresion) {
            let primerValor: ValorEvaluado;
            let segundoValor: ValorEvaluado;
            let resultado: ValorEvaluado;
            switch (nodo.operador) {
                //Para las operaciones aritmeticas se comprueba si las operaciones son validas entre los tipos
                case TipoExpresionMatematica.Suma:
                    primerValor = this.interpretar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal|NodoInstruccion));
                    segundoValor = this.interpretar_expresion(nodo.hijos[1] as (NodoExpresion|Terminal|NodoInstruccion));
                    try {
                        resultado = this.operar_expresion(primerValor, segundoValor, "SUMA");
                        return resultado;
                    } catch (error) {
                        throw new ErrorTipoOperacion("No se permite la operacion matematica", primerValor.tipo!, segundoValor.tipo!, "SUMA", [this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo)]);                        
                    }
                case TipoExpresionMatematica.Resta:
                    primerValor = this.interpretar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal|NodoInstruccion));
                    segundoValor = this.interpretar_expresion(nodo.hijos[1] as (NodoExpresion|Terminal|NodoInstruccion));
                    try {
                        resultado = this.operar_expresion(primerValor, segundoValor, "RESTA");
                        return resultado;
                    } catch (error) {
                        throw new ErrorTipoOperacion("No se permite la operacion matematica", primerValor.tipo!, segundoValor.tipo!, "RESTA", [this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo)]);                        
                    }
                case TipoExpresionMatematica.Multiplicacion:
                    primerValor = this.interpretar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal|NodoInstruccion));
                    segundoValor = this.interpretar_expresion(nodo.hijos[1] as (NodoExpresion|Terminal|NodoInstruccion));
                    try {
                        resultado = this.operar_expresion(primerValor, segundoValor, "MULTIPLICACION");
                        return resultado;
                    } catch (error) {
                        throw new ErrorTipoOperacion("No se permite la operacion matematica", primerValor.tipo!, segundoValor.tipo!, "MULTIPLICACION", [this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo)]);                        
                    }
                case TipoExpresionMatematica.Division:
                    primerValor = this.interpretar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal|NodoInstruccion));
                    segundoValor = this.interpretar_expresion(nodo.hijos[1] as (NodoExpresion|Terminal|NodoInstruccion));
                    try {
                        resultado = this.operar_expresion(primerValor, segundoValor, "DIVISION");
                        return resultado;
                    } catch (error) {
                        throw new ErrorTipoOperacion("No se permite la operacion matematica", primerValor.tipo!, segundoValor.tipo!, "DIVISION", [this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo)]);                        
                    }
                case TipoExpresionMatematica.Modulo:
                    primerValor = this.interpretar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal|NodoInstruccion));
                    segundoValor = this.interpretar_expresion(nodo.hijos[1] as (NodoExpresion|Terminal|NodoInstruccion));
                    try {
                        resultado = this.operar_expresion(primerValor, segundoValor, "MODULO");
                        return resultado;
                    } catch (error) {
                        throw new ErrorTipoOperacion("No se permite la operacion matematica", primerValor.tipo!, segundoValor.tipo!, "MODULO", [this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo)]);                        
                    }
                case TipoExpresionMatematica.Potencia:
                    primerValor = this.interpretar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal|NodoInstruccion));
                    segundoValor = this.interpretar_expresion(nodo.hijos[1] as (NodoExpresion|Terminal|NodoInstruccion));
                    try {
                        resultado = this.operar_expresion(primerValor, segundoValor, "POTENCIA");
                        return resultado;
                    } catch (error) {
                        throw new ErrorTipoOperacion("No se permite la operacion matematica", primerValor.tipo!, segundoValor.tipo!, "POTENCIA", [this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo)]);                        
                    }
                case TipoExpresionMatematica.Grupo:
                    resultado = this.interpretar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal|NodoInstruccion));
                    return resultado;
                case TipoExpresionMatematica.MenosUnitario:
                    primerValor = this.interpretar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal|NodoInstruccion));
                    try {
                        resultado = this.operar_expresion(primerValor, new ValorEvaluado(TipoDato.Int, -1), "MULTIPLICACION");
                        return resultado;
                    } catch (error) {
                        throw new ErrorTipoOperacion("No se permite la operacion matematica", primerValor.tipo!, TipoDato.Int, "MENOS_UNARIO", [this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo)]);                        
                    }
                case TipoExpresionRelacional.MayorQue:
                    primerValor = this.interpretar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal|NodoInstruccion));
                    segundoValor = this.interpretar_expresion(nodo.hijos[1] as (NodoExpresion|Terminal|NodoInstruccion));
                    try {
                        resultado = new ValorEvaluado(TipoDato.Boolean, primerValor.valor > segundoValor.valor);
                        return resultado;
                    } catch (error) {
                        throw new ErrorTipoOperacion("No se permite la operacion relacional", primerValor.tipo!, segundoValor.tipo!, "MAYOR_QUE", [this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo)]);                        
                    }
                case TipoExpresionRelacional.MenorQue:
                    primerValor = this.interpretar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal|NodoInstruccion));
                    segundoValor = this.interpretar_expresion(nodo.hijos[1] as (NodoExpresion|Terminal|NodoInstruccion));
                    try {
                        resultado = new ValorEvaluado(TipoDato.Boolean, primerValor.valor < segundoValor.valor);
                        return resultado;
                    } catch (error) {
                        throw new ErrorTipoOperacion("No se permite la operacion relacional", primerValor.tipo!, segundoValor.tipo!, "MENOR_QUE", [this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo)]);                        
                    }
                case TipoExpresionRelacional.MayorIgualQue:
                    primerValor = this.interpretar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal|NodoInstruccion));
                    segundoValor = this.interpretar_expresion(nodo.hijos[1] as (NodoExpresion|Terminal|NodoInstruccion));
                    try {
                        resultado = new ValorEvaluado(TipoDato.Boolean, primerValor.valor >= segundoValor.valor);
                        return resultado;
                    } catch (error) {
                        throw new ErrorTipoOperacion("No se permite la operacion relacional", primerValor.tipo!, segundoValor.tipo!, "MAYOR_IGUAL_QUE", [this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo)]);                        
                    }
                case TipoExpresionRelacional.MenorIgualQue:
                    primerValor = this.interpretar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal|NodoInstruccion));
                    segundoValor = this.interpretar_expresion(nodo.hijos[1] as (NodoExpresion|Terminal|NodoInstruccion));
                    try {
                        resultado = new ValorEvaluado(TipoDato.Boolean, primerValor.valor <= segundoValor.valor);
                        return resultado;
                    } catch (error) {
                        throw new ErrorTipoOperacion("No se permite la operacion relacional", primerValor.tipo!, segundoValor.tipo!, "MENOR_IGUAL_QUE", [this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo)]);                        
                    }
                case TipoExpresionRelacional.Igualdad:
                    primerValor = this.interpretar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal|NodoInstruccion));
                    segundoValor = this.interpretar_expresion(nodo.hijos[1] as (NodoExpresion|Terminal|NodoInstruccion));
                    try {
                        resultado = new ValorEvaluado(TipoDato.Boolean, primerValor.valor == segundoValor.valor);
                        return resultado;
                    } catch (error) {
                        throw new ErrorTipoOperacion("No se permite la operacion relacional", primerValor.tipo!, segundoValor.tipo!, "IGUALDAD", [this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo)]);                        
                    }
                case TipoExpresionRelacional.Diferencia:
                    primerValor = this.interpretar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal|NodoInstruccion));
                    segundoValor = this.interpretar_expresion(nodo.hijos[1] as (NodoExpresion|Terminal|NodoInstruccion));
                    try {
                        resultado = new ValorEvaluado(TipoDato.Boolean, primerValor.valor != segundoValor.valor);
                        return resultado;
                    } catch (error) {
                        throw new ErrorTipoOperacion("No se permite la operacion relacional", primerValor.tipo!, segundoValor.tipo!, "DIFERENCIA", [this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo)]);                        
                    }
                case TipoExpresionRelacional.Incerteza:
                    primerValor = this.interpretar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal|NodoInstruccion));
                    segundoValor = this.interpretar_expresion(nodo.hijos[1] as (NodoExpresion|Terminal|NodoInstruccion));
                    try {
                        resultado = new ValorEvaluado(TipoDato.Boolean, this.incerteza(primerValor, segundoValor));
                        return resultado;
                    } catch (error) {
                        throw new ErrorTipoOperacion("No se permite la operacion relacional", primerValor.tipo!, segundoValor.tipo!, "INCERTEZA", [this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo)]);                        
                    }
                case TipoExpresionLogica.And:
                    primerValor = this.interpretar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal|NodoInstruccion));
                    segundoValor = this.interpretar_expresion(nodo.hijos[1] as (NodoExpresion|Terminal|NodoInstruccion));
                    try {
                        resultado = new ValorEvaluado(TipoDato.Boolean, primerValor.valor && segundoValor.valor);
                        return resultado;
                    } catch (error) {
                        throw new ErrorTipoOperacion("No se permite la operacion logica", primerValor.tipo!, segundoValor.tipo!, "AND", [this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo)]);                        
                    }
                case TipoExpresionLogica.Or:
                    primerValor = this.interpretar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal|NodoInstruccion));
                    segundoValor = this.interpretar_expresion(nodo.hijos[1] as (NodoExpresion|Terminal|NodoInstruccion));
                    try {
                        resultado = new ValorEvaluado(TipoDato.Boolean, primerValor.valor || segundoValor.valor);
                        return resultado;
                    } catch (error) {
                        throw new ErrorTipoOperacion("No se permite la operacion logica", primerValor.tipo!, segundoValor.tipo!, "OR", [this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo)]);                        
                    }
                case TipoExpresionLogica.Xor:
                    primerValor = this.interpretar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal|NodoInstruccion));
                    segundoValor = this.interpretar_expresion(nodo.hijos[1] as (NodoExpresion|Terminal|NodoInstruccion));
                    try {
                        resultado = new ValorEvaluado(TipoDato.Boolean, primerValor.valor ^ segundoValor.valor);
                        return resultado;
                    } catch (error) {
                        throw new ErrorTipoOperacion("No se permite la operacion logica", primerValor.tipo!, segundoValor.tipo!, "XOR", [this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo)]);                        
                    }
                case TipoExpresionLogica.Not:
                    primerValor = this.interpretar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal|NodoInstruccion));
                    try {
                        resultado = new ValorEvaluado(TipoDato.Boolean, !primerValor.valor);
                        return resultado;
                    } catch (error) {
                        throw new ErrorTipoOperacion("No se permite la operacion logica", primerValor.tipo!, primerValor.tipo!, "NOT", [this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo)]);                        
                    }
                default:
                    throw new Error("Error al realizar operacion");
            }
        } else {
            throw new Error("Error al realizar operacion");
        }
    }
    
    operar_expresion(primerValor: ValorEvaluado, segundoValor: ValorEvaluado, operacion: string){
        let tipo_datos: Map<string, number> = new Map([["SUMA",0],["RESTA",1],["MULTIPLICACION",2],["DIVISION",3],["MODULO",4],["POTENCIA",5]])
        let tipoResultante = TablaCasteo.encontrar_tipo_objetivo(primerValor.tipo, segundoValor.tipo, tipo_datos.get(operacion)!);
        if (tipoResultante != undefined) {
            let primerCasteado;
            let segundoCasteado;
            let resultado;
            switch (operacion) {
                case "SUMA":
                    primerCasteado = Caster.castear(primerValor.tipo, tipoResultante, primerValor.valor);
                    segundoCasteado = Caster.castear(segundoValor.tipo, tipoResultante, segundoValor.valor);
                    resultado =  primerCasteado + segundoCasteado;
                    break;
                case "RESTA":
                    primerCasteado = Caster.castear(primerValor.tipo, tipoResultante, primerValor.valor);
                    segundoCasteado = Caster.castear(segundoValor.tipo, tipoResultante, segundoValor.valor);
                    resultado =  primerCasteado - segundoCasteado;
                    break;
                case "MULTIPLICACION":
                    primerCasteado = Caster.castear(primerValor.tipo, tipoResultante, primerValor.valor);
                    segundoCasteado = Caster.castear(segundoValor.tipo, tipoResultante, segundoValor.valor);
                    resultado =  primerCasteado * segundoCasteado;
                    break;
                case "DIVISION":
                    primerCasteado = Caster.castear(primerValor.tipo, tipoResultante, primerValor.valor);
                    segundoCasteado = Caster.castear(segundoValor.tipo, tipoResultante, segundoValor.valor);
                    resultado =  primerCasteado / segundoCasteado;
                    break;
                case "MODULO":
                    primerCasteado = Caster.castear(primerValor.tipo, tipoResultante, primerValor.valor);
                    segundoCasteado = Caster.castear(segundoValor.tipo, tipoResultante, segundoValor.valor);
                    resultado =  primerCasteado % segundoCasteado;
                    break;
                case "POTENCIA":
                    primerCasteado = Caster.castear(primerValor.tipo, tipoResultante, primerValor.valor);
                    segundoCasteado = Caster.castear(segundoValor.tipo, tipoResultante, segundoValor.valor);
                    resultado =  primerCasteado ** segundoCasteado;
                    break;
            }
            return new ValorEvaluado(tipoResultante, resultado);
        } else {
            throw new ErrorOperacion("No se puede realizar la operacion", primerValor, segundoValor);
        }
    }
    
    incerteza(primerValor: ValorEvaluado, segundoValor: ValorEvaluado){
        //Se obtiene el valor de la incerteza
        let atributo = this.scopeActual.lookup("@incerteza")! as AtributoVariable;
        let valorIncerteza = atributo.valor as number;

        if ((primerValor.tipo == TipoDato.Boolean)||(segundoValor.tipo == TipoDato.Boolean)) {
            let primerCasteado = primerValor.tipo == TipoDato.Boolean? Caster.castear(TipoDato.Boolean, TipoDato.Double, primerValor.valor):primerValor.valor;
            let segundoCasteado = segundoValor.tipo == TipoDato.Boolean? Caster.castear(TipoDato.Boolean, TipoDato.Double, segundoValor.valor):segundoValor.valor;
            
            let diferencia = Math.abs(primerCasteado - segundoCasteado);
            if (diferencia <= valorIncerteza) {
                return true;
            } else {
                return false;
            }

        } else {
            //Se obtiene el tipo de valor de incerteza
            switch (TipoDato[primerValor.tipo]) {
                case "Int":
                case "Double":
                    let diferencia = Math.abs(primerValor.valor - segundoValor.valor);
                    if (diferencia <= valorIncerteza) {
                        return true;
                    } else {
                        return false;
                    }
                case "String":
                case "Char":
                    let primerFormato = String(primerValor.valor).trim().toLowerCase();
                    let segundoFormato = String(segundoValor.valor).trim().toLowerCase();
                    return primerFormato == segundoFormato;
                default:
                    throw new ErrorTipoOperacion("No se permite la operacion relacional", primerValor.tipo!, segundoValor.tipo!, "INCERTEZA", [0, 0]);                        
            }
        }
    }
}

export class ValorEvaluado{
    tipo: TipoDato;
    valor: any;
    
    constructor(tipo: TipoDato, valor: any){
        this.tipo = tipo;
        this.valor = valor;
    }
    
    static valor_de_terminal(terminal: TerminalTipoDato){
        switch (TipoDato[terminal.tipoDato]) {
            case "String":
                return new ValorEvaluado(terminal.tipoDato, terminal.token.lexema);
            case "Double":
                return new ValorEvaluado(terminal.tipoDato, parseFloat(terminal.token.lexema));
            case "Boolean":
                return new ValorEvaluado(terminal.tipoDato, terminal.token.lexema == "true"? true:false);
            case "Int":
                return new ValorEvaluado(terminal.tipoDato, parseInt(terminal.token.lexema));
            case "Char":
                return new ValorEvaluado(terminal.tipoDato, terminal.token.lexema.charAt(0));
            default:
                throw new ErrorCasteoValor("No se puede castear el valor", terminal.token.lexema);
                
        }
    }
}


class Caster{
    static castear_valor_evaluado(tipoOrigen: TipoDato, tipoDestino: TipoDato, valorEvaluado: ValorEvaluado): ValorEvaluado{
        let valor = this.castear(tipoOrigen,tipoDestino,valorEvaluado.valor);
        return new ValorEvaluado(valorEvaluado.tipo, valor);
    }

    static castear(tipoOrigen: TipoDato, tipoDestino: TipoDato, valor: any): any{
        switch (TipoDato[tipoDestino]) {
            case "String":
                switch (TipoDato[tipoOrigen]) {
                    case "String":
                        return valor;
                    case "Double":
                        return parseFloat(valor).toString();
                    case "Boolean":
                        return valor == true? "1" : "0"
                    case "Int":
                        return parseInt(valor).toString()
                    case "Char":
                        return String(valor).charAt(0);
                    default:
                        throw new ErrorCasteoValor("No se puede castear el valor", valor);
                }
            case "Double":
                switch (TipoDato[tipoOrigen]) {
                    case "String":
                        throw new ErrorCasteo("No se puede castear el valor", tipoOrigen, tipoDestino);
                    case "Double":
                        return valor;
                    case "Boolean":
                        return valor == true? 1.0 : 0.0
                    case "Int":
                        return parseFloat(valor);
                    case "Char":
                        return parseFloat(String(valor).charAt(0).charCodeAt(0).toString());
                    default:
                        throw new ErrorCasteoValor("No se puede castear el valor", valor);
                }
            case "Boolean":
                switch (TipoDato[tipoOrigen]) {
                    case "String":
                    case "Double":
                        throw new ErrorCasteo("No se puede castear el valor", tipoOrigen, tipoDestino);
                    case "Boolean":
                        return valor
                    case "Int":
                    case "Char":
                        throw new ErrorCasteo("No se puede castear el valor", tipoOrigen, tipoDestino);
                    default:
                        throw new ErrorCasteoValor("No se puede castear el valor", valor);
                }
            case "Int":
                switch (TipoDato[tipoOrigen]) {
                    case "String":
                        throw new ErrorCasteo("No se puede castear el valor", tipoOrigen, tipoDestino);
                    case "Double":
                        return Math.floor(valor);
                    case "Boolean":
                        return valor == true? 1 : 0
                    case "Int":
                        return valor
                    case "Char":
                        return Number(String(valor).charAt(0).charCodeAt(0));
                    default:
                        throw new ErrorCasteoValor("No se puede castear el valor", valor);
                }
            case "Char":
                switch (TipoDato[tipoOrigen]) {
                    case "String":
                    case "Double":
                    case "Boolean":
                        throw new ErrorCasteo("No se puede castear el valor", tipoOrigen, tipoDestino);
                    case "Int":
                        return String.fromCharCode(valor);
                    case "Char":
                        return valor;
                    default:
                        throw new ErrorCasteoValor("No se puede castear el valor", valor);
                }
            default:
                throw new ErrorCasteoValor("No se puede castear el valor", valor);
        }
    }
}
