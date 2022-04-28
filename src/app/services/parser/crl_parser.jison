/**
 * Gramatica Lexer/Parser CRL
 */
 
%{

const { ErrorList } = require('./manejo_error/ErrorList');
let listaErrores = new ErrorList();

var stack = []; //Integer stack para guardar indentaciones encontradas
%}

/* Lexer */
%lex

%{

var num_tab; //Nivel de indentacion - tabulacion
var prevIndent;  //Size stack temporal
var dedent; //Actual deindentacion
var flag = 0;

var IdentifierList= new Map(); //Integer,String
var NumericList= new Map(); //Integer,String
var charBuffer = [];
var stringBuffer = [];

function agregarErrorLexico(descripcion){
    listaErrores.agregarErrorParametros(yytext,yylloc.first_line,yylloc.first_column,descripcion);
}

function returnToken(TipoToken){
    var llaveToken = -1;

    for (const llave in Parser.prototype.terminals_) {
        if (Parser.prototype.terminals_[llave] === TipoToken) {
            llaveToken = llave;
            break;
        }
    }

	if(!(stack.length===0) && yylloc.first_column===0){ //Si la indentacion es mayor a 0 pero la columna actual es 0...
            console.log("Se dedenta completamente");
            this.less(yytext.length()); //...se guarda el lexema actual
            stack.pop(); //Se saca la indentacion anterior
            return 'DEDENT'; //Se retorna el token de dedentacion
    }    

    if (llaveToken != -1) {
        return llaveToken;
    } else {
        return TipoToken;
    }
}

%}

%x indentacion_estado 
%x comentario_multilinea 
%x char_estado 
%x string_estado 

// Identificadores y comentarios

SALTO = \n | \r
digit = [0-9]

letter = [a_zA_Z]
identifier = ([a-zA-Z])[a-zA-Z0-9_]*
comment         = "!!".*
whitespace      = [ \n\t]
indentacion = \t | "    "

// Integer

integer = [1-9]{digit}*|"0"

// Double

double  = "-"? ({digit}+ "." {digit}+ | {digit}+ ".")

%%

"'''"											this.pushState("comentario_multilinea");
<comentario_multilinea>"'''"\n\s*?				this.popState(); console.log("Comentario multilinea"); // Comentario de multiples líneas
<comentario_multilinea>"'''"					this.popState(); console.log("Comentario multilinea"); // Comentario de multiples líneas
<comentario_multilinea>[^']*					//Ignora el comentario

{comment}       { console.log("comentario: " + yytext); } //Se imprime comentario

{identifier}".clr" return returnToken('NOMBRE_ARCHIVO');

// Palabras Reservadas

"Importar" return returnToken('R_IMPORT');
"Incerteza" return returnToken('R_INCERTEZA');
"Mostrar"  return returnToken('R_MOSTRAR');
"DibujarAST"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
        return 'R_D_AST';
%}

"DibujarExp"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
        return 'R_D_EXP';
%}

"DibujarTS"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
        return 'R_D_TS';
%}

"if"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
        return 'R_SI';
%}

"else"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
        return 'RELSE';
%}

"para"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
        return 'R_PARA';
%}

"switch"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
        return 'RSWITCH';
%}

"case"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
        return 'RCASE';
%}

"default"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
        return 'RDEFAULT';
%}

"Double"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
        return 'R_DOUBLE';
%}

"break"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
        return 'RBREAK';
%}

"Para"  console.log("Para detectado");return returnToken('R_PARA');

"Mientras"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
        return 'RMIENTRAS';
%}

//Palabras reservadas para los tipos de datos

"Double"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
        return 'R_DOUBLE';
%}

"Boolean"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
        return 'R_BOOLEAN';
%}

"String"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
        return 'R_STRING';
%}

"Int"  console.log("KW Int detectada"); return returnToken('R_INT');

"Char"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
        return 'R_CHAR';
%}

"Void"  %{	
        console.log("Void detectado");
        if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
        return 'R_VOID';
%}

//Simbolos

","     return returnToken('COMA');
"."     return returnToken('PUNTO');

