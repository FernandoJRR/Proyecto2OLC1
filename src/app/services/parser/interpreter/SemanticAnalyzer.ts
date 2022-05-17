import { FormControl } from "@angular/forms";
import { AST, Nodo, NodoExpresion, NodoInstruccion, NodoNoTerminal, NodoRaiz, Terminal, TerminalTipoDato, TipoDato, TipoExpresionLogica, TipoExpresionMatematica, TipoExpresionRelacional, TipoInstruccion, TipoNoTerminal, UtilidadesAST } from "../ast/AST";
import { ErrorList } from "../manejo_error/ErrorList";
import { Token } from "../model/Token";
import { Atributo, AtributoFuncion, AtributoMostrar, AtributoVariable, Scope, ScopeType, TablaDeSimbolos } from "../tabla_de_simbolos/TablaDeSimbolos";
import { ErrorCasteo, ErrorFuncionInvalida, ErrorFuncionRetornaVoid, ErrorOperacion, ErrorTipo, ErrorTipoOperacion, ErrorVariableDuplicada, ErrorVariableNoDefinida, ErrorVariableNoInicializada } from "./Errors";

export class SemanticAnalyzer{
    ast: AST;
    tablaDeSimbolos: TablaDeSimbolos;    
    
    scopeActual: TablaDeSimbolos;
    retornoActual: TipoDato[] = [];
    
    listaErrores: ErrorList;
    utilidaddes: UtilidadesAST;
    
    constructor(ast: AST, tablaDeSimbolos: TablaDeSimbolos, listaErrores: ErrorList){
        this.ast = ast;
        this.tablaDeSimbolos = tablaDeSimbolos;
        this.scopeActual = tablaDeSimbolos;
        this.listaErrores = listaErrores;        
        this.utilidaddes = new UtilidadesAST;        
    }

    analizarAST(){
        this.analizar(this.ast.raiz);
    }
    
    analizar(nodo: Nodo|Terminal){
        if (nodo instanceof Nodo) {
            if (nodo instanceof NodoRaiz) {
                this.analizar_raiz(nodo as NodoRaiz);
            } else if (nodo instanceof NodoInstruccion) {
                switch (nodo.tipoInstruccion) {
                    case TipoInstruccion.Importacion:
                        //pendiente
                        break;
                    case TipoInstruccion.Incerteza:
                        this.analizar_incerteza(nodo);
                        break;
                    case TipoInstruccion.DeclaracionVariable:
                        this.analizar_declaracion_variable(nodo);
                        break;
                    case TipoInstruccion.Asignacion:
                        this.analizar_asignacion(nodo);
                        break;
                    case TipoInstruccion.DeclaracionFuncion:
                        this.analizar_declaracion_funcion(nodo);
                        break;
                    default:
                        break;
                }
            }
        }
    }

    analizar_raiz(nodo: NodoRaiz){
        //Acciones Preorden
        
        //Se cambia el scope actual al scope global
        this.scopeActual = this.tablaDeSimbolos;
        
        //Se agrega la incerteza por default
        this.scopeActual.insertar("@incerteza", new AtributoVariable("Incerteza", TipoDato.Double, true, undefined, 0.5));
        
        //Acciones Inorden
        nodo.hijos.forEach(hijo => {
            this.analizar(hijo);
        });
        
        //Acciones Postorden
        //console.log(this.scopeActual);
    }
    
    //Puede arrojar ErrorTipoOperacion si la expresion asociada a la incerteza es incorrecta
    //Puede arrojar ErrorTipo si la expresion asociada a la incerteza no puede ser casteada a un valor numerido
    analizar_incerteza(nodo: NodoInstruccion){
        try{
            let tipoEncontrado: TipoDato|undefined = this.analizar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal));
            
