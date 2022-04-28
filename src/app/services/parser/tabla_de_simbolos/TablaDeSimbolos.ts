enum ScopeType{
    Global,
    Local
}

class Scope {
    type: ScopeType;
    scope_name: string|undefined; //El scope tendra un nombre en caso que sea local, si es global el nombre sera undefined
    
    constructor(type: ScopeType, scope_name: string|undefined) {
        this.type = type;
        this.scope_name = scope_name;
    }
}

export class TablaDeSimbolos {
    scope: Scope;
    parent_scope: TablaDeSimbolos|null;
    
    simbolos: Map<IdTipo, Simbolo>;
    
    inner_scopes: TablaDeSimbolos[]

    constructor(scope: Scope, parent_scope: TablaDeSimbolos|null) {
        this.scope = scope;
        this.parent_scope = parent_scope;
        
        this.simbolos = new Map();
        
        this.inner_scopes = [];        
    }
    
    insertar(idTipo: IdTipo, simbolo: Simbolo){
        this.simbolos.set(idTipo, simbolo);
    }
    
    lookup(idTipo: IdTipo): Simbolo|undefined {
        return this.simbolos.get(idTipo);
    }
    
    agregarInnerScope(inner_scopes: TablaDeSimbolos) {
        this.inner_scopes.push(inner_scopes);
    }
}

enum Tipo {
    Variable,
    Funcion
}

class IdTipo {
    identificador: string;
    tipo: Tipo;

    constructor(identificador: string, tipo: Tipo){
        this.identificador = identificador;
        this.tipo = tipo;
    }
}

class Simbolo {
    tipo_dato: TipoDato;
    pos_linea: number;
    pos_columna: number;
    
    constructor(tipo_dato: TipoDato, pos_linea: number, pos_columna: number) {
        this.tipo_dato = tipo_dato;
        this.pos_linea = pos_linea;
        this.pos_columna = pos_columna;
    }
}

enum TipoDato {
    Int,
    Double,
    String,
    Char,
    Boolean,
    Void
}