":"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
        return 'DOS_PUNTOS';
%}

";"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
        return 'PUNTO_COMA';
%}

"{"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
        return 'LLAVE_IZQ';
%}

"}"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
        return 'LLAVE_DER';
%}

"("  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
        return 'PAR_IZQ';
%}

")"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
        return 'PAR_DER';
%}

"+="  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
        return 'IGUAL_SUMA';
%}

"-="  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
        return 'IGUAL_RESTA';
%}

"*="  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
        return 'IGUAL_MULTIPLICACION';
%}

"/="  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
        return 'IGUAL_DIVISION';
%}

"&&"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
        return 'AND';
%}

"||"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
        return 'OR';
%}

"+"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
        return 'SUMA';
%}

"-"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
        return 'RESTA';
%}

"*"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
        return 'MULTIPLICACION';
%}

"/"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
        return 'DIVISION';
%}

"%"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
        return 'MODULO';
%}

"^"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
        return 'POTENCIA';
%}

"<=" %{
    if(!(stack.length===0) && yylloc.first_column===0) {
        this.less(yytext.length());
        stack.pop();
        return 'DEDENT';
    }
    return 'MENOR_IGUAL_QUE';
%}

">=" %{
    if(!(stack.length===0) && yylloc.first_column===0) {
        this.less(yytext.length());
        stack.pop();
        return 'DEDENT';
    }
    return 'MAYOR_IGUAL_QUE';
%}

"==" %{
    if(!(stack.length===0) && yylloc.first_column===0) {
        this.less(yytext.length());
        stack.pop();
        return 'DEDENT';
    }
    return 'IGUALDAD';
%}

"!=" %{
    if(!(stack.length===0) && yylloc.first_column===0) {
        this.less(yytext.length());
        stack.pop();
        return 'DEDENT';
    }
    return 'DIFERENCIA';
%}

"!&" %{
    if(!(stack.length===0) && yylloc.first_column===0) {
        this.less(yytext.length());
        stack.pop();
        return 'DEDENT';
    }
    return 'XOR';
%}

"<" %{
    if(!(stack.length===0) && yylloc.first_column===0) {
        this.less(yytext.length());
        stack.pop();
        return 'DEDENT';
    }
    return 'MENOR_QUE';
%}

">" %{
    if(!(stack.length===0) && yylloc.first_column===0) {
        this.less(yytext.length());
        stack.pop();
        return 'DEDENT';
    }
    return 'MAYOR_QUE';
%}

"=" %{
    if(!(stack.length===0) && yylloc.first_column===0) {
        this.less(yytext.length());
        stack.pop();
        return 'DEDENT';
    }
    return 'IGUAL';
%}

"~" %{
    if(!(stack.length===0) && yylloc.first_column===0) {
        this.less(yytext.length());
        stack.pop();
        return 'DEDENT';
    }
    return 'INCERTEZA';
%}

"!" %{
    if(!(stack.length===0) && yylloc.first_column===0) {
        this.less(yytext.length());
        stack.pop();
        return 'DEDENT';
    }
    return 'NOT';
%}

"true"|"false" %{
    if(!(stack.length===0) && yylloc.first_column===0) {
        this.less(yytext.length());
        stack.pop();
        return 'DEDENT';
    }
    return 'BOOLEAN';
%}

{SALTO} { console.log("salto");return 'SALTO'; }

{indentacion}   %{	

    /*
        Si se encuentra una tabulacion(o 4 espacios) se comprobara si esta esta al inicio de la columna
        para determinar si es ignorada(es una tabulacion en medio del archivo) o si representa una indentacion significativa
    */
    console.log("indentacion");
    if(yylloc.first_column===0){
        this.num_tab=1; //Si es sinificativa el numero de indentaciones se vuelve 1
        this.flag=1;
        console.log("Indentacion detectada");
        this.pushState('indentacion_estado'); //Se empieza el estado de indentaciones
    } else {
        console.log("Indentacion ignorada");
    }
%}