            let casteoCorrecto = TablaCasteo.comprobar_casteo_permitido(tipoEncontrado!, TipoDato.Double);
            if (!casteoCorrecto) {
                let tokenTipoDato = (nodo.hijos[0] as TerminalTipoDato).token
                this.listaErrores.agregarErrorParametros("DEFINICION_INCERTEZA", tokenTipoDato.linea, tokenTipoDato.columna, "La expresion de tipo: "+TipoDato[tipoEncontrado!]+" no puede ser casteada y asignada a la/s variable/s de tipo: "+TipoDato[TipoDato.Double]);
            }
        } catch (error) {
            if (error instanceof ErrorTipoOperacion) {
                let lineaError = error.posicion[0]
                let columnaError = error.posicion[1]
                let primerTipo = TipoDato[error.primerTipo];
                let segundoTipo = TipoDato[error.segundoTipo];
                let operacion = error.operacion;
                this.listaErrores.agregarErrorParametros("DEFINICION_INCERTEZA, EXPRESION", lineaError, columnaError, "La expresion tiene una operacion "+operacion+" entre un:"+primerTipo+" y un "+segundoTipo+", lo cual no es posible");
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
    
    //Tipo, NodoNoTerminal(Identificadores) [,Expresion]

    //Puede arrojar ErrorTipoOperacion si la expresion asociada a las variables es incorrecta
    //Puede arrojar ErrorCasteo si la expresion asociada a las variables no se puede castear al tipo de estas
    analizar_declaracion_variable(nodo: NodoInstruccion){
        let tipoDato: TipoDato = (nodo.hijos[0] as TerminalTipoDato).tipoDato;
        let identificadores: Token[] = this.obtener_terminales_variables(nodo.hijos[1] as NodoNoTerminal);
        let tipoExpresion: TipoDato|undefined|null = null;    
        let inicializacion: boolean = false;
        
        if (nodo.hijos.length === 3) {
            inicializacion = true;
            try{
                tipoExpresion = this.analizar_expresion(nodo.hijos[2] as NodoExpresion|Terminal);    
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
                }
            }
        }
        if (tipoExpresion != null) {
            let casteoCorrecto: boolean = TablaCasteo.comprobar_casteo_permitido(tipoExpresion, tipoDato);
            if (!casteoCorrecto) {
                let tokenTipoDato = (nodo.hijos[0] as TerminalTipoDato).token
                this.listaErrores.agregarErrorParametros("DECLARACION_VARIABLES", tokenTipoDato.linea, tokenTipoDato.columna, "La expresion de tipo: "+TipoDato[tipoExpresion]+" no puede ser casteada y asignada a la/s variable/s de tipo: "+TipoDato[tipoDato]);
            }
        }
        
        identificadores.forEach(identificador => {
            let identificadorTabla = this.scopeActual.lookup(identificador.lexema);
            if (identificadorTabla != undefined) {
                this.listaErrores.agregarErrorParametros(identificador.lexema, identificador.linea, identificador.columna, "La variable esta duplicada");
            } else {
                this.scopeActual.insertar(identificador.lexema, new AtributoVariable(identificador.lexema, tipoDato, inicializacion, [identificador.linea, identificador.columna]));
            }
        });
    }
    
    obtener_terminales_variables(nodo: NodoNoTerminal){
        let tokens: Token[] = []
        nodo.hijos.forEach(hijo => {
            tokens.push((hijo as Terminal).token);
        });    
        return tokens;        
    }
    
    analizar_asignacion(nodo: NodoInstruccion){
        let tokenVariable: Token = (nodo.hijos[0] as Terminal).token;
        //Se comprueba si la variable a la que se quiere asignar existe y si existe se obtiene su tipo
        let variable: Atributo|undefined = this.scopeActual.lookup(tokenVariable.lexema);
        if (variable == undefined) {
            this.listaErrores.agregarErrorParametros(tokenVariable.lexema, tokenVariable.linea, tokenVariable.columna, "La variable no ha sido declarada al momento de intentar evaluarla");
        } else {
            //Se hace que la variable tenga inicializada
            (variable as AtributoVariable).inicializar();
            this.scopeActual.update_up(tokenVariable.lexema, variable);

            //Se analiza la expresion que se quiere asignar para obtener su tipo
            try{
                let tipoExpresion: TipoDato = this.analizar_expresion(nodo.hijos[1] as (NodoExpresion|Terminal));
                let casteoCorrecto: boolean = TablaCasteo.comprobar_casteo_permitido(tipoExpresion, variable.tipo);
                if (!casteoCorrecto) {
                    let tokenTipoDato = (nodo.hijos[0] as TerminalTipoDato).token
                    this.listaErrores.agregarErrorParametros(tokenVariable.lexema, tokenTipoDato.linea, tokenTipoDato.columna, "La expresion de tipo: "+TipoDato[tipoExpresion]+" no puede ser casteada y asignada a la/s variable/s de tipo: "+TipoDato[variable.tipo]);
                }
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
    
    analizar_retornabilidad(scope: TablaDeSimbolos){
        if (scope.scope.retornabilidad) {
            return true;
        } else {
            let retornabilidad: boolean = false;
            for (let i = 0; i < scope.nested_scopes.length; i++) {
                const scope_anidado = scope.nested_scopes[i];
                if (scope_anidado.scope.retornabilidad && !scope_anidado.scope.anulabilidad) {
                    retornabilidad = true;
                } else if ((scope_anidado.scope.scope_name == "Sino") && (scope.nested_scopes[i-1] != undefined)) {
                    if (scope.nested_scopes[i-1].scope.scope_name == "Si") {
                        if (scope.nested_scopes[i-1].scope.retornabilidad && scope_anidado.scope.retornabilidad) {
                            retornabilidad = true;
                        }        
                    }
                }
            }
            return retornabilidad;            
        }
    }
    
    analizar_retornabilidad_si(scope: TablaDeSimbolos){
        if (scope.scope.retornabilidad) {
            return true;
        } else {
            let retornabilidadSi: boolean = false;
            let retornabilidadSino: boolean|undefined = undefined;
            scope.nested_scopes.forEach(scope_anidado => {
                if (scope_anidado.scope.retornabilidad && !scope_anidado.scope.anulabilidad) {
                    retornabilidadSi = true;
                } else if (scope_anidado.scope.scope_name == 'Sino' && scope_anidado.scope.retornabilidad) {
                    retornabilidadSino = true;
                }
            });
            if (retornabilidadSino != undefined) {
                return retornabilidadSi && retornabilidadSino 
            } else {
                return retornabilidadSi;
            }
        }
    }
    
    analizar_declaracion_funcion(nodo: NodoInstruccion){
     //se espera la estructura -> hijos: TerminalTipoDato(TipoDato), Terminal(Token(Identificador)), NodoNoTerminal(DeclaracionParametros) [, Instrucciones]   
        let tipoRetorno: TipoDato = (nodo.hijos[0] as TerminalTipoDato).tipoDato;
        let tokenIdentificador: Token = (nodo.hijos[1] as Terminal).token;
        let parametrosDeclarados: Parametro[] = this.obtener_parametros(nodo.hijos[2] as NodoNoTerminal);        
        
        console.log("tipoFuncion "+TipoDato[tipoRetorno])
        console.log("nombrefuncin "+tokenIdentificador.lexema)
        
        if (tokenIdentificador.lexema === "Principal" && (parametrosDeclarados.length != 0 || tipoRetorno != TipoDato.Void)) {
            this.listaErrores.agregarErrorParametros(tokenIdentificador.lexema, tokenIdentificador.linea, tokenIdentificador.columna, "La funcion Principal no puede tener valor de retorno ni puede tener parametros")
        } else {
            //Se declara el identificador de la funcion en la tabla de simbolos
            let llaveFuncion = this.scopeActual.crearLlaveDeParametros(tokenIdentificador.lexema, parametrosDeclarados);
            let resultadoTabla: Atributo|undefined = this.scopeActual.lookup(llaveFuncion);
            
            //Si se obtiene un resultado de la tabla significa que la funcion ya fue declarada una vez
            if (resultadoTabla != undefined) {
                this.listaErrores.agregarErrorParametros(tokenIdentificador.lexema, tokenIdentificador.linea, tokenIdentificador.columna, "La funcion (con los mismos parametros) ya ha sido declarada una vez")
            } else {
                this.scopeActual.insertar(llaveFuncion, new AtributoFuncion(tokenIdentificador.lexema, tipoRetorno, parametrosDeclarados, [tokenIdentificador.linea, tokenIdentificador.columna], nodo.hijos[3]==undefined? undefined:nodo.hijos[3] as NodoNoTerminal))
            }        

            //Se crea la tabla de simbolos de la declaracion de la funcion
            let scopeFuncion: TablaDeSimbolos = new TablaDeSimbolos(new Scope(ScopeType.Funcion, llaveFuncion, false), this.scopeActual);
            this.scopeActual.agregarInnerScope(scopeFuncion);
            
            //Se intentan insertar los parametros de la funcion en su scope
            parametrosDeclarados.forEach(parametro => {
                let llaveParametro: Atributo|undefined = scopeFuncion.lookup(parametro.identificador.lexema);
                if (llaveParametro != undefined) {
                    this.listaErrores.agregarErrorParametros(parametro.identificador.lexema, parametro.identificador.linea, parametro.identificador.columna, "La variable ya ha sido declarada una vez")
                } else {
                    scopeFuncion.insertar(parametro.identificador.lexema, new AtributoVariable(parametro.identificador.lexema, parametro.tipo, true, [parametro.identificador.linea, parametro.identificador.columna]));
                }
            });

            if (nodo.hijos[3] != undefined) {
                //El scope se mueve al scope de la funcion y se agrega el tipo de retorno al stack
                this.scopeActual = scopeFuncion;
                this.retornoActual.push(tipoRetorno);
                //se analizan las intrucciones de la funcion
                this.analizar_instrucciones(nodo.hijos[3] as NodoNoTerminal);
                
                let retornable:boolean = this.analizar_retornabilidad(this.scopeActual);
                
                if (!retornable && tipoRetorno!=TipoDato.Void) {
                    this.scopeActual.scope.retornabilidad = retornable;
                    this.listaErrores.agregarErrorParametros(tokenIdentificador.lexema, tokenIdentificador.linea, tokenIdentificador.columna, "La funcion no retorna un valor por todos los caminos");
                }

                this.retornoActual.pop();

                //El scope se mueve al padre del scope funcion
                this.scopeActual = this.scopeActual.parent_scope!;

            }        
        }
    }

    obtener_parametros(nodo: NodoNoTerminal){
//Se espera estructura -> hijos: TerminalTipoDato(TipoDato), Terminal(Identificador)
        let parametros: Parametro[] = []
        if (nodo.tipoNoTerminal == TipoNoTerminal.DeclaracionParametros) {
            nodo.hijos.forEach(declaracion => {
                let tipoDeclaracion: TipoDato = ((declaracion as NodoNoTerminal).hijos[0] as TerminalTipoDato).tipoDato;
                let identificadorDeclaracion: Token = ((declaracion as NodoNoTerminal).hijos[1] as Terminal).token;
                parametros.push(new Parametro(tipoDeclaracion, identificadorDeclaracion));                
            });
        }        
        return parametros;        
    }
    
    //Se analizan las instrucciones de una funcion usando el NodoNoTerminal de tipo Instrucciones
    analizar_instrucciones(nodo: NodoNoTerminal){
        nodo.hijos.forEach(instruccion => {
            this.analizar_instruccion(instruccion as NodoInstruccion);
        });
    }
    
    analizar_instruccion(nodo: NodoInstruccion){
        switch (nodo.tipoInstruccion) {
            case TipoInstruccion.DeclaracionVariable:						//se espera la estructura -> hijos: TerminalTipodato(TipoDato), NodoNoTerminal(Identificadores) [, NodoExpresion|Terminal]?
                
                this.analizar_declaracion_variable(nodo);
                break;
                
            case TipoInstruccion.Asignacion:                                //se espera la estructura -> hijos: Terminal(Token(Identificador)), NodoExpresion|Terminal
                
                this.analizar_asignacion(nodo);
                break;
                
            case TipoInstruccion.LlamadaFuncion:                            //se espera la estructura -> hijos: Terminal(Identificador)[, NodoNoTerminal(Parametros)]
                this.analizar_llamada_funcion(nodo);
                break;
            case TipoInstruccion.Continuar:                                 //se espera la estrcutura -> hijos: Terminal(Continuar)
                this.analizar_continuar(nodo);
                break;
            case TipoInstruccion.Detener:                                   //se espera la estructura -> hijos: Terminal(Detener)
                this.analizar_detener(nodo);
                break;
            case TipoInstruccion.Retorno:                                   //se espera la estructura -> hijos: Terminal(Retorno) [, NodoExpresion|Terminal]
                this.analizar_retorno(nodo);
                break;
            case TipoInstruccion.Mostrar:                                   //se espera la estructura -> hijos: ParametrosMostrar -> hijos: TerminalTipoDato(Cadena) [, Terminal|TerminalTipoDato]*
                this.analizar_parametros_mostrar(nodo.hijos[0] as NodoNoTerminal);
                break;
            case TipoInstruccion.DibujarAST:                                //se espera la estructura -> hijos: Terminal(Identificador) 
                this.analizar_dibujar_ast(nodo);
                break;
            case TipoInstruccion.DibujarTabla:                              //se espera la estructura -> hijos:
                //No es necesaria el analisis de la instruccion DibujarTabla
                break;
            case TipoInstruccion.DibujarExpresion:                          //se espera la estructura -> hijos: NodoExpresion|Terminal
                this.analizar_dibujar_expresion(nodo);
                break;
            case TipoInstruccion.Mientras:                                  //se espera la estructura -> hijos: NodoExpresion|Terminal [, Instrucciones]
                this.analizar_mientras(nodo);
                break;
            case TipoInstruccion.Para:                                      //se espera la estructura -> hijos: NodoNoTerminal(CondicionInicialPara(Terminal(Identificador),NodoExpresion|Terminal)), NodoExpresion|Terminal, Terminal [, Instrucciones]
                this.analizar_para(nodo);
                break;
            case TipoInstruccion.Si:                                        //se espera la estructura -> hijos: NodoExpresion|Terminal [,Instrucciones] [,Sino]
                this.analizar_si(nodo);
                break;
            case TipoInstruccion.Sino:                                      //se espera la estructura -> hijos: Terminal(SINO) [, Instrucciones]
                this.analizar_sino(nodo);
                break;
            default:
                break;
        }
    }
    
    analizar_parametros_mostrar(nodo: NodoNoTerminal){ //se espera la estructura -> hijos: ParametrosMostrar -> hijos: TerminalTipoDato(Cadena) [, Terminal|TerminalTipoDato]*
        let tokenString = (nodo.hijos[0] as TerminalTipoDato).token;
        let cantidadParametros = nodo.hijos.length-1;
        
        this.analizar_interpolacion(tokenString, cantidadParametros);
        
        for (let i = 1; i < nodo.hijos.length; i++) {
            const hijo: Terminal|NodoExpresion = nodo.hijos[i] as Terminal|NodoExpresion;
            
            if(hijo instanceof NodoExpresion || hijo instanceof Terminal){

                //Analicemos que las expresiones parametro esten bien definidas
                try{
                    this.analizar_expresion(hijo as NodoExpresion|Terminal);    
                } catch (error) {
                    if (error instanceof ErrorTipoOperacion) {
                        let lineaError = error.posicion[0]
                        let columnaError = error.posicion[1]
                        let primerTipo = TipoDato[error.primerTipo];
                        let segundoTipo = TipoDato[error.segundoTipo];
                        let operacion = error.operacion;
                        this.listaErrores.agregarErrorParametros("MOSTRAR, PARAMETRO, EXPRESION", lineaError, columnaError, "La expresion tiene una operacion "+operacion+" entre un:"+primerTipo+" y un "+segundoTipo+", lo cual no es posible");
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
    }
    
    analizar_interpolacion(tokenString: Token, cantidadParametros: number){
        const analizadorInterpolacion = require("./interpolation_parser.js");
        let parametrosFormato: (string|string[])[] = [];
        analizadorInterpolacion.Parser.yy = { formato: parametrosFormato };        
        analizadorInterpolacion.parse(tokenString.lexema);        
        
        let columnaActual = tokenString.columna;
    
        parametrosFormato.forEach(elemento => {
            if (Array.isArray(elemento)) {
                let contenido = elemento[0].trim();
                columnaActual += elemento[0].length;
                if (Number.isNaN(Number(contenido))) {
                    this.listaErrores.agregarErrorParametros(contenido, tokenString.linea, columnaActual, "El dato escrito no es un numero de parametro valido");
                } else {
                    if (cantidadParametros < Number(contenido)+1) {
                        this.listaErrores.agregarErrorParametros(contenido, tokenString.linea, columnaActual, "El numero de parametro es mayor a la cantidad de parametros ingresados");
                    }
                }
            } else {
                columnaActual += elemento.length;
            }       
        });
        this.scopeActual.insertar("|mostrar"+tokenString.linea, new AtributoMostrar("Mostrar", TipoDato.String, parametrosFormato, [tokenString.linea]))        
    }

    analizar_llamada_funcion(nodo: NodoInstruccion){
        //se espera la estructura -> hijos: Terminal(Identificador)[, NodoNoTerminal(Parametros)]
        let tokenIdentificador = (nodo.hijos[0] as Terminal).token;
        let cantidadErrores = this.listaErrores.errores.length;
        let parametros: TipoDato[] = nodo.hijos[1]==undefined? [] : this.obtener_parametros_ingresados(nodo.hijos[1] as NodoNoTerminal);
        
        if (tokenIdentificador.lexema != "Principal") {
            //Si despues de ingresar los parametros hay mas errores que antes de analizarlos no se analizara la existencia de la funcion
            if (this.listaErrores.errores.length == cantidadErrores) {
                let llaveFuncion = this.scopeActual.crearLlaveDeParametrosNumeros(tokenIdentificador.lexema, parametros);            
                let resultadoTabla: Atributo|undefined = this.scopeActual.lookup(llaveFuncion);
                
                //Si se obtiene un resultado de la tabla significa que la funcion ya fue declarada una vez
                if (resultadoTabla == undefined) {
                    this.listaErrores.agregarErrorParametros(tokenIdentificador.lexema, tokenIdentificador.linea, tokenIdentificador.columna, "La funcion (con los mismos parametros) no ha sido declarada")
                }
            }      
        } else {
            this.listaErrores.agregarErrorParametros(tokenIdentificador.lexema, tokenIdentificador.linea, tokenIdentificador.columna, "La funcion Principal no se puede llamar")
        }
    }
    
    obtener_parametros_ingresados(nodo: NodoNoTerminal){
        let tiposParametros: TipoDato[] = []
        //se espera estructura -> hijos: NodoExpresion|Terminal,...,NodoExpresion|Terminal
        if (nodo.tipoNoTerminal == TipoNoTerminal.Parametros) {
            nodo.hijos.forEach(hijo => {
                if (hijo instanceof Terminal || hijo instanceof NodoExpresion || hijo instanceof NodoInstruccion) {
                    //Analicemos que las expresiones parametro esten bien definidas
                    try{
                        let tipo = this.analizar_expresion(hijo);    
                        tiposParametros.push(tipo);
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
        return tiposParametros;
    }
    
    analizar_retorno(nodo: NodoInstruccion){
        let tokenRetorno = (nodo.hijos[0] as Terminal).token;
        //Se comprueba la validez del retorno
        //se espera la estructura -> hijos: Terminal(Retorno) [, NodoExpresion|Terminal]
        //El primer caso se da si se intenta retornar algo cuando la funcion es de tipo Void, lo cual esta prohibido
        if ((nodo.hijos.length > 1) && this.retornoActual[this.retornoActual.length-1] == TipoDato.Void) {
            this.listaErrores.agregarErrorParametros("Retorno", tokenRetorno.linea, tokenRetorno.columna, "El return debe de estar vacio en una funcion de tipo: Void")
        
        //El segundo caso se da en caso que el Retorno no retorne nada y la funcion debe retornar algo
        } else if ((nodo.hijos.length == 1) && this.retornoActual[this.retornoActual.length-1] != TipoDato.Void) {
            this.listaErrores.agregarErrorParametros("Retorno", tokenRetorno.linea, tokenRetorno.columna, "El return debe de retornar algo en una funcion de tipo: "+TipoDato[this.retornoActual[this.retornoActual.length-1]]);
        
        //El tercer caso en caso que el retorno sea correcto se evalua la expresion retornada
        } else {
            if (nodo.hijos.length > 1) {
                let expresionRetornada = nodo.hijos[1];
                try{
                    let tipo = this.analizar_expresion(expresionRetornada as Terminal|NodoExpresion|NodoInstruccion);    
                    let casteoCorrecto: boolean = TablaCasteo.comprobar_casteo_permitido(tipo, this.retornoActual[this.retornoActual.length-1]);
                    if (!casteoCorrecto) {
                        this.listaErrores.agregarErrorParametros(tokenRetorno.lexema, tokenRetorno.linea, tokenRetorno.columna, "La expresion de tipo: "+TipoDato[tipo]+" no puede ser casteada y asignada a la/s variable/s de tipo: "+TipoDato[this.retornoActual[this.retornoActual.length-1]]);
                    }
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
            }
}
        //Se modifica la retornabilidad
        if (!this.scopeActual.scope.tieneControl) {
            this.scopeActual.scope.retornabilidad = true;        
        }
    }
    
    analizar_continuar(nodo: NodoInstruccion){
        let enCiclo = this.scopeActual.enCiclo();
        if (!enCiclo) {
            this.listaErrores.agregarErrorParametros("Continuar", this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo), "La instruccion CONTINUAR solo puede ser declarada dentro de ciclos");
        } else {
            if (!this.scopeActual.scope.retornabilidad) {
                this.scopeActual.scope.tieneControl = true;                
            }
        }        
    }
    analizar_detener(nodo: NodoInstruccion){
        let enCiclo = this.scopeActual.enCiclo();
        if (!enCiclo) {
            this.listaErrores.agregarErrorParametros("Detener", this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo), "La instruccion DETENER solo puede ser declarada dentro de ciclos");
        } else {
            if (!this.scopeActual.scope.retornabilidad) {
                this.scopeActual.scope.tieneControl = true;                
            }
        }        
    }
    
    analizar_dibujar_ast(nodo: NodoInstruccion){
        if (nodo.tipoInstruccion == TipoInstruccion.DibujarAST) {
            let identificador = (nodo.hijos[0] as Terminal).token.lexema;
            let funciones: string[] = this.scopeActual.buscarFunciones(identificador, []);       
            if (funciones.length == 0) {
                this.listaErrores.agregarErrorParametros("DibujarAST", this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo), "No existen funciones con el identificador '"+identificador+"'");
            }
        }
    }
    
    analizar_dibujar_tabla(nodo: NodoInstruccion){
    }
    
    analizar_dibujar_expresion(nodo: NodoInstruccion){
        if (nodo instanceof NodoExpresion || nodo instanceof Terminal) {
            try{
                this.analizar_expresion(nodo);    
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
    
    analizar_mientras(nodo: NodoInstruccion){
//se espera la estructura -> hijos: NodoExpresion|Terminal [, Instrucciones]
        try{
            let tipoExpresion: TipoDato = this.analizar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal));
            let casteoCorrecto: boolean = TablaCasteo.comprobar_casteo_permitido(tipoExpresion, TipoDato.Boolean);
            if (!casteoCorrecto) {
                this.listaErrores.agregarErrorParametros("MIENTRAS", this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo), "La expresion de tipo: "+TipoDato[tipoExpresion]+" no puede ser casteada al tipo: Boolean");
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
        
        //Se crea la tabla de simbolos del ciclo
        let scopeMientras: TablaDeSimbolos = new TablaDeSimbolos(new Scope(ScopeType.Ciclo, "Mientras", true), this.scopeActual);
        this.scopeActual.agregarInnerScope(scopeMientras);
        
        if (nodo.hijos[1] != undefined) {
            //El scope se mueve al scope de la funcion y se agrega el tipo de retorno al stack
            this.scopeActual = scopeMientras;
            //se analizan las intrucciones de la funcion
            this.analizar_instrucciones(nodo.hijos[1] as NodoNoTerminal);
            
            let retornable:boolean = this.analizar_retornabilidad(this.scopeActual);
            
            this.scopeActual.scope.retornabilidad = retornable;
            
            //El scope se mueve al padre del scope funcion
            this.scopeActual = this.scopeActual.parent_scope!;
        }        
    }
    analizar_para(nodo: NodoInstruccion){
        //se espera la estructura -> hijos: NodoNoTerminal(CondicionInicialPara(Terminal(Identificador),NodoExpresion|Terminal)), NodoExpresion|Terminal, Terminal [, Instrucciones]
        let variableCondicionInicial = ((nodo.hijos[0] as Nodo).hijos[0] as Terminal).token;
        let expresionCondicionInicial = ((nodo.hijos[0] as Nodo).hijos[1] as NodoExpresion|Terminal);
        let condicion = nodo.hijos[1] as NodoExpresion|Terminal;        
        
        let resultadoTabla: Atributo|undefined = this.scopeActual.lookup(variableCondicionInicial.lexema);
        
        //Se crea la tabla de simbolos del ciclo
        let scopePara: TablaDeSimbolos = new TablaDeSimbolos(new Scope(ScopeType.Ciclo, "Para", true), this.scopeActual);
        this.scopeActual.agregarInnerScope(scopePara);
        
        //Si se obtiene un resultado de la tabla significa que la variable ya fue declarada una vez
        if (resultadoTabla != undefined) {
            this.listaErrores.agregarErrorParametros(variableCondicionInicial.lexema, variableCondicionInicial.linea, variableCondicionInicial.columna, "La variable ya ha sido declarada una vez")
        } else {
            scopePara.insertar(variableCondicionInicial.lexema, new AtributoVariable(variableCondicionInicial.lexema, TipoDato.Int, true, [variableCondicionInicial.linea, variableCondicionInicial.columna]));
        }        

        //Se comprueba la validez de la expresion inicial
        try{
            let tipoExpresion: TipoDato = this.analizar_expresion(expresionCondicionInicial);
            let casteoCorrecto: boolean = TablaCasteo.comprobar_casteo_permitido(tipoExpresion, TipoDato.Int);
            if (!casteoCorrecto) {
                this.listaErrores.agregarErrorParametros("PARA, CONDICION_INICIAL", this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo), "La expresion de tipo: "+TipoDato[tipoExpresion]+" no puede ser casteada al tipo: Int");
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

        //Se comprueba la validez de la expresion condicional        
        try{
            this.scopeActual = scopePara;
            let tipoExpresion: TipoDato = this.analizar_expresion(condicion);
            let casteoCorrecto: boolean = TablaCasteo.comprobar_casteo_permitido(tipoExpresion, TipoDato.Boolean);
            if (!casteoCorrecto) {
                this.listaErrores.agregarErrorParametros("PARA", this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo), "La expresion de tipo: "+TipoDato[tipoExpresion]+" no puede ser casteada al tipo: Boolean");
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
        
        this.scopeActual = this.scopeActual.parent_scope!;
        
        if (nodo.hijos[3] != undefined) {
            //El scope se mueve al scope de la funcion y se agrega el tipo de retorno al stack
            this.scopeActual = scopePara;
            //se analizan las intrucciones de la funcion
            this.analizar_instrucciones(nodo.hijos[3] as NodoNoTerminal);
            
            let retornable:boolean = this.analizar_retornabilidad(this.scopeActual);
            
            this.scopeActual.scope.retornabilidad = retornable;

            //El scope se mueve al padre del scope funcion
            this.scopeActual = this.scopeActual.parent_scope!;
        }        
    }
    analizar_si(nodo: NodoInstruccion){
        try{
            let tipoExpresion: TipoDato = this.analizar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal));
            let casteoCorrecto: boolean = TablaCasteo.comprobar_casteo_permitido(tipoExpresion, TipoDato.Boolean);
            if (!casteoCorrecto) {
                this.listaErrores.agregarErrorParametros("SI", this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo), "La expresion de tipo: "+TipoDato[tipoExpresion]+" no puede ser casteada al tipo: Boolean");
            }
        } catch (error) {
            if (error instanceof ErrorTipoOperacion) {
                let lineaError = error.posicion[0]
                let columnaError = error.posicion[1]
                let primerTipo = TipoDato[error.primerTipo];
                let segundoTipo = TipoDato[error.segundoTipo];
                let operacion = error.operacion;
                this.listaErrores.agregarErrorParametros("SI, EXPRESION", lineaError, columnaError, "La expresion tiene una operacion "+operacion+" entre un:"+primerTipo+" y un "+segundoTipo+", lo cual no es posible");
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
        
        //Se crea la tabla de simbolos de la condicion
        let scopeSi: TablaDeSimbolos = new TablaDeSimbolos(new Scope(ScopeType.Condicion, "Si", true), this.scopeActual);
        this.scopeActual.agregarInnerScope(scopeSi);

        if (nodo.hijos.length > 1) {
            //El scope se mueve al scope del si
            this.scopeActual = scopeSi;
            
            if (nodo.hijos[1] instanceof NodoInstruccion) {
                //El scope se mueve al padre del scope funcion
                this.scopeActual = this.scopeActual.parent_scope!;

                this.analizar_sino(nodo.hijos[1] as NodoInstruccion);
            } else {
                //se analizan las intrucciones de la funcion
                this.analizar_instrucciones(nodo.hijos[1] as NodoNoTerminal);
                let retornable:boolean = this.analizar_retornabilidad(this.scopeActual);
                this.scopeActual.scope.retornabilidad = retornable;
                if (nodo.hijos.length > 2) {
                    //El scope se mueve al padre del scope funcion
                    this.scopeActual = this.scopeActual.parent_scope!;

                    this.analizar_sino(nodo.hijos[2] as NodoInstruccion);
                } else {
                    //El scope se mueve al padre del scope funcion
                    this.scopeActual = this.scopeActual.parent_scope!;
                }
            }
            
            
        }        
    }
    analizar_sino(nodo: NodoInstruccion){
        //Se crea la tabla de simbolos de la condicion
        let scopeSino: TablaDeSimbolos = new TablaDeSimbolos(new Scope(ScopeType.Condicion, "Sino", true), this.scopeActual);
        this.scopeActual.agregarInnerScope(scopeSino);
        
        if (nodo.hijos.length > 1) {
            //El scope se mueve al scope de la funcion y se agrega el tipo de retorno al stack
            this.scopeActual = scopeSino;
            //se analizan las intrucciones de la funcion
            this.analizar_instrucciones(nodo.hijos[1] as NodoNoTerminal);
            
            let retornable:boolean = this.analizar_retornabilidad(this.scopeActual);
            
            this.scopeActual.scope.retornabilidad = retornable;

            //El scope se mueve al padre del scope funcion
            this.scopeActual = this.scopeActual.parent_scope!;
        }        
    }
    
    //Puede arrojar ErrorTipoOperacion si la expresion tiene una expresion entre dos tipos prohibida
    analizar_expresion(nodo: NodoExpresion|Terminal|NodoInstruccion): TipoDato{
        //Cuando se encuentre un terminal se devolvera su tipo
        if (nodo instanceof Terminal) {
            if (nodo instanceof TerminalTipoDato) {
                let valor: TipoDato = nodo.tipoDato;
                return valor;
            } else { //En caso de que sea una variable se buscara en la tabla de simbolos
                let variable: Atributo|undefined = this.scopeActual.lookup(nodo.token.lexema);
                if (variable == undefined) {
                    throw new ErrorVariableNoDefinida("La variable a la que se intenta acceder no ha sido declarada", nodo.token);
                } else if ((variable as AtributoVariable).inicializacion === false) {
                    throw new ErrorVariableNoInicializada("La variable a la que se intenta acceder puede no haber sido inicializada", nodo.token);
                } else {
                    return variable.tipo;                    
                }
            }
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
        } else if (nodo instanceof NodoExpresion) {
            let primerTipo: TipoDato;
            let segundoTipo: TipoDato;
            let tipoResultante: TipoDato|undefined;
            switch (nodo.operador) {
                //Para las operaciones aritmeticas se comprueba si las operaciones son validas entre los tipos
                case TipoExpresionMatematica.Suma:
                    primerTipo = this.analizar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal|NodoInstruccion));
                    segundoTipo = this.analizar_expresion(nodo.hijos[1] as (NodoExpresion|Terminal|NodoInstruccion));
                    tipoResultante = TablaCasteo.encontrar_tipo_objetivo(primerTipo!, segundoTipo!, 0);
                    if (tipoResultante == undefined) {
                        throw new ErrorTipoOperacion("No se permite la operacion matematica", primerTipo!, segundoTipo!, "SUMA", [this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo)]);                        
                    } else {
                        return tipoResultante;
                    }
                case TipoExpresionMatematica.Resta:
                    primerTipo = this.analizar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal|NodoInstruccion));
                    segundoTipo = this.analizar_expresion(nodo.hijos[1] as (NodoExpresion|Terminal|NodoInstruccion));
                    tipoResultante = TablaCasteo.encontrar_tipo_objetivo(primerTipo!, segundoTipo!, 1);
                    if (tipoResultante == undefined) {
                        throw new ErrorTipoOperacion("No se permite la operacion matematica", primerTipo!, segundoTipo!, "RESTA", [this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo)]);                        
                    } else {
                        return tipoResultante;
                    }
                case TipoExpresionMatematica.Multiplicacion:
                    primerTipo = this.analizar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal|NodoInstruccion));
                    segundoTipo = this.analizar_expresion(nodo.hijos[1] as (NodoExpresion|Terminal|NodoInstruccion));
                    tipoResultante = TablaCasteo.encontrar_tipo_objetivo(primerTipo!, segundoTipo!, 2);
                    if (tipoResultante == undefined) {
                        throw new ErrorTipoOperacion("No se permite la operacion matematica", primerTipo!, segundoTipo!, "MULTIPLICACION", [this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo)]);                        
                    } else {
                        return tipoResultante;
                    }
                case TipoExpresionMatematica.Division:
                    primerTipo = this.analizar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal|NodoInstruccion));
                    segundoTipo = this.analizar_expresion(nodo.hijos[1] as (NodoExpresion|Terminal|NodoInstruccion));
                    tipoResultante = TablaCasteo.encontrar_tipo_objetivo(primerTipo!, segundoTipo!, 3);
                    if (tipoResultante == undefined) {
                        throw new ErrorTipoOperacion("No se permite la operacion matematica", primerTipo!, segundoTipo!, "DIVISION", [this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo)]);                        
                    } else {
                        return tipoResultante;
                    }
                case TipoExpresionMatematica.Modulo:
                    primerTipo = this.analizar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal|NodoInstruccion));
                    segundoTipo = this.analizar_expresion(nodo.hijos[1] as (NodoExpresion|Terminal|NodoInstruccion));
                    tipoResultante = TablaCasteo.encontrar_tipo_objetivo(primerTipo!, segundoTipo!, 4);
                    if (tipoResultante == undefined) {
                        throw new ErrorTipoOperacion("No se permite la operacion matematica", primerTipo!, segundoTipo!, "MODULO", [this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo)]);                        
                    } else {
                        return tipoResultante;
                    }
                case TipoExpresionMatematica.Potencia:
                    primerTipo = this.analizar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal|NodoInstruccion));
                    segundoTipo = this.analizar_expresion(nodo.hijos[1] as (NodoExpresion|Terminal|NodoInstruccion));
                    tipoResultante = TablaCasteo.encontrar_tipo_objetivo(primerTipo!, segundoTipo!, 5);
                    if (tipoResultante == undefined) {
                        throw new ErrorTipoOperacion("No se permite la operacion matematica", primerTipo!, segundoTipo!, "POTENCIA", [this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo)]);                        
                    } else {
                        return tipoResultante;
                    }
                case TipoExpresionMatematica.Grupo:
                    tipoResultante = this.analizar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal|NodoInstruccion));
                    return tipoResultante;
                case TipoExpresionMatematica.MenosUnitario:
                    primerTipo = this.analizar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal|NodoInstruccion));
                    tipoResultante = TablaCasteo.encontrar_tipo_objetivo(primerTipo!, TipoDato.Double, 2);
                    if (tipoResultante == undefined) {
                        throw new ErrorTipoOperacion("No se permite la operacion relacional", primerTipo!, segundoTipo!, "MENOS_UNITARIO", [this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo)]);                        
                    } else {
                        return tipoResultante;
                    }
                case TipoExpresionRelacional.MayorQue:
                    primerTipo = this.analizar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal|NodoInstruccion));
                    segundoTipo = this.analizar_expresion(nodo.hijos[1] as (NodoExpresion|Terminal|NodoInstruccion));
                    if(primerTipo == segundoTipo){
                        return TipoDato.Boolean;
                    } else if ((primerTipo == TipoDato.Int || primerTipo == TipoDato.Double) && (segundoTipo == TipoDato.Int || segundoTipo == TipoDato.Double)) {
                        return TipoDato.Boolean;
                    } else {
                        throw new ErrorTipoOperacion("No se permite la operacion relacional", primerTipo!, segundoTipo!, "MAYOR_QUE", [this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo)]);                        
                    }
                case TipoExpresionRelacional.MenorQue:
                    primerTipo = this.analizar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal|NodoInstruccion));
                    segundoTipo = this.analizar_expresion(nodo.hijos[1] as (NodoExpresion|Terminal|NodoInstruccion));
                    if(primerTipo == segundoTipo){
                        return TipoDato.Boolean;
                    } else if ((primerTipo == TipoDato.Int || primerTipo == TipoDato.Double) && (segundoTipo == TipoDato.Int || segundoTipo == TipoDato.Double)) {
                        return TipoDato.Boolean;
                    } else {
                        throw new ErrorTipoOperacion("No se permite la operacion relacional", primerTipo!, segundoTipo!, "MENOR_QUE", [this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo)]);                        
                    }
                case TipoExpresionRelacional.MayorIgualQue:
                    primerTipo = this.analizar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal|NodoInstruccion));
                    segundoTipo = this.analizar_expresion(nodo.hijos[1] as (NodoExpresion|Terminal|NodoInstruccion));
                    if(primerTipo == segundoTipo){
                        return TipoDato.Boolean;
                    } else if ((primerTipo == TipoDato.Int || primerTipo == TipoDato.Double) && (segundoTipo == TipoDato.Int || segundoTipo == TipoDato.Double)) {
                        return TipoDato.Boolean;
                    } else {
                        throw new ErrorTipoOperacion("No se permite la operacion relacional", primerTipo!, segundoTipo!, "MAYOR_IGUAL_QUE", [this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo)]);                        
                    }
                case TipoExpresionRelacional.MenorIgualQue:
                    primerTipo = this.analizar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal|NodoInstruccion));
                    segundoTipo = this.analizar_expresion(nodo.hijos[1] as (NodoExpresion|Terminal|NodoInstruccion));
                    if(primerTipo == segundoTipo){
                        return TipoDato.Boolean;
                    } else if ((primerTipo == TipoDato.Int || primerTipo == TipoDato.Double) && (segundoTipo == TipoDato.Int || segundoTipo == TipoDato.Double)) {
                        return TipoDato.Boolean;
                    } else {
                        throw new ErrorTipoOperacion("No se permite la operacion relacional", primerTipo!, segundoTipo!, "MENOR_IGUAL_QUE", [this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo)]);                        
                    }
                case TipoExpresionRelacional.Igualdad:
                    primerTipo = this.analizar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal|NodoInstruccion));
                    segundoTipo = this.analizar_expresion(nodo.hijos[1] as (NodoExpresion|Terminal|NodoInstruccion));
                    if(primerTipo == segundoTipo){
                        return TipoDato.Boolean;
                    } else if ((primerTipo == TipoDato.Int || primerTipo == TipoDato.Double) && (segundoTipo == TipoDato.Int || segundoTipo == TipoDato.Double)) {
                        return TipoDato.Boolean;
                    } else {
                        throw new ErrorTipoOperacion("No se permite la operacion relacional", primerTipo!, segundoTipo!, "IGUALDAD", [this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo)]);                        
                    }
                case TipoExpresionRelacional.Diferencia:
                    primerTipo = this.analizar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal|NodoInstruccion));
                    segundoTipo = this.analizar_expresion(nodo.hijos[1] as (NodoExpresion|Terminal|NodoInstruccion));
                    if(primerTipo == segundoTipo){
                        return TipoDato.Boolean;
                    } else if ((primerTipo == TipoDato.Int || primerTipo == TipoDato.Double) && (segundoTipo == TipoDato.Int || segundoTipo == TipoDato.Double)) {
                        return TipoDato.Boolean;
                    } else {
                        throw new ErrorTipoOperacion("No se permite la operacion relacional", primerTipo!, segundoTipo!, "DIFERENCIA", [this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo)]);                        
                    }
                case TipoExpresionRelacional.Incerteza:
                    primerTipo = this.analizar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal|NodoInstruccion));
                    segundoTipo = this.analizar_expresion(nodo.hijos[1] as (NodoExpresion|Terminal|NodoInstruccion));
                    if(primerTipo == segundoTipo){
                        return TipoDato.Boolean;
                    } else if ((primerTipo == TipoDato.Int || primerTipo == TipoDato.Double) && (segundoTipo == TipoDato.Int || segundoTipo == TipoDato.Double)) {
                        return TipoDato.Boolean;
                    } else {
                        throw new ErrorTipoOperacion("No se permite la operacion relacional", primerTipo!, segundoTipo!, "INCERTEZA", [this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo)]);                        
                    }
                case TipoExpresionLogica.And:
                    primerTipo = this.analizar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal|NodoInstruccion));
                    segundoTipo = this.analizar_expresion(nodo.hijos[1] as (NodoExpresion|Terminal|NodoInstruccion));
                    if((primerTipo == segundoTipo) && primerTipo == TipoDato.Boolean){
                        return TipoDato.Boolean;
                    } else {
                        throw new ErrorTipoOperacion("No se permite la operacion logica", primerTipo!, segundoTipo!, "AND", [this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo)]);                        
                    }
                case TipoExpresionLogica.Or:
                    primerTipo = this.analizar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal|NodoInstruccion));
                    segundoTipo = this.analizar_expresion(nodo.hijos[1] as (NodoExpresion|Terminal|NodoInstruccion));
                    if((primerTipo == segundoTipo) && primerTipo == TipoDato.Boolean){
                        return TipoDato.Boolean;
                    } else {
                        throw new ErrorTipoOperacion("No se permite la operacion logica", primerTipo!, segundoTipo!, "OR", [this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo)]);                        
                    }
                case TipoExpresionLogica.Xor:
                    primerTipo = this.analizar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal|NodoInstruccion));
                    segundoTipo = this.analizar_expresion(nodo.hijos[1] as (NodoExpresion|Terminal|NodoInstruccion));
                    if((primerTipo == segundoTipo) && primerTipo == TipoDato.Boolean){
                        return TipoDato.Boolean;
                    } else {
                        throw new ErrorTipoOperacion("No se permite la operacion logica", primerTipo!, segundoTipo!, "XOR", [this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo)]);                        
                    }
                case TipoExpresionLogica.Not:
                    primerTipo = this.analizar_expresion(nodo.hijos[0] as (NodoExpresion|Terminal|NodoInstruccion));
                    if(primerTipo == TipoDato.Boolean){
                        return TipoDato.Boolean;
                    } else {
                        throw new ErrorTipoOperacion("No se permite la operacion logica", primerTipo!, segundoTipo!, "NOT", [this.utilidaddes.obtenerLineaNodo(nodo), this.utilidaddes.obtenerColumnaNodo(nodo)]);                        
                    }
                default:
                    throw new Error("Error al realizar operacion");
            }
        } else {
            throw new Error("Error al realizar operacion");
        }
    }
}

