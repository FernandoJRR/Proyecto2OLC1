import { NodoNoTerminal, TipoDato } from "../ast/AST";
import { Parametro } from "../interpreter/SemanticAnalyzer";

export enum ScopeType{
    Global,
    Funcion,
    Ciclo,
    Condicion
}

export class Scope {
    type: ScopeType;
    scope_name: string|undefined; //El scope tendra un nombre en caso que sea local, si es global el nombre sera undefined
    
    anulabilidad: boolean;
    retornabilidad: boolean = false;
    tieneControl: boolean = false;
    constructor(type: ScopeType, scope_name: string|undefined, anulabilidad: boolean, retornabilidad?: boolean, tieneControl?: boolean) {
        this.type = type;
        this.scope_name = scope_name;
        this.anulabilidad = anulabilidad;
        if (retornabilidad != undefined) {
            this.retornabilidad = retornabilidad;
        }
        if (tieneControl != undefined) {
            this.tieneControl = tieneControl;
        }
    }
}

export class TablaDeSimbolos {
    scope: Scope;
    parent_scope: TablaDeSimbolos|undefined;
    
    simbolos: Map<string, Atributo>;
    
    nested_scopes: TablaDeSimbolos[]; 
    
    constructor(scope?: Scope, parent_scope?: TablaDeSimbolos) {
        if (scope == undefined) {
            this.scope = new Scope(ScopeType.Global, "Global", false, false);   
        } else {
            this.scope = scope;
        }
        
        if (parent_scope == undefined) {
            this.parent_scope = undefined
        } else {
            this.parent_scope = parent_scope;
        }
        
        this.simbolos = new Map();
        
        this.nested_scopes = [];        
    }
    
    insertar(llave: string, informacion:Atributo){
        this.simbolos.set(llave, informacion);
    }
    
    lookup(llave: string): Atributo|undefined {
        let valorRetorno: Atributo|undefined = this.simbolos.get(llave);
        if ((valorRetorno == undefined) && (this.parent_scope!=undefined)) {
            return this.parent_scope.lookup(llave);
        } else {
            return valorRetorno;
        }
    }
    
    update(llave: string, informacion:any){
        this.simbolos.set(llave, informacion);
    }
    
    update_up(llave: string, informacion: any){
        if (this.simbolos.get(llave) == undefined) {
            this.parent_scope?.update_up(llave,informacion);
        } else {
            this.simbolos.set(llave, informacion);
        }
    }
    
    update_valor_variable(llave: string, nuevoValor: any){
        let valorActual: AtributoVariable = this.lookup(llave) as AtributoVariable;
        valorActual.valor = nuevoValor;
        
        this.update_up(llave, valorActual);
    }
    
    agregarInnerScope(inner_scopes: TablaDeSimbolos) {
        this.nested_scopes.push(inner_scopes);
    }
    
    enCiclo(): boolean{
        if (this.scope.type == ScopeType.Ciclo) {
            return true;
        } else {
            if (this.parent_scope != undefined) {
                return this.parent_scope.enCiclo();
            } else {
                return false;
            }
        }
    }
    
    buscarFunciones(identificador: string, llaves: string[]): string[]{
        for (let [llave, valor] of this.simbolos) {
            if (llave.charAt(0) == '&') {
                let idFuncion = llave.slice(1, llave.length);
                idFuncion = idFuncion.split("|")[0];
                if (idFuncion === identificador) {
                    llaves.push(llave);
                }                
            }
        }
        if (this.parent_scope != null) {
            return this.parent_scope.buscarFunciones(identificador,llaves);
        } else {
            return llaves;
        }
    }
    
    buscarFuncionPadre(): string|undefined {
        if (this.scope.type == ScopeType.Funcion) {
            return this.scope.scope_name?.slice(1,this.scope.scope_name.length).split("|")[0];
        } else {
            if (this.parent_scope != undefined) {
                return this.parent_scope.buscarFuncionPadre();
            } else {
                return undefined;
            }
        }
    }
    