{double} 	%{	if(!(stack.length===0) && yylloc.first_column===0){
                        this.less(yytext.length()); 
                        stack.pop();
                        return 'DEDENT';
 					}
 					NumericList.set(yytext.hashCode,yytext);
					return 'DOUBLE';
%}

{integer}  %{ 	if(!(stack.length===0) && yylloc.first_column===0){
                    this.less(yytext.length()); 
                    stack.pop();
                    return 'DEDENT';
 				}     	
				NumericList.set(yytext.hashCode,yytext);
				return 'INTEGER';
%}

{identifier}    %{ 	
                    console.log("Var_ID detectado:"+yytext);
                    if(!(stack.length===0) && yylloc.first_column===0){
                        this.less(yytext.length()); 
                        stack.pop();
                        return 'DEDENT';
 					}     
					IdentifierList.set(yytext.hashCode,yytext);
					return 'VARIABLE_IDENTIFICADOR';
%}

{whitespace}    { /* Se ignoran los espacios en blanco */ }


\'  this.charBuffer = []; this.pushState('char_estado'); console.log("char iniciado");
<char_estado>[^\\'\n]            this.charBuffer.push(yytext);console.log("char:"+yytext); if(this.charBuffer.length > 1) { agregarErrorLexico("CHAR solo puede estar compuesto por un caracter"); }
<char_estado>\\n                 this.charBuffer.push("\n");console.log("escape:n");
<char_estado>\\t                 this.charBuffer.push("\t");console.log("escape:t");
<char_estado>\\r                 this.charBuffer.push("\r");console.log("escape:r");
<char_estado>\'                  yytext = this.charBuffer.join(''); this.pushState('INITIAL'); return 'CHAR';

\"                              this.stringBuffer = []; this.pushState('string_estado');

<string_estado>[^\\"\n]+        this.stringBuffer.push(yytext);
<string_estado>\\n              this.stringBuffer.push("\n");
<string_estado>\\r              this.stringBuffer.push("\r");
<string_estado>\\t              this.stringBuffer.push("\t");
<string_estado>\"               yytext = this.stringBuffer.join(''); this.pushState('INITIAL'); return 'STRING';
<string_estado>\n               agregarErrorLexico("Salto de linea en string"); this.pushState('INITIAL'); return 'SALTO';

<<EOF>>		%{ 
        console.log("eof detectado");
        if(stack.length===0) { 
            console.log("eof retornado");
            return 'EOF';
        } else {
            console.log("eof dedenta");
            stack.pop();
            return 'DEDENT_EOF';
        }
%}

.   { agregarErrorLexico("Caracter/es no definidos") }
	                   
//Si hay varias indentaciones seguidas el numero de estas aumenta pero se mantiene el estado de indentacion
<indentacion_estado>{indentacion} 	{ this.num_tab++; console.log("Indentacion aumentada")} 

//Cuando se recibe algo que no sea una indentacion se elige alguna accion a realizar
<indentacion_estado>. %{

            console.log("primerCheck:");
            console.log(stack);
            console.log(this.prevIndent);
            console.log(this.num_tab);
            //Se checkea si no se realizaron indentaciones previas
            if((stack.length===0)){
                console.log("No hay indentacion previa");
                this.prevIndent = 0; //Si no se realizaron indentaciones la indentacion anterior es de 0
            } else { 
                console.log("Hay indentacion previa");
                this.prevIndent = stack[stack.length-1]; //Si se realizaron, se toma el size de la indentacion anterior
            }
            
            console.log("segundoCheck:");
            console.log(stack);
            console.log(this.prevIndent);
            console.log(this.num_tab);
            //Se comprueba si la cantidad de indentacion aumento, decrecio o no hubo cambio (y tambien si existe algo inesperado)
            if(this.prevIndent < this.num_tab && this.flag==1){ //Si la indentacion aumento	

                console.log("Indentacion aumento respecto a la anterior");
                this.pushState('INITIAL'); //Se vuelve al estado inicial
                this.less(0); //Se guarda el caracter de tabulacion
                console.log(yytext)
                stack.push(this.num_tab); //Se guarda la indentacion actual para futura comprobacion
                console.log(stack);
                return 'INDENTACION'; //Se retorna el token de indentacion

            } else if (this.prevIndent > this.num_tab && !(stack.length===0)){ //Si la indentacion se redujo a algun valor mayor a 0
                console.log("Indentacion se redujo respecto a la anterior");
                this.flag = 0;
                this.less(0); //Se guarda el caracter de tabulacion
                stack.pop(); //Se expulsa la indentacion anterior
            
                return 'DEDENT'; //Se retorna el token de dedentacion
            } else if (this.prevIndent == this.num_tab ) { //Si la indentacion se mantuvo igual
                console.log("Indentacion se mantuvo respecto a la anterior");
                this.pushState('INITIAL'); //Se vuelve al estado inicial
                this.less(0); //Se guarda el caracter recibido
            } else { //Cualquier otra combinacion				
                console.log("Error en indentacion");
                this.pushState('INITIAL'); //Se vuelve al estado inicial
                this.less(0); //Se guarda el caracter
                agregarErrorLexico("No se esperaba Dedentacion"); //Se guarda el error
            }
            console.log("tercerCheck:");
            console.log(stack);
            console.log(this.prevIndent);
            console.log(this.num_tab);
%}

/lex

%{
	/*
	const TIPO_OPERACION	= require('./instrucciones').TIPO_OPERACION;
	const TIPO_VALOR 		= require('./instrucciones').TIPO_VALOR;
	const TIPO_DATO			= require('./tabla_simbolos').TIPO_DATO; //para obtener el tipo de dato
	const instruccionesAPI	= require('./instrucciones').instruccionesAPI;
	*/

    function agregarErrorSintactico(lexema, linea, columna, descripcion){
        listaErrores.agregarErrorParametros(lexema, linea, columna, descripcion);

    }
    
    function imprimirDeclaracion(tipo,variables,expresion){
        let retorno = "Var -> Tipo:"+tipo+"|Declaracion:"+variables;
        if(expresion!==null){
            retorno += "|Expreion:"+expresion;
        }
        console.log(retorno);
    }
	
	function imprimirDeclaracionFuncion(tipo, id){
        let retorno = "Func -> Tipo:"+tipo+"|Identificador:"+id;
        console.log(retorno);
	}
    
    function imprimirErrores(){
        console.log("Errores Encontrados:");
        console.log(listaErrores.toString());
    }

%}


/* Asociación de operadores y precedencia */
%left 'SUMA' 'RESTA'
%left 'MULTIPLICACION' 'DIVISION' 'MODULO'
%left 'POTENCIA'
%left URESTA
%left 'IGUALDAD' 'DIFERENCIA' 'MENOR_QUE' 'MAYOR_QUE' 'MENOR_IGUAL' 'MAYOR_IGUAL' 'INCERTEZA'
%left 'OR'
%left 'XOR'
%left 'AND'
%left 'NOT'

%start ini

%% /* Definición de la gramática */

ini
    : encabezado instrucciones fin
	| instrucciones fin { console.log("fin,eof parseado"); imprimirErrores(); return $1; } //Se retorna el AST una vez finalizado el analisis
	| fin { console.log("vacio, eof parseado"); }
;

fin 
    : EOF
    | DEDENT_EOF
;

encabezado 
    : importaciones importacion incerteza
    | importaciones importacion
    | importacion
;

importacion
    : R_IMPORT NOMBRE_ARCHIVO SALTO
;

incerteza 
    : R_INCERTEZA expresion SALTO
;

instrucciones
	: instrucciones instruccion 	{ /*$1.push($2); $$ = $1;*/console.log("instruccion terminada"); }
	| instruccion					{ /*$$ = [$1];*/ console.log("instruccion terminada"); }
	| instrucciones SALTO			{ /*$$ = [$1];*/ console.log("salto ignorado"); }
    | SALTO                         { /*$$ = [$1];*/ console.log("salto ignorado"); }
;

instruccion
	: R_MOSTRAR PAR_IZQ expresion PAR_DER SALTO { $$ = $3;/*instruccionesAPI.nuevoImprimir($3);*/ console.log("output:"+$3); }
	| RMIENTRAS PAR_IZQ expresion_logica PAR_DER LLAVE_IZQ instrucciones LLAVE_DER
														{ $$ = instruccionesAPI.nuevoMientras($3, $6); }
	| R_PARA PAR_IZQ VARIABLE_IDENTIFICADOR IGUAL expresion PUNTO_COMA expresion_logica PUNTO_COMA VARIABLE_IDENTIFICADOR SUMA SUMA PAR_DER LLAVE_IZQ instrucciones LLAVE_DER
														{ $$ = instruccionesAPI.nuevoPara($3,$5,$7,$9,$14) }
	| declaracion_variable SALTO
	| declaracion_funcion SALTO

	| VARIABLE_IDENTIFICADOR IGUAL expresion SALTO		{ console.log("Asignacion:"+$3);/*$$ = instruccionesAPI.nuevoAsignacion($1, $3);*/ } //esto soMULTIPLICACIONta expresiones_cadena y expresion

	| R_SI PAR_IZQ expresion_logica PAR_DER LLAVE_IZQ instrucciones LLAVE_DER
														{ $$ = instruccionesAPI.nuevoIf($3, $6); }
	| R_SI PAR_IZQ expresion_logica PAR_DER LLAVE_IZQ instrucciones LLAVE_DER RELSE LLAVE_IZQ instrucciones LLAVE_DER
														{ $$ = instruccionesAPI.nuevoIf($3, $6, $10); }

	| error SALTO 
    { agregarErrorSintactico(yytext, this._$.first_line, this._$.first_column, "Instruccion declarada incorrectamente"); }
;

declaracion_variable
	: tipo_dato lista_variables                     { imprimirDeclaracion($1,$2,null)/*$$ = instruccionesAPI.nuevoDeclaracion($2, TIPO_DATO.NUMERO);*/ }
	| tipo_dato lista_variables IGUAL expresion     { imprimirDeclaracion($1,$2,$4);/*$$ = instruccionesAPI.nuevoDeclaracion($2, TIPO_DATO.NUMERO);*/ }
;

tipo_dato 
	: R_INT		{ $$ = $1.toString(); }
	| R_DOUBLE	{ $$ = $1.toString(); }
	| R_STRING	{ $$ = $1.toString(); }
	| R_BOOLEAN	{ $$ = $1.toString(); }
	| R_CHAR	{ $$ = $1.toString(); }
;

declaracion_funcion
	: R_VOID declaracion_funciond		{ imprimirDeclaracionFuncion($1.toString(), $2); }
	| tipo_dato declaracion_funciond	{ imprimirDeclaracionFuncion($1, $2); }
;

declaracion_funciond
	: VARIABLE_IDENTIFICADOR PAR_IZQ PAR_DER DOS_PUNTOS { $$ = $1.toString(); }
	| VARIABLE_IDENTIFICADOR PAR_IZQ parametros PAR_DER DOS_PUNTOS { $$ = $1.toString(); }
;

parametros 
	: parametros parametro
	| parametro
;

parametro
	: tipo_dato VARIABLE_IDENTIFICADOR
;

lista_variables
    : lista_variables COMA VARIABLE_IDENTIFICADOR   { $$ = $1 +","+ $3.toString(); }
    | VARIABLE_IDENTIFICADOR                        { $$ = $1.toString(); }
;

operadores
    : IGUAL_SUMA            { $$ = instruccionesAPI.nuevoOperador(TIPO_OPERACION.SUMA); }
	| IGUAL_RESTA           { $$ = instruccionesAPI.nuevoOperador(TIPO_OPERACION.RESTA); }
    | IGUAL_MULTIPLICACION  { $$ = instruccionesAPI.nuevoOperador(TIPO_OPERACION.MULTIPLICACION); }
	| IGUAL_DIVISION        { $$ = instruccionesAPI.nuevoOperador(TIPO_OPERACION.DIVISION); }
;


expresion
	: RESTA expresion %prec URESTA			{ $$ = "-("+$2+")";/*$$ = instruccionesAPI.nuevoOperacionUnaria($2, TIPO_OPERACION.NEGATIVO);*/ }
	| expresion SUMA expresion				{ $$ = $1+"+"+$3;/*$$ = instruccionesAPI.nuevoOperacionBinaria($1, $3, TIPO_OPERACION.SUMA);*/ }
	| expresion RESTA expresion				{ $$ = $1+"-"+$3;/*$$ = instruccionesAPI.nuevoOperacionBinaria($1, $3, TIPO_OPERACION.RESTA);*/ }
	| expresion MULTIPLICACION expresion	{ $$ = $1+"*"+$3;/*$$ = instruccionesAPI.nuevoOperacionBinaria($1, $3, TIPO_OPERACION.MULTIPLICACION);*/ }
	| expresion DIVISION expresion			{ $$ = $1+"/"+$3;/*$$ = instruccionesAPI.nuevoOperacionBinaria($1, $3, TIPO_OPERACION.DIVISION);*/ }
	| PAR_IZQ expresion PAR_DER				{ $$ = "("+$2+")"; }
	| INTEGER		    					{ $$ = $1.toString();/*$$ = instruccionesAPI.nuevoValor(Number($1), TIPO_VALOR.NUMERO);*/ }
	| DOUBLE								{ $$ = $1.tostring();/*$$ = instruccionesAPI.nuevoValor(Number($1), TIPO_VALOR.NUMERO);*/ }
	| VARIABLE_IDENTIFICADOR				{ $$ = $1.toString();/*$$ = instruccionesAPI.nuevoValor($1, TIPO_VALOR.VARIABLE_IDENTIFICADOR);*/ }
    | STRING                                { $$ = "\""+$1.toString()+"\"";}
    | CHAR                                  { $$ = "\'"+$1.toString()+"\'";}
    | BOOLEAN                               { $$ = $1.toString(); }
;

expresion_relacional
	: expresion MAYOR_QUE expresion		    { $$ = instruccionesAPI.nuevoOperacionBinaria($1, $3, TIPO_OPERACION.MAYOR_QUE); }
	| expresion MENOR_QUE expresion		    { $$ = instruccionesAPI.nuevoOperacionBinaria($1, $3, TIPO_OPERACION.MENOR_QUE); }
	| expresion MAYOR_IGUAL_QUE expresion	{ $$ = instruccionesAPI.nuevoOperacionBinaria($1, $3, TIPO_OPERACION.MAYOR_IGUAL); }
	| expresion MENOR_IGUAL_QUE expresion	{ $$ = instruccionesAPI.nuevoOperacionBinaria($1, $3, TIPO_OPERACION.MENOR_IGUAL); }
	| expresion IGUALDAD expresion			{ $$ = instruccionesAPI.nuevoOperacionBinaria($1, $3, TIPO_OPERACION.DOBLE_IGUAL); }
	| expresion DIFERENCIA expresion		{ $$ = instruccionesAPI.nuevoOperacionBinaria($1, $3, TIPO_OPERACION.NO_IGUAL); }
	| expresion INCERTEZA expresion 		{ $$ = instruccionesAPI.nuevoOperacionBinaria($1, $3, TIPO_OPERACION.NO_IGUAL); }
;

expresion_logica
	: expresion_relacional AND expresion_relacional     { $$ = instruccionesAPI.nuevoOperacionBinaria($1, $3, TIPO_OPERACION.AND); }
	| expresion_relacional XOR expresion_relacional     { $$ = instruccionesAPI.nuevoOperacionBinaria($1, $3, TIPO_OPERACION.AND); }
	| expresion_relacional OR expresion_relacional 		{ $$ = instruccionesAPI.nuevoOperacionBinaria($1, $3, TIPO_OPERACION.OR); }
	| NOT expresion_relacional							{ $$ = instruccionesAPI.nuevoOperacionUnaria($2, TIPO_OPERACION.NOT); }
	| expresion_relacional								{ $$ = $1; }
;