export class TablaCasteo{
    static readonly tipo_datos: Map<string, number> = new Map([["Boolean",0],["Double",1],["String",2],["Int",3],["Char",4]])
    //La tabla tiene el tipo destino para cada operacion para cada dato origen
    //Si un tipo es undefined significa que es incompatible
    static readonly casteo_boolean: (TipoDato|undefined)[][] = [
        //Suma
        [TipoDato.Double, TipoDato.Double, TipoDato.String, TipoDato.Int, undefined],
        //Resta
        [undefined, TipoDato.Double, undefined, TipoDato.Int, undefined],
        //Multiplicacion
        [undefined, TipoDato.Double, undefined, TipoDato.Int, undefined],
        //Division
        [undefined, TipoDato.Double, undefined, TipoDato.Double, undefined],
        //Modulo
        [undefined, TipoDato.Double, undefined, TipoDato.Int, undefined],
        //Potencia
        [undefined, TipoDato.Double, undefined, TipoDato.Int, undefined],
    ]

    static readonly casteo_double: (TipoDato|undefined)[][] = [
        //Suma
        [TipoDato.Double, TipoDato.Double, TipoDato.String, TipoDato.Double, TipoDato.Double],
        //Resta, Multiplicacion, Division, Modulo, Potencia
        [TipoDato.Double, TipoDato.Double, undefined, TipoDato.Double, TipoDato.Double],
        [TipoDato.Double, TipoDato.Double, undefined, TipoDato.Double, TipoDato.Double],
        [TipoDato.Double, TipoDato.Double, undefined, TipoDato.Double, TipoDato.Double],
        [TipoDato.Double, TipoDato.Double, undefined, TipoDato.Double, TipoDato.Double],
        [TipoDato.Double, TipoDato.Double, undefined, TipoDato.Double, TipoDato.Double],
    ]

