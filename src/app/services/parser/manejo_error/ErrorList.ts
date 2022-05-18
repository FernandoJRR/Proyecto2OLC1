export class ErrorList {
    errores: (InterpreterError|string)[];
    
    constructor(){
        this.errores = [];
    }

    public agregarError(error: InterpreterError){
        this.errores.push(error);
    }
    
    public agregarErrorParametros(lexema: string|null, linea:number, columna:number, descripcion:string){
        this.errores.push(new InterpreterError(lexema,linea,columna,descripcion));       
    }
    
    public agregarErrorExterno(error:string){
        this.errores.push("Error: "+error);
    }
    
    public toString(): string{
        let errorString:string = ""; 
        
        this.errores.forEach(error => {
            errorString += error+"\n";
        });

        return errorString;        
    }
}

class InterpreterError {
    lexema: string|null;
    linea: number;
    columna: number;
    descripcion: string;

    constructor(lexema: string|null, linea: number, columna: number, descripcion: string) {
        this.lexema = lexema;
        this.linea = linea;       
        this.columna = columna;       
        this.descripcion = descripcion;
    }
    
    toString(): string {
        let errorString: string = "";
        if (typeof this.lexema == null) {
            errorString = "Error en linea: "+this.linea+" y columna: "+this.columna+"\n"+this.descripcion;
        } else {
            let lexema = this.lexema;
            if (lexema === "\n") {
                lexema = lexema.replace("\n","SALTO_DE_LINEA");
            } else if (lexema === "\r") {
                lexema = lexema.replace("\r","RETORNO_DE_CARRO");
            } else if (lexema === "\t") {
                lexema = lexema.replace("\t","TABULACION");
            }
            errorString = "Error con: '"+lexema+"' en linea: "+this.linea+" y columna: "+this.columna+"\n"+this.descripcion;
        }
        return errorString;
    }
}