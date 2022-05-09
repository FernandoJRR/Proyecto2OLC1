export class Token {
    lexema: string;
    linea: number;
    columna: number;

    constructor(lexema: string, linea: number, columna: number) {
        this.lexema = lexema;
        this.linea = linea;
        this.columna = columna;
    }
}