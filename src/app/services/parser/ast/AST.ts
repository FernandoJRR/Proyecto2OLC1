import { ErrorList } from "../manejo_error/ErrorList";
import { Token } from "../model/Token";

export class AST{
    raiz: NodoRaiz;
    
    constructor(){
        this.raiz = new NodoRaiz();
    }
    
    recorrer():void {
        recorrer(this.raiz,true);
    }
    
    recorrer_expresion(nodo: NodoExpresion|Terminal|NodoInstruccion){
        return recorrer(nodo,true);
    }
    
    recorrer_funcion(nodo: NodoNoTerminal){
        return recorrer(nodo,false);
    }
    
    obtenerRecorrido(): string|any{
        return recorrer(this.raiz,true);
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
        let nodo = new NodoInstruccion(TipoInstruccion.DibujarAST);
        
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

    nuevaInstruccionSino(sinoKW: Terminal): NodoInstruccion{
        let nodo =  new NodoInstruccion(TipoInstruccion.Sino);
        nodo.agregarHijo(sinoKW);        
        return nodo;        
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
    
    nuevosParametrosMostrar(parametros: (NodoExpresion|Terminal)[]): NodoNoTerminal {
        let nodoParametros = new NodoNoTerminal(TipoNoTerminal.ParametrosMostrar);

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
    
    nuevasInstrucciones(instrucciones: NodoInstruccion[], errores: ErrorList): NodoNoTerminal{
        let nodoInstrucciones = new NodoNoTerminal(TipoNoTerminal.Instrucciones);
        
        let posicionesParesSiSino: number[] = []
        
        //Se comprueba si las instrucciones contienen Si o Sino y si estas estan bien posicionadas        
        for (let i = 0; i < instrucciones.length; i++) {
            if (instrucciones[i].tipoInstruccion == TipoInstruccion.Sino) {
                if (i-1 >= 0) {
                    if (instrucciones[i-1].tipoInstruccion != TipoInstruccion.Si) {
                        //es un error que la instruccion antes de SINO no sea SI
                        errores.agregarErrorParametros("SINO", this.obtenerLineaNodo(instrucciones[i]), 0, "La instruccion SINO debe estar asociada a una instruccion SI");
                    } else {
                        posicionesParesSiSino.push(i-1);
                    }
                } else {
                    //es un error que la instruccion antes de SINO no exista
                    errores.agregarErrorParametros("SINO", this.obtenerLineaNodo(instrucciones[i]), 0, "La instruccion SINO debe estar asociada a una instruccion SI");
                }
            }
        }
        
        /*
        //Unimos las instrucciones SINO dentro de sus respectivas instrucciones SI
        posicionesParesSiSino.forEach(par => {
            let sinoActual:NodoInstruccion = instrucciones[par+1];
            instrucciones[par].agregarHijo(sinoActual);            
        });
        */
        
        //Eliminamos los SINO agregados de instrucciones
        instrucciones.forEach(function(item, index, object) {
        if (item.tipoInstruccion === TipoInstruccion.Si) {
            if (instrucciones[index+1] != undefined) {
                if (instrucciones[index+1].tipoInstruccion === TipoInstruccion.Sino) {
                    let sinoActual:NodoInstruccion = instrucciones[index+1];
                    instrucciones[index].agregarHijo(sinoActual);            
                    object.splice(index+1, 1);
                }
            }
        }
        });

        //Agregamos las instrucciones al nodo        
        instrucciones.forEach(instruccion => {
            nodoInstrucciones.agregarHijo(instruccion);
        });

        return nodoInstrucciones;
    }
    
    agregarInstruccionAPadreInstruccion(nodoPadre: NodoInstruccion, nodoHijo: NodoInstruccion, errores: ErrorList){
        let tipoInstruccion = nodoPadre.tipoInstruccion;
        let tipoInstruccionHijo = nodoHijo.tipoInstruccion; //Se comprueba si el nodo hijo tiene un nodo
        
        //Se comprueba si el nodo padre acepta hijos
        if (tipoInstruccion >= 12 && tipoInstruccion <= 16) {
            
            //Se comprueba si el nodo padre ya tiene un NodoNoTerminal de tipo Instrucciones
            if (nodoPadre.hijos[nodoPadre.hijos.length-1] instanceof NodoNoTerminal) {

                if ((nodoPadre.hijos[nodoPadre.hijos.length-1] as NodoNoTerminal).tipoNoTerminal == TipoNoTerminal.Instrucciones) {
                    
                    //Se comprueba si la instruccion que se quiere agregar es un SINO
                    if (tipoInstruccionHijo === TipoInstruccion.Sino) {
                        let nodoInstrucciones = (nodoPadre.hijos[nodoPadre.hijos.length-1] as NodoNoTerminal);
                        let instruccionAnterior = nodoInstrucciones.hijos[nodoInstrucciones.hijos.length-1] as NodoInstruccion;
                        //Si la instruccion anterior es un SI entonces se le agregara el SINO
                        if (instruccionAnterior.tipoInstruccion === TipoInstruccion.Si) {
                            //Se comprueba que la instruccion SI no tenga ya un sino
                            if (instruccionAnterior.hijos[instruccionAnterior.hijos.length-1] instanceof NodoInstruccion) {
                                //Es un error que se intente ingresar una instruccion SINO donde hay otra instruccion SINO
                                if ((instruccionAnterior.hijos[instruccionAnterior.hijos.length-1] as NodoInstruccion).tipoInstruccion === TipoInstruccion.Sino) { 
                                    errores.agregarErrorParametros("SINO", this.obtenerLineaNodo(nodoHijo), 0, "La instruccion SINO debe estar asociada a una instruccion SI");
                                    (nodoPadre.hijos[nodoPadre.hijos.length-1] as NodoNoTerminal).agregarHijo(nodoHijo);
                                } else {
                                    instruccionAnterior.agregarHijo(nodoHijo);       
                                }
                            } else {
                                instruccionAnterior.agregarHijo(nodoHijo);       
                            }
                        } else { //Es un error que la instruccion SINO no sea precedida por una instruccion SI
                            errores.agregarErrorParametros("SINO", this.obtenerLineaNodo(nodoHijo), 0, "La instruccion SINO debe estar asociada a una instruccion SI");
                            (nodoPadre.hijos[nodoPadre.hijos.length-1] as NodoNoTerminal).agregarHijo(nodoHijo);
                        }
                    } else {
                        (nodoPadre.hijos[nodoPadre.hijos.length-1] as NodoNoTerminal).agregarHijo(nodoHijo);
                    }
                    
                    
                    
                } else { //En caso de que no se agrega un NodoNoTerminal de tipo Instrucciones
                    nodoPadre.agregarHijo(new NodoNoTerminal(TipoNoTerminal.Instrucciones));
                    
                    //Es un error que la primera instruccion sea SINO
                    if (tipoInstruccionHijo === TipoInstruccion.Sino) {
                        errores.agregarErrorParametros("SINO", this.obtenerLineaNodo(nodoHijo), 0, "La instruccion SINO debe estar asociada a una instruccion SI");
                    }
                    
                    (nodoPadre.hijos[nodoPadre.hijos.length-1] as NodoNoTerminal).agregarHijo(nodoHijo);
                }
                
            } else { //En caso de que no se agrega un NodoNoTerminal de tipo Instrucciones
                nodoPadre.agregarHijo(new NodoNoTerminal(TipoNoTerminal.Instrucciones));
                
                //Es un error que la primera instruccion sea SINO
                if (tipoInstruccionHijo === TipoInstruccion.Sino) {
                    errores.agregarErrorParametros("SINO", this.obtenerLineaNodo(nodoHijo), 0, "La instruccion SINO debe estar asociada a una instruccion SI");
                }

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
    
    obtenerColumnaNodo(nodo: Nodo|Terminal): number{
        if (nodo instanceof Terminal) {
            return (nodo as Terminal).token.columna;
        } else {
            return this.obtenerColumnaNodo(nodo.hijos[0]);
        }
    }
}


//Se interpreta el AST nodo por nodo recursivamente
function recorrer(nodo: Nodo | Terminal, conExpresiones: boolean): string|any {
    //Se obtiene la clase de nodo que se esta interpretando
    let objetoNodo:any = {name: "", childs: []}
    let hijos:any = []    

    if (nodo instanceof Nodo) {
        if (nodo instanceof NodoRaiz) {											//se espera la estructura -> hijos: instruccion, instruccion,...,instruccion

            objetoNodo["name"] = "Programa"
            
            nodo.hijos.forEach(hijo => {
                hijos.push(recorrer(hijo,conExpresiones));
            });
            
            objetoNodo["childs"] = hijos;
            return objetoNodo;
            
        } else if (nodo instanceof NodoInstruccion) {
            
            objetoNodo["name"] = "Instruccion"
            switch (nodo.tipoInstruccion) {
                case TipoInstruccion.Importacion:								//se espera la estructura -> hijos: Terminal(Token(Archivo))
                    
                    objetoNodo["name"] = "Importacion";
                    hijos.push(recorrer(nodo.hijos[0],conExpresiones));
                    objetoNodo["childs"] = hijos;
                    return objetoNodo;

                case TipoInstruccion.Incerteza:									//se espera la estructura -> hijos: NodoExpresion

                    objetoNodo["name"] = "Incerteza"
                    hijos.push(recorrer(nodo.hijos[0],conExpresiones));
                    
                    objetoNodo["childs"] = hijos;
                    return objetoNodo;
                    
                case TipoInstruccion.DeclaracionVariable:						//se espera la estructura -> hijos: TerminalTipodato(TipoDato), NodoNoTerminal(Identificadores) [, NodoExpresion|Terminal]?
                    
                    objetoNodo["name"] = "Declaracion Variable"
                    hijos.push(recorrer(nodo.hijos[0],conExpresiones));
                    hijos.push(recorrer(nodo.hijos[1],conExpresiones));
                    if (nodo.hijos.length === 3) {
                        hijos.push(recorrer(nodo.hijos[2],conExpresiones));
                    }
                    objetoNodo["childs"] = hijos;
                    return objetoNodo;
                    
                case TipoInstruccion.Asignacion:                                //se espera la estructura -> hijos: Terminal(Token(Identificador)), NodoExpresion|Terminal
                    
                    objetoNodo["name"] = "Asignacion"
                    hijos.push(recorrer(nodo.hijos[0],conExpresiones));
                    hijos.push(recorrer(nodo.hijos[1],conExpresiones));
                    objetoNodo["childs"] = hijos;

                    return objetoNodo;                                       
                case TipoInstruccion.DeclaracionFuncion:                        //se espera la estructura -> hijos: TerminalTipoDato(TipoDato), Terminal(Token(Identificador)), NodoNoTerminal(DeclaracionParametros) [, Instrucciones]
                    objetoNodo["name"] = "Declaracion Funcion"
                    hijos.push(recorrer(nodo.hijos[0],conExpresiones));
                    hijos.push(recorrer(nodo.hijos[1],conExpresiones));
                    hijos.push(recorrer(nodo.hijos[2],conExpresiones));
                    if (nodo.hijos[3] != undefined) {
                        hijos.push(recorrer(nodo.hijos[3],conExpresiones));
                    }
                    
                    objetoNodo["childs"] = hijos;                    
                    return objetoNodo;
                case TipoInstruccion.LlamadaFuncion:                            //se espera la estructura -> hijos: Terminal(Identificador)[, NodoNoTerminal(Parametros)]
                    objetoNodo["name"] = "Llamada Funcion"
                    hijos.push(recorrer(nodo.hijos[0],conExpresiones));
                    if (nodo.hijos.length == 2) {
                        hijos.push(recorrer(nodo.hijos[1],conExpresiones));
                    }
                    objetoNodo["childs"] = hijos;
                    return objetoNodo;
                case TipoInstruccion.Continuar:                                 //se espera la estrcutura -> hijos: Terminal(Continuar)
                    objetoNodo["name"] = "Continuar"
                    return objetoNodo;
                case TipoInstruccion.Detener:                                   //se espera la estructura -> hijos: Terminal(Detener)
                    objetoNodo["name"] = "Detener"
                    return objetoNodo;
                case TipoInstruccion.Retorno:                                   //se espera la estructura -> hijos: Terminal(Retorno) [, NodoExpresion|Terminal]
                    objetoNodo["name"] = "Retorno"
                    if(nodo.hijos.length == 2){
                        hijos.push(recorrer(nodo.hijos[1],conExpresiones));                        
                    }
                    objetoNodo["childs"] = hijos;
                    
                    return objetoNodo;
                case TipoInstruccion.Mostrar:
                    objetoNodo["name"] = "Mostrar"
                    hijos.push(recorrer(nodo.hijos[0],conExpresiones));
                    objetoNodo["childs"] = hijos;
                    return objetoNodo;
                case TipoInstruccion.DibujarAST:                                //se espera la estructura -> hijos: Terminal(Identificador) 
                    objetoNodo["name"] = "DibujarAST"
                    hijos.push(recorrer(nodo.hijos[0],conExpresiones));
                    objetoNodo["childs"] = hijos;
                    return objetoNodo;
                case TipoInstruccion.DibujarTabla:                              //se espera la estructura -> hijos:
                    objetoNodo["name"] = "DibujarTabla"
                    return objetoNodo;
                case TipoInstruccion.DibujarExpresion:                          //se espera la estructura -> hijos: NodoExpresion|Terminal
                    objetoNodo["name"] = "DibujarExpresion"
                    hijos.push(recorrer(nodo.hijos[0],conExpresiones));
                    objetoNodo["childs"] = hijos;
                    return objetoNodo;
                case TipoInstruccion.Mientras:                                  //se espera la estructura -> hijos: NodoExpresion|Terminal [, Instrucciones]
                    objetoNodo["name"] = "Mientras"
                    hijos.push(recorrer(nodo.hijos[0],conExpresiones));
                    hijos.push(recorrer(nodo.hijos[1],conExpresiones));
                    objetoNodo["childs"] = hijos;
                    return objetoNodo;
                case TipoInstruccion.Para:                                      //se espera la estructura -> hijos: NodoNoTerminal(CondicionInicialPara(Terminal(Identificador),NodoExpresion|Terminal)), NodoExpresion|Terminal, Terminal [, Instrucciones]
                    objetoNodo["name"] = "Para"
                    hijos.push(recorrer(nodo.hijos[0],conExpresiones));
                    hijos.push(recorrer(nodo.hijos[1],conExpresiones));
                    hijos.push(recorrer(nodo.hijos[2],conExpresiones));
                    let instrucciones = "NADA";
                    
                    if (nodo.hijos.length == 4) {
                        instrucciones = recorrer(nodo.hijos[3],conExpresiones);
                        hijos.push(recorrer(nodo.hijos[3],conExpresiones));
                    }
                    
                    objetoNodo["childs"] = hijos;
                    return objetoNodo;
                case TipoInstruccion.Si:                                        //se espera la estructura -> hijos: NodoExpresion|Terminal [,Instrucciones] [,Sino]
                    objetoNodo["name"] = "Si"
                    
                    hijos.push(recorrer(nodo.hijos[0],conExpresiones));
                    if (nodo.hijos[1] != undefined) {
                        hijos.push(recorrer(nodo.hijos[1],conExpresiones));
                    }
                    
                    if (nodo.hijos[2] != undefined) {
                        hijos.push(recorrer(nodo.hijos[2],conExpresiones));
                    }

                    objetoNodo["childs"] = hijos;
                    return objetoNodo;
                case TipoInstruccion.Sino:                                      //se espera la estructura -> hijos: Terminal(SINO) [, Instrucciones]
                    objetoNodo["name"] = "Sino"
                    if (nodo.hijos[1] != undefined) {
                        hijos.push(recorrer(nodo.hijos[1],conExpresiones));
                    }
                    objetoNodo["childs"] = hijos;
                    return objetoNodo;
                default:
                    objetoNodo["name"] = "ERROR"
                    break;
            }
            
        } else if (nodo instanceof NodoExpresion) {
            if(conExpresiones){
                switch (nodo.operador) {
                    case TipoExpresionMatematica.Suma:
                        objetoNodo["name"] = "+";
                        hijos.push(recorrer(nodo.hijos[0],conExpresiones));
                        hijos.push(recorrer(nodo.hijos[1],conExpresiones));
                        objetoNodo["childs"] = hijos; 
                        return objetoNodo;
                    case TipoExpresionMatematica.Resta:
                        objetoNodo["name"] = "-";
                        hijos.push(recorrer(nodo.hijos[0],conExpresiones));
                        hijos.push(recorrer(nodo.hijos[1],conExpresiones));
                        objetoNodo["childs"] = hijos; 
                        return objetoNodo;
                    case TipoExpresionMatematica.Multiplicacion:
                        objetoNodo["name"] = "*";
                        hijos.push(recorrer(nodo.hijos[0],conExpresiones));
                        hijos.push(recorrer(nodo.hijos[1],conExpresiones));
                        objetoNodo["childs"] = hijos; 
                        return objetoNodo;
                    case TipoExpresionMatematica.Division:
                        objetoNodo["name"] = "/";
                        hijos.push(recorrer(nodo.hijos[0],conExpresiones));
                        hijos.push(recorrer(nodo.hijos[1],conExpresiones));
                        objetoNodo["childs"] = hijos; 
                        return objetoNodo;
                    case TipoExpresionMatematica.Modulo:
                        objetoNodo["name"] = "%";
                        hijos.push(recorrer(nodo.hijos[0],conExpresiones));
                        hijos.push(recorrer(nodo.hijos[1],conExpresiones));
                        objetoNodo["childs"] = hijos; 
                        return objetoNodo;
                    case TipoExpresionMatematica.Potencia:
                        objetoNodo["name"] = "^";
                        hijos.push(recorrer(nodo.hijos[0],conExpresiones));
                        hijos.push(recorrer(nodo.hijos[1],conExpresiones));
                        objetoNodo["childs"] = hijos; 
                        return objetoNodo;
                    case TipoExpresionMatematica.Grupo:
                        objetoNodo["name"] = "( )";
                        hijos.push(recorrer(nodo.hijos[0],conExpresiones));
                        objetoNodo["childs"] = hijos; 
                        return objetoNodo;
                    case TipoExpresionMatematica.MenosUnitario:
                        objetoNodo["name"] = "-";
                        hijos.push(recorrer(nodo.hijos[0],conExpresiones));
                        objetoNodo["childs"] = hijos; 
                        return objetoNodo;
                    case TipoExpresionRelacional.MayorQue:
                        objetoNodo["name"] = ">";
                        hijos.push(recorrer(nodo.hijos[0],conExpresiones));
                        hijos.push(recorrer(nodo.hijos[1],conExpresiones));
                        objetoNodo["childs"] = hijos; 
                        return objetoNodo;
                    case TipoExpresionRelacional.MenorQue:
                        objetoNodo["name"] = "<";
                        hijos.push(recorrer(nodo.hijos[0],conExpresiones));
                        hijos.push(recorrer(nodo.hijos[1],conExpresiones));
                        objetoNodo["childs"] = hijos; 
                        return objetoNodo;
                    case TipoExpresionRelacional.MayorIgualQue:
                        objetoNodo["name"] = ">=";
                        hijos.push(recorrer(nodo.hijos[0],conExpresiones));
                        hijos.push(recorrer(nodo.hijos[1],conExpresiones));
                        objetoNodo["childs"] = hijos; 
                        return objetoNodo;
                    case TipoExpresionRelacional.MenorIgualQue:
                        objetoNodo["name"] = "<=";
                        hijos.push(recorrer(nodo.hijos[0],conExpresiones));
                        hijos.push(recorrer(nodo.hijos[1],conExpresiones));
                        objetoNodo["childs"] = hijos; 
                        return objetoNodo;
                    case TipoExpresionRelacional.Igualdad:
                        objetoNodo["name"] = "==";
                        hijos.push(recorrer(nodo.hijos[0],conExpresiones));
                        hijos.push(recorrer(nodo.hijos[1],conExpresiones));
                        objetoNodo["childs"] = hijos; 
                        return objetoNodo;
                    case TipoExpresionRelacional.Diferencia:
                        objetoNodo["name"] = "!=";
                        hijos.push(recorrer(nodo.hijos[0],conExpresiones));
                        hijos.push(recorrer(nodo.hijos[1],conExpresiones));
                        objetoNodo["childs"] = hijos; 
                        return objetoNodo;
                    case TipoExpresionRelacional.Incerteza:
                        objetoNodo["name"] = "~";
                        hijos.push(recorrer(nodo.hijos[0],conExpresiones));
                        hijos.push(recorrer(nodo.hijos[1],conExpresiones));
                        objetoNodo["childs"] = hijos; 
                        return objetoNodo;
                    case TipoExpresionLogica.And:
                        objetoNodo["name"] = "&&";
                        hijos.push(recorrer(nodo.hijos[0],conExpresiones));
                        hijos.push(recorrer(nodo.hijos[1],conExpresiones));
                        objetoNodo["childs"] = hijos; 
                        return objetoNodo;
                    case TipoExpresionLogica.Or:
                        objetoNodo["name"] = "||";
                        hijos.push(recorrer(nodo.hijos[0],conExpresiones));
                        hijos.push(recorrer(nodo.hijos[1],conExpresiones));
                        objetoNodo["childs"] = hijos; 
                        return objetoNodo;
                    case TipoExpresionLogica.Xor:
                        objetoNodo["name"] = "|&";
                        hijos.push(recorrer(nodo.hijos[0],conExpresiones));
                        hijos.push(recorrer(nodo.hijos[1],conExpresiones));
                        objetoNodo["childs"] = hijos; 
                        return objetoNodo;
                    case TipoExpresionLogica.Not:
                        objetoNodo["name"] = "!";
                        hijos.push(recorrer(nodo.hijos[0],conExpresiones));
                        objetoNodo["childs"] = hijos; 
                        return objetoNodo;
                    default:
                        objetoNodo["name"] = "ERROR";
                        return objetoNodo;
                }
            } else {
                objetoNodo["name"] = "Expresion"
                return objetoNodo;                    
            }
            

        } else if (nodo instanceof NodoNoTerminal) {

            switch (nodo.tipoNoTerminal) {
                case TipoNoTerminal.Identificadores:                            //se espera estructura -> hijos: Terminal(Token(Identificador)),...,Terminal(Token(Identificador))
                    objetoNodo["name"] = "Identificadores";
                    nodo.hijos.forEach(hijo => {
                        hijos.push(recorrer(hijo,conExpresiones));
                    });
                    objetoNodo["childs"] = hijos;
                    return objetoNodo;
                case TipoNoTerminal.DeclaracionParametros:                      //se espera estructura -> hijos: [NodoNoTerminal(DeclaracionParametro),...,NodoNoTerminal(DeclaracionParametro)]
                    objetoNodo["name"] = "Declaracion Parametros";
                    nodo.hijos.forEach(hijo => {
                        hijos.push(recorrer(hijo,conExpresiones));
                    });
                    objetoNodo["childs"] = hijos;
                    return objetoNodo;
                case TipoNoTerminal.DeclaracionParametro:                       //Se espera estructura -> hijos: TerminalTipoDato(TipoDato), Terminal(Identificador)
                    objetoNodo["name"] = "Declaracion Parametro";
                    let tipoParametro = recorrer(nodo.hijos[0],conExpresiones);
                    let identificadorParametro = recorrer(nodo.hijos[1],conExpresiones);
                    hijos.push(recorrer(nodo.hijos[0],conExpresiones));
                    hijos.push(recorrer(nodo.hijos[1],conExpresiones));
                    objetoNodo["childs"] = hijos;
                    return objetoNodo;
                case TipoNoTerminal.Instrucciones:
                    objetoNodo["name"] = "Instrucciones";
                    nodo.hijos.forEach(hijo => {
                        hijos.push(recorrer(hijo,conExpresiones));
                    });
                    objetoNodo["childs"] = hijos;
                    return objetoNodo;
                case TipoNoTerminal.Parametros:                                 //se espera estructura -> hijos: NodoExpresion|Terminal,...,NodoExpresion|Terminal
                    objetoNodo["name"] = "Parametros";
                    nodo.hijos.forEach(hijo => {
                        hijos.push(recorrer(hijo,conExpresiones));
                    });
                    objetoNodo["childs"] = hijos;
                    return objetoNodo;
                case TipoNoTerminal.ParametrosMostrar:
                    objetoNodo["name"] = "Parametros Mostrar";
                    let stringMostrar = recorrer(nodo.hijos[0],conExpresiones);
                    hijos.push(recorrer(nodo.hijos[0],conExpresiones));
                    let parametros = "[";
                    for (let i = 1; i < nodo.hijos.length; i++) {
                        const hijo = nodo.hijos[i];
                        parametros += "{"+(i-1)+":"+recorrer(hijo,conExpresiones);+"}";
                        hijos.push(recorrer(hijo,conExpresiones));
                    }
                    parametros += "]";
                    objetoNodo["childs"] = hijos;
                    return objetoNodo;
                case TipoNoTerminal.CondicionInicialPara:
                    objetoNodo["name"] = "Condicion Inicial Para";
                    hijos.push(recorrer(nodo.hijos[0],conExpresiones));
                    hijos.push(recorrer(nodo.hijos[1],conExpresiones));
                    objetoNodo["childs"] = hijos;
                    return objetoNodo;
                default:
                    break;
            }
            
        } else {
            return {name: "ERROR"}
        } 
            
    } else if (nodo instanceof Terminal) {
        if (nodo instanceof TerminalTipoDato) {
            if (TipoDato[nodo.tipoDato] === nodo.token.lexema) {
                objetoNodo["name"] = TipoDato[nodo.tipoDato]
                objetoNodo["childs"] = hijos;
                return objetoNodo;
            } else {
                objetoNodo["name"] = nodo.token.lexema+" | "+TipoDato[nodo.tipoDato]
                objetoNodo["childs"] = hijos;
                return objetoNodo;
            }
        } else if (nodo instanceof Terminal) {
            objetoNodo["name"] = "Terminal"
            hijos.push({name: nodo.token.lexema})
            objetoNodo["childs"] = hijos;
            return objetoNodo;
        } else {
            return {name: "ERROR"}
        }
        
    } else {
        return {name: "ERROR"}
    }
}

export class Nodo{
    hijos: (Nodo|Terminal)[];   
    
    constructor(){
        this.hijos = [];
    }

    agregarHijo(hijo: Nodo | Terminal){
        this.hijos.push(hijo);       
    }
}

export class NodoRaiz extends Nodo{}
export class NodoInstruccion extends Nodo{
    tipoInstruccion: TipoInstruccion;

    constructor(tipoInstruccion: TipoInstruccion){
        super();
        this.tipoInstruccion = tipoInstruccion;
    }
}

export class NodoExpresion extends Nodo{
    operador: TipoExpresionMatematica | TipoExpresionRelacional | TipoExpresionLogica;
    
    constructor(operador: TipoExpresionMatematica | TipoExpresionRelacional | TipoExpresionLogica, expresiones: (NodoExpresion|NodoNoTerminal|Terminal)[] ){
        super();
        this.operador = operador;
        expresiones.forEach(expresion => {
            super.agregarHijo(expresion);
        });
    }
}

export class NodoNoTerminal extends Nodo{
    tipoNoTerminal: TipoNoTerminal;

    constructor(tipoNoTerminal: TipoNoTerminal){
        super();
        this.tipoNoTerminal = tipoNoTerminal;
    }
}

export class Terminal {
    token: Token

    constructor(token: Token){
        this.token = token;
    }
}

export class TerminalTipoDato extends Terminal{
    tipoDato: TipoDato;

    constructor(token: Token, tipoDato: TipoDato){
        super(token);
        this.tipoDato = tipoDato;
    }
}

//Cada tipo tiene asignada un booleano que indica si puede tener mas instrucciones dentro o no
export enum TipoInstruccion{
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

export enum TipoNoTerminal{
    Parametros,    
    Identificadores,
    DeclaracionParametro,
    DeclaracionParametros,
    CondicionInicialPara,
    
    Instrucciones,
    
    ParametrosMostrar
}


export enum TipoDato{
    Int,        //0
    Double,     //1
    String,     //2
    Char,       //3
    Boolean,    //4
    Void        //5
}

export enum TipoExpresionMatematica{
    Suma="SUMA",                        //Se espera -> expresion SUMA expresion
    Resta="RESTA",                      //Se espera -> expresion RESTA expresion
    Multiplicacion="MULTIPLICACION",    //Se espera -> expresion MULTIPLICACION expresion
    Division="DIVISION",                //Se espera -> expresion DIVISION expresion
    Modulo="MODULO",                    //Se espera -> expresion MODULO expresion
    Potencia="POTENCIA",                //Se espera -> expresion POTENCIA expresion
    MenosUnitario="MENOS_U",            //Se espera -> RESTA expresion
    Grupo="GRUPO"                       //Se espera -> PAR_IZQ expresion PAR_DER
}

export enum TipoExpresionRelacional{
    MayorQue="MAYOR_QUE",               //Se espera -> expresion MAYOR_QUE expresion
    MenorQue="MENOR_QUE",               //Se espera -> expresion MENOR_QUE expresion
    MayorIgualQue="MAYOR_IGUAL_QUE",    //Se espera -> expresion MAYOR_IGUAL_QUE expresion
    MenorIgualQue="MENOR_IGUAL_QUE",    //Se espera -> expresion MENOR_IGUAL_QUE expresion
    Igualdad="IGUALDAD",                //Se espera -> expresion IGUALDAD expresion
    Diferencia="DIFERENCIA",            //Se espera -> expresion DIFERENCIA expresion
    Incerteza="INCERTEZA"               //Se espera -> expresion INCERTEZA expresion
}

export enum TipoExpresionLogica{
    And="AND",      //Se espera -> expresion AND expresion
    Xor="XOR",      //Se espera -> expresion XOR expresion
    Or="OR",        //Se espera -> expresion OR expresion
    Not="NOT"       //Se espera -> NOT expresion
}