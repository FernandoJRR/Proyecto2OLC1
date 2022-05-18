import { float } from "html2canvas/dist/types/css/property-descriptors/float";
import { ArchivoPreinterpretado, ControlConsola } from "src/app/app.component";
import { TipoDato } from "../ast/AST";
import { ErrorList } from "../manejo_error/ErrorList";
import { Atributo, AtributoFuncion, AtributoVariable, TablaDeSimbolos } from "../tabla_de_simbolos/TablaDeSimbolos";
import { Interpreter, ValorEvaluado } from "./Interpreter";

export class AdministradorProcesos{
    controlGlobal: ArchivoPreinterpretado[]
    controlErrores: ErrorList;
    
    controlOutput:ControlConsola;
    

    listadoAST: any[];
    listadoTablas: any[];
    dibujosExpresiones: any[];
    
    //Un stack que mantiene control sobre el valor de las variables de las llamadas de procedimientos
    stackSimbolos: RegistroScope[] = []
    stackLlamadas: TablaDeSimbolos[] = []
    
    stackInterpretes: Interpreter[] = []

    constructor(controlGlobal: ArchivoPreinterpretado[], controlErrores:ErrorList, controlOutput: ControlConsola, listadosDibujos: any[]){
        this.controlGlobal = controlGlobal;
        this.controlErrores = controlErrores;        
        this.controlOutput = controlOutput;        

        this.listadoAST = listadosDibujos[0];
        this.listadoTablas = listadosDibujos[1];
        this.dibujosExpresiones = listadosDibujos[2];
    }
    
    guardarAStack(registro:RegistroScope){
        this.stackSimbolos.push(registro);
    }
    
    restaurarDelStack(scope:TablaDeSimbolos){
        let registroStack = this.stackSimbolos.pop()!;
        this.restaurarRegistro(scope, registroStack);
    }
    
    restaurarRegistro(scope:TablaDeSimbolos, registro:RegistroScope){
        console.log("registro "+JSON.stringify(registro))
        for (const [llave,valor] of registro.simbolos) {
            scope.update_valor_variable(llave,valor);
        }        
        for (let i = 0; i < scope.nested_scopes.length; i++) {
            let anidado = scope.nested_scopes[i];
            let registro_anidado = registro.nested[i];
            
            this.restaurarRegistro(anidado, registro_anidado);
        }        
    }

    scopeARegistro(scope:TablaDeSimbolos){
        console.log("se guarda")
        let registrosAnidados:RegistroScope[] = [];
        scope.nested_scopes.forEach(anidado => {
            registrosAnidados.push(this.scopeARegistro(anidado)!);
        });            
        let registros = this.mapARegistro(scope.simbolos);
        return new RegistroScope(registros, registrosAnidados);
    }
    
    mapARegistro(simbolos:Map<string,Atributo>){
        let registro: Map<string,any> = new Map();
        for (const [llave,atributo] of simbolos) {
            if (atributo instanceof AtributoVariable) {
                let copia;
                switch (TipoDato[atributo.tipo]) {
                    case "Boolean":
                        copia = Boolean(atributo.valor)
                        break;
                    case "Double":
                        copia = Number(atributo.valor)
                        break;
                    case "String":
                        copia = String(atributo.valor)
                        break;
                    case "Int":
                        copia = Number(atributo.valor)
                        break;
                    case "Char":
                        copia = String(atributo.valor)
                        break;
                    default:
                        copia = String(atributo.valor)
                        break;
                }
                registro.set(llave, copia);
            }
        }
        return registro;
    }
    
    obtenerPreinterpretado(nombreArchivo:string){
        for (let i = 0; i < this.controlGlobal.length; i++) {
            const archivo = this.controlGlobal[i];
            
            if (archivo.nombreArchivo == nombreArchivo) {
                return archivo;
            }
        }
        return undefined;
    }
    