    static readonly casteo_string: (TipoDato|undefined)[][] = [
        //Suma
        [TipoDato.String, TipoDato.String, TipoDato.String, TipoDato.String, TipoDato.String],
        //Resta, Multiplicacion, Division, Modulo, Potencia
        [undefined, undefined, undefined, undefined, undefined],
        [undefined, undefined, undefined, undefined, undefined],
        [undefined, undefined, undefined, undefined, undefined],
        [undefined, undefined, undefined, undefined, undefined],
        [undefined, undefined, undefined, undefined, undefined],
    ]

    static readonly casteo_int: (TipoDato|undefined)[][] = [
        //Suma
        [TipoDato.Int, TipoDato.Double, TipoDato.String, TipoDato.Int, TipoDato.Int],
        //Resta
        [TipoDato.Int, TipoDato.Double, undefined, TipoDato.Int, TipoDato.Int],
        //Multiplicacion
        [TipoDato.Int, TipoDato.Double, undefined, TipoDato.Int, TipoDato.Int],
        //Division
        [TipoDato.Double, TipoDato.Double, undefined, TipoDato.Double, TipoDato.Double],
        //Modulo
        [TipoDato.Double, TipoDato.Double, undefined, TipoDato.Double, TipoDato.Double],
        //Potencia
        [TipoDato.Double, TipoDato.Double, undefined, TipoDato.Int, TipoDato.Int],
    ]
    