    generarTablaString(){
        let tablaString: string[][] = [];
        let ambitoFuncion = this.scope.type == ScopeType.Funcion? "":"Ambito: "+this.buscarFuncionPadre()!;
        let ambito = (ambitoFuncion==""? "Ambito: ":ambitoFuncion+"-> Subambito:")+(this.scope.type == ScopeType.Funcion?this.scope.scope_name?.slice(1,this.scope.scope_name.length).split("|")[0]:this.scope.scope_name)

        tablaString.push(["Ambito",ambito]);
        
        for (let [llave,valor] of this.simbolos) {
            if (valor instanceof AtributoVariable) {
                tablaString.push(["Variable "+llave+"\t", "Linea:"+valor.posicion![0]+" Columna: "+valor.posicion![1]+" Tipo: "+TipoDato[valor.tipo]+" Valor: "+valor.valor])
            } else if (valor instanceof AtributoFuncion) {
                tablaString.push(["Declaracion Funcion"+valor.nombre+"\t", "Linea:"+valor.posicion![0]+" Columna: "+valor.posicion![1]+" Tipo Retorno: "+TipoDato[valor.tipo]+" Parametros: "+valor.parametros])
            } else if (valor instanceof AtributoMostrar) {
                tablaString.push(["Formato Mostrar\t", "Linea:"+valor.posicion![0]]);
            }
        }
        return tablaString;
    }

    crearLlaveFuncion(identificador: string, tiposParametros: string[]){    //crea una llave para una funcion con el formato -> &identificadorparametro1parametro2
        let stringParametros = tiposParametros.sort().toString();
        return "&"+identificador+"|"+stringParametros;
    }

    crearLlaveDeParametrosNumeros(identificador: string, parametros: TipoDato[]){
        let stringParametros: string[] = [];
        parametros.forEach(parametro => {
            stringParametros.push(TipoDato[parametro]);
        });
        return this.crearLlaveFuncion(identificador, stringParametros);        
    }
    
    crearLlaveDeParametros(identificador: string, parametros: Parametro[]){
        let stringParametros = this.parametrosStringArray(parametros);
        return this.crearLlaveFuncion(identificador, stringParametros);        
    }
    
    parametrosStringArray(parametros: Parametro[]){
        let arregloString: string[] = [];
        parametros.forEach(parametro => {
            arregloString.push(TipoDato[parametro.tipo]);
        });
        return arregloString;        
    }
}

export class Atributo{
    nombre: string;
    tipo: TipoDato;    
    posicion: number[]|undefined; //[0] -> linea    [1] -> columna

    constructor(nombre: string, tipo: TipoDato, posicion?: number[]){
        this.nombre = nombre;
        this.tipo = tipo;
        this.posicion = posicion;        
    }
    
    agregarPosicion(posicion: number[]){
        this.posicion = posicion;
    }
}

export class AtributoVariable extends Atributo{
    valor: any;
    inicializacion: boolean;   
    
    constructor(nombre: string, tipo: TipoDato, inicializacion: boolean, posicion?: number[], valor?: any){
        super(nombre, tipo, posicion);        
        this.inicializacion = inicializacion;
        this.valor = valor;
    }

    agregarValor(valor:any){
        this.valor = valor;
    }
    
    inicializar(){
        this.inicializacion = true;
    }
}

export class AtributoFuncion extends Atributo{
    instrucciones: NodoNoTerminal|undefined;
    parametros: Parametro[];
    
    
    constructor(nombre: string, tipo: TipoDato, parametros: Parametro[], posicion?: number[], instrucciones?: NodoNoTerminal){
        super(nombre, tipo, posicion);        
        this.parametros = parametros;
        this.instrucciones = instrucciones;
    }
}

export class AtributoMostrar extends Atributo{
    mostrarFormato: (string|string[])[];
    
    constructor(nombre: string, tipo: TipoDato, mostrarFormato: (string|string[])[], posicion?: number[]){
        super(nombre,tipo,posicion);
        this.mostrarFormato = mostrarFormato;        
    }
}