    obtenerScopeFuncion(tabla:TablaDeSimbolos, llave:string){
        for (let u = 0; u < tabla.nested_scopes.length; u++) {
            const anidado = tabla.nested_scopes[u];
            if (anidado.scope.scope_name == llave) {
                return anidado;
            }
        }
        return undefined;
    }
    
    pasarParametros(parametros:Map<string,ValorEvaluado>, tabla:TablaDeSimbolos){
        for (const [llave,valor] of parametros) {
            console.log("pasa parametro "+llave+" "+valor)
            tabla.update_valor_variable(llave,valor.valor);
        }
    }
    
    llamarProcedimiento(nombreArchivo: string, llave: string, parametros:Map<string,ValorEvaluado>){
        let preInterpretado = this.obtenerPreinterpretado(nombreArchivo)!;        
        let tablaDeSimbolos = preInterpretado.tablaDeSimbolos!;
        let funcion = tablaDeSimbolos.lookup(llave)! as AtributoFuncion;        
        let scopeFuncion = this.obtenerScopeFuncion(tablaDeSimbolos, llave)!;
        let instruccionesFuncion = funcion.instrucciones;        
        let tipoRetornoFuncion = funcion.tipo;
        let valorRetornado: ValorEvaluado[]|undefined;
        
        //Guardamos el estado actual de la funcion
        this.guardarAStack(this.scopeARegistro(scopeFuncion));
        
        if (this.stackSimbolos.length > 100) {
            return undefined;
        }
        
        let parametrosString = ""
        for (const [llave,valor] of parametros) {
            parametrosString += "["+llave+","+valor.valor+":"+valor.tipo+"]"
        }
        
        //Se pasan los parametros
        this.pasarParametros(parametros, scopeFuncion);
        //Ejecutamos el procedimiento
        if (instruccionesFuncion != undefined) {
            console.log("se llama a "+llave+"con parametros "+parametrosString)
            console.log("procesos activos "+this.stackSimbolos.length)
            console.log("ultimo proceso "+this.stackSimbolos[this.stackSimbolos.length-1])
            console.log("interpretes activos"+this.stackInterpretes.length)
            this.stackInterpretes.push(new Interpreter(preInterpretado.ast, tablaDeSimbolos, this.controlOutput, this.controlErrores, 
                                            [this.listadoAST,this.listadoTablas,this.dibujosExpresiones], this.controlGlobal, preInterpretado, this))
            valorRetornado = this.stackInterpretes[this.stackInterpretes.length-1].interpretar_funcion(instruccionesFuncion, scopeFuncion, tipoRetornoFuncion);
            this.stackInterpretes.pop()
            console.log("se acaba "+llave)
        }
        
        //Restauramos del stack
        this.restaurarDelStack(scopeFuncion);
        return valorRetornado;        
    }

}

function deepCopy<T>(instance : T) : T {
    if ( instance == null){
        return instance;
    }

    // handle Dates
    if (instance instanceof Date) {
        return new Date(instance.getTime()) as any;
    }

    // handle Array types
    if (instance instanceof Array){
        var cloneArr = [] as any[];
        (instance as any[]).forEach((value)  => {cloneArr.push(value)});
        // for nested objects
        return cloneArr.map((value: any) => deepCopy<any>(value)) as any;
    }
    // handle objects
    if (instance instanceof Object) {
        var copyInstance = { ...(instance as { [key: string]: any }
        ) } as { [key: string]: any };
        for (var attr in instance) {
            if ( (instance as Object).hasOwnProperty(attr)) 
                copyInstance[attr] = deepCopy<any>(instance[attr]);
        }
        return copyInstance as T;
    }
    // handling primitive data types
    return instance;
}

export class RegistroScope{
    simbolos: Map<string,any>;
    nested: RegistroScope[];

    constructor(simbolos:Map<string,any>, nested:RegistroScope[]){
        this.simbolos = simbolos;
        this.nested = nested;
    }
}