    static readonly casteo_char: (TipoDato|undefined)[][] = [
        //Suma
        [undefined, TipoDato.Double, TipoDato.String, TipoDato.Int, TipoDato.Int],
        //Resta
        [undefined, TipoDato.Double, undefined, TipoDato.Int, TipoDato.Int],
        //Multiplicacion
        [undefined, TipoDato.Double, undefined, TipoDato.Int, TipoDato.Int],
        //Division
        [undefined, TipoDato.Double, undefined, TipoDato.Double, TipoDato.Double],
        //Modulo
        [undefined, TipoDato.Double, undefined, TipoDato.Double, TipoDato.Double],
        //Potencia
        [undefined, TipoDato.Double, undefined, TipoDato.Double, TipoDato.Double],
    ]
    
    //Es una tabla que indica hacia que tipos de datos se permite castear (cada fila es un tipo de dato de origen y cada columna uno de destino)
    static readonly casteos_permitidos: boolean[][] = [
        //Boolean
        [true, true, true, true, false],
        //Double
        [false, true, true, true, false],
        //String
        [false, false, true, false, false],
        //Int
        [false, true, true, true, true],
        //Char
        [false, true, true, true, true],
    ]
    
    static comprobar_casteo_permitido(tipoOrigen: TipoDato, tipoDestino: TipoDato){
        let indiceTipoOrigen: number = this.tipo_datos.get(TipoDato[tipoOrigen])!;
        let indiceTipoDestino: number = this.tipo_datos.get(TipoDato[tipoDestino])!;
        return this.casteos_permitidos[indiceTipoOrigen][indiceTipoDestino];
    }
    
    //Usando las tablas de casteo intenta encontrar el tipo de dato resultado de determinada operacion sobre dos tipos de datos
    static encontrar_tipo_objetivo(tipoOrigen: TipoDato, tipoDestino: TipoDato, operacion: number): TipoDato|undefined{
        console.log("tiposencontrar "+tipoOrigen+" "+tipoDestino+" "+operacion)
        let indiceTipo: number = this.tipo_datos.get(TipoDato[tipoDestino])!;
        switch (TipoDato[tipoOrigen]) {
            case "Boolean":
                return this.casteo_boolean[operacion][indiceTipo];
            case "Double":
                return this.casteo_double[operacion][indiceTipo];
            case "String":
                return this.casteo_string[operacion][indiceTipo];
            case "Int":
                return this.casteo_int[operacion][indiceTipo];
            case "Char":
                return this.casteo_char[operacion][indiceTipo];
            default:
                return undefined;
        }
    }
    
}

export class Parametro{
    tipo:TipoDato;
    identificador: Token;
    
    constructor(tipo: TipoDato, identificador: Token){
        this.tipo = tipo;
        this.identificador = identificador;
    }
}