/**
 * Gramatica Lexer/Parser CRL
 */
 
%{

//const { ErrorList } = Parser.yy.manejoErrores;
let listaErrores;

var stack = []; //Integer stack para guardar indentaciones encontradas

var stack_instrucciones = []
var indentaciones_anteriores = []
var indentacion_actual = 0;

var indentaciones_continuas = 0;

var cuerpo_actual_funcion = "";
var instrucciones_funcion_actual = [];

var esPrimerInstruccion = true;

var funcionActual = undefined;
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
    Parser.yy.listaErrores.agregarErrorParametros(yytext,yylloc.first_line,yylloc.first_column,descripcion);
}

function returnToken(TipoToken){
    var llaveToken = -1;

    for (const llave in Parser.prototype.terminals_) {
        if (Parser.prototype.terminals_[llave] === TipoToken) {
            llaveToken = llave;
            break;
        }
    }

	indentaciones_continuas = 0;
/*
	if(!(stack.length===0) && yylloc.first_column===0){ //Si la indentacion es mayor a 0 pero la columna actual es 0...
            console.log("Se dedenta completamente");
            this.less(yytext.length()); //...se guarda el lexema actual
            stack.pop(); //Se saca la indentacion anterior
            return 'DEDENT'; //Se retorna el token de dedentacion
    }    
*/	

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

SALTO = \n|\r
digit = [0-9]

letter = [a_zA_Z]
identifier = ([a-zA-Z])[a-zA-Z0-9_]*
comentario         = "!!".*
whitespace      = [ \n\t]
indentacion = \t | "    "

// Integer

integer = [1-9]{digit}*|"0"

// Double

double  = "-"? ({digit}+ "." {digit}+ | {digit}+ ".")

%%

//{indentacion}+."'''"								this.pushState("comentario_multilinea"); indentaciones_continuas = 0; console.log("indentacion "+indentaciones_continuas)
"'''"											this.pushState("comentario_multilinea"); indentaciones_continuas = 0;
<comentario_multilinea>"'''"					this.popState(); console.log("Comentario multilinea "+indentaciones_continuas); // Comentario de multiples líneas
<comentario_multilinea><<EOF>>					this.popState();agregarErrorLexico("Fin de archivo en comentario sin cerrar"); return 'DEDENT_EOF';
<comentario_multilinea>\'						// Comentario de multiples líneas
<comentario_multilinea>[^']*					//Ignora el comentario 


{comentario}       %{ console.log("comentario: " + yytext);  //Se imprime comentario
%}


{identifier}".crl" return returnToken('NOMBRE_ARCHIVO');
{identifier}".".* { agregarErrorLexico("El nombre del archivo no tiene extension '.crl' "); return returnToken('NOMBRE_ARCHIVO'); }

// Palabras Reservadas

"Importar" return returnToken('R_IMPORT');
"Incerteza" return returnToken('R_INCERTEZA');
"Mostrar"  return returnToken('R_MOSTRAR');
"DibujarAST"  console.log("dib ast enviado"); return returnToken('R_D_AST');
"DibujarEXP" return returnToken('R_D_EXP');
"DibujarTS"  return returnToken('R_D_TS');
"Retorno"   return returnToken('R_RETORNO')
"Detener"   return returnToken('R_DETENER')
"Continuar"   return returnToken('R_CONTINUAR')

"Double"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
	indentaciones_continuas = 0;
        return 'R_DOUBLE';
%}

"break"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
	indentaciones_continuas = 0;
        return 'RBREAK';
%}

"Para"  return returnToken('R_PARA');

"Si" return returnToken('R_SI');

"Sino" return returnToken('R_SINO');

"Mientras"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
	indentaciones_continuas = 0;
        return 'R_MIENTRAS';
%}

//Palabras reservadas para los tipos de datos

"Double"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
	indentaciones_continuas = 0;
        return 'R_DOUBLE';
%}

"Boolean"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
	indentaciones_continuas = 0;
        return 'R_BOOLEAN';
%}

"String"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
	indentaciones_continuas = 0;
        return 'R_STRING';
%}

"Int"  console.log("KW Int detectada"); return returnToken('R_INT');

"Char"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
	indentaciones_continuas = 0;
        return 'R_CHAR';
%}

"Void"  %{	
        console.log("Void detectado");
        if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
	indentaciones_continuas = 0;
        return 'R_VOID';
%}

//Simbolos

","     return returnToken('COMA');
"."     return returnToken('PUNTO');
":" return returnToken('DOS_PUNTOS');
";" return returnToken('PUNTO_COMA');
"{" return returnToken('LLAVE_IZQ');
"}" return returnToken('LLAVE_DER');

"("  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
        indentaciones_continuas = 0;
        console.log("par izquierdo");
        return 'PAR_IZQ';
%}

")"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
        indentaciones_continuas = 0;
        console.log("par derecho");
        return 'PAR_DER';
%}

"+="  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
	indentaciones_continuas = 0;
        return 'IGUAL_SUMA';
%}

"-="  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
	indentaciones_continuas = 0;
        return 'IGUAL_RESTA';
%}

"*="  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
	indentaciones_continuas = 0;
        return 'IGUAL_MULTIPLICACION';
%}

"/="  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
	indentaciones_continuas = 0;
        return 'IGUAL_DIVISION';
%}

"&&"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
	indentaciones_continuas = 0;
        return 'AND';
%}

"||"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
	indentaciones_continuas = 0;
        return 'OR';
%}

"+"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
	indentaciones_continuas = 0;
        return 'SUMA';
%}

"-"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
	indentaciones_continuas = 0;
        return 'RESTA';
%}

"*"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
	indentaciones_continuas = 0;
        return 'MULTIPLICACION';
%}

"/"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
	indentaciones_continuas = 0;
        return 'DIVISION';
%}

"%"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
	indentaciones_continuas = 0;
        return 'MODULO';
%}

"^"  %{	if(!(stack.length===0) && yylloc.first_column===0){
            this.less(yytext.length());
            stack.pop();
            return 'DEDENT';
        }    
	indentaciones_continuas = 0;
        return 'POTENCIA';
%}

"<=" %{
    if(!(stack.length===0) && yylloc.first_column===0) {
        this.less(yytext.length());
        stack.pop();
        return 'DEDENT';
    }
	indentaciones_continuas = 0;
    return 'MENOR_IGUAL_QUE';
%}

">=" %{
    if(!(stack.length===0) && yylloc.first_column===0) {
        this.less(yytext.length());
        stack.pop();
        return 'DEDENT';
    }
	indentaciones_continuas = 0;
    return 'MAYOR_IGUAL_QUE';
%}

"==" %{
    if(!(stack.length===0) && yylloc.first_column===0) {
        this.less(yytext.length());
        stack.pop();
        return 'DEDENT';
    }
	indentaciones_continuas = 0;
    return 'IGUALDAD';
%}

"!=" %{
    if(!(stack.length===0) && yylloc.first_column===0) {
        this.less(yytext.length());
        stack.pop();
        return 'DEDENT';
    }
	indentaciones_continuas = 0;
    return 'DIFERENCIA';
%}

"|&" %{
    if(!(stack.length===0) && yylloc.first_column===0) {
        this.less(yytext.length());
        stack.pop();
        return 'DEDENT';
    }
	indentaciones_continuas = 0;
    return 'XOR';
%}

"<" %{
    if(!(stack.length===0) && yylloc.first_column===0) {
        this.less(yytext.length());
        stack.pop();
        return 'DEDENT';
    }
	indentaciones_continuas = 0;
    return 'MENOR_QUE';
%}

">" %{
    if(!(stack.length===0) && yylloc.first_column===0) {
        this.less(yytext.length());
        stack.pop();
        return 'DEDENT';
    }
	indentaciones_continuas = 0;
    return 'MAYOR_QUE';
%}

"=" %{
    if(!(stack.length===0) && yylloc.first_column===0) {
        this.less(yytext.length());
        stack.pop();
        return 'DEDENT';
    }
	indentaciones_continuas = 0;
    return 'IGUAL';
%}

"~" %{
    if(!(stack.length===0) && yylloc.first_column===0) {
        this.less(yytext.length());
        stack.pop();
        return 'DEDENT';
    }
	indentaciones_continuas = 0;
    return 'INCERTEZA';
%}

"!" %{
    if(!(stack.length===0) && yylloc.first_column===0) {
        this.less(yytext.length());
        stack.pop();
        return 'DEDENT';
    }
	indentaciones_continuas = 0;
    return 'NOT';
%}

"true"|"false" %{
    if(!(stack.length===0) && yylloc.first_column===0) {
        this.less(yytext.length());
        stack.pop();
        return 'DEDENT';
    }
	indentaciones_continuas = 0;
    return 'BOOLEAN';
%}

{indentacion}+{comentario}?{SALTO} {/*se ignora*/}

{SALTO} %{ 
	
	//Se detecta si el salto deberia ser ignorado
    //Se ignora si es un salto al principio de la linea
	if(yylloc.first_column !== 0){
        console.log("salto enviado");
        indentaciones_continuas = 0;
        return 'SALTO'; 
	}

%}

{indentacion}   %{	
    /*
        Si se encuentra una tabulacion(o 4 espacios) se comprobara si esta esta al inicio de la columna
        para determinar si es ignorada(es una tabulacion en medio del archivo) o si representa una indentacion significativa
    */
    if(yylloc.first_column===0){
		indentaciones_continuas = 1;
        console.log("Indentacion detectada");
		return 'INDENTACION'
    } else if ( indentaciones_continuas > 0 ) {
		indentaciones_continuas++;
        console.log("Indentacion detectada y aumentada");
		return 'INDENTACION';
    } else {
		indentaciones_continuas = 0;
        console.log("Indentacion ignorada");
	}
%}


{double} 	console.log("double detectado"); return returnToken('DOUBLE');

{integer}  %{ 	if(!(stack.length===0) && yylloc.first_column===0){
                    this.less(yytext.length()); 
                    stack.pop();
                    return 'DEDENT';
 				}     	
				NumericList.set(yytext.hashCode,yytext);
	indentaciones_continuas = 0;
				return 'INTEGER';
%}

{identifier}    %{ 	
                    console.log("Var_ID detectado:"+yytext);
                    if(!(stack.length===0) && yylloc.first_column===0){
                        this.less(yytext.length()); 
                        stack.pop();
                        return 'DEDENT';
 					}     
					indentaciones_continuas = 0;
					IdentifierList.set(yytext.hashCode,yytext);
					return 'VARIABLE_IDENTIFICADOR';
%}

{whitespace}    { /* Se ignoran los espacios en blanco */ indentaciones_continuas = 0; }


\'  this.charBuffer = []; this.pushState('char_estado'); console.log("char iniciado");
<char_estado>[^\\'\n]            this.charBuffer.push(yytext);console.log("char:"+yytext); if(this.charBuffer.length > 1) { agregarErrorLexico("CHAR solo puede estar compuesto por un caracter"); }
<char_estado>\\n                 this.charBuffer.push("\n");console.log("escape:n");
<char_estado>\\t                 this.charBuffer.push("\t");console.log("escape:t");
<char_estado>\\r                 this.charBuffer.push("\r");console.log("escape:r");
<char_estado>\'                  yytext = this.charBuffer.join(''); this.popState(); indentaciones_continuas = 0;return 'CHAR';
<char_estado>\n                  agregarErrorLexico("Salto de linea en Char"); this.popState(); indentaciones_continuas = 0;return 'SALTO';
<char_estado>.                   agregarErrorLexico("Caracter/es no definidos");
<char_estado><<EOF>>             %{
        agregarErrorLexico("EOF en definicion de Char");
        console.log("eof detectado");
        if(stack.length===0) { 
            console.log("eof retornado");indentaciones_continuas = 0;
            return 'EOF';
        } else {
            console.log("eof dedenta");
            stack.pop();
            return 'DEDENT_EOF';
        }
    %}


\"                              this.stringBuffer = []; this.pushState('string_estado');
<string_estado>[^\\"\n]+        this.stringBuffer.push(yytext);
<string_estado>\\n              this.stringBuffer.push("\n");
<string_estado>\\r              this.stringBuffer.push("\r");
<string_estado>\\t              this.stringBuffer.push("\t");
<string_estado>\"               yytext = this.stringBuffer.join(''); this.pushState('INITIAL'); indentaciones_continuas = 0;console.log("cadena");return 'STRING';
<string_estado>\n               agregarErrorLexico("Salto de linea en String"); this.popState(); indentaciones_continuas = 0;return 'SALTO';
<string_estado>.                agregarErrorLexico("Caracter/es no definidos");
<string_estado><<EOF>>          %{
        agregarErrorLexico("EOF en definicion de String");
        console.log("eof detectado");
        if(stack.length===0) { 
            console.log("eof retornado");indentaciones_continuas = 0;
            return 'EOF';
        } else {
            console.log("eof dedenta");
            stack.pop();
            return 'DEDENT_EOF';
        }
    %}

.   { indentaciones_continuas = 0;agregarErrorLexico("Caracter/es no definidos"); }
<<EOF>>		%{ 
        console.log("eof detectado");
        if(stack.length===0) { 
            console.log("eof retornado");indentaciones_continuas = 0;
            return 'EOF';
        } else {
            console.log("eof dedenta");
            stack.pop();
            return 'DEDENT_EOF';
        }
%}

	                   
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
        Parser.yy.listaErrores.agregarErrorParametros(lexema, linea, columna, descripcion);
    }
	
	function imprimirImportacion(nombreArchivo){
		console.log("Importacion -> Archivo:"+nombreArchivo);
	}
	
	function imprimirIncerteza(expresionIncerteza){
		console.log("Incerteza -> Expresion:"+expresionIncerteza);
	}
    
    function imprimirDeclaracion(tipo,variables,expresion){
        let retorno = "Var -> Tipo:"+tipo+"|Declaracion:"+variables;
        if(expresion!==null){
            retorno += "|Expreion:"+expresion;
        }
        console.log(retorno + "\n");
    }
    
    function formatDeclaracion(tipo, variables, expresion){
        let retorno = "Var -> Tipo:"+tipo+"|Declaracion:"+variables;
        if(expresion!==null){
            retorno += "|Expreion:"+expresion;
        }
        return retorno + "\n";
    }
	
	function formatLlamadaFuncion(identificador, parametros){
		return "Llamada -> Identificador:"+identificador+"|Parametros:"+parametros+"\n";
	}
	
	function imprimirAsignacion(variable, expresion){
		console.log("Asignacion -> Variable:"+variable+"|Expresion:"+expresion);
	}
    
    function formatAsignacion(variable, expresion){
		return "Asignacion -> Variable:"+variable+"|Expresion:"+expresion+"\n";
    }
	
	function imprimirDeclaracionFuncion(tipo, id, parametros,cuerpo){
        let retorno = "Func -> Tipo:"+tipo+"|Identificador:"+id+"|Parametros["+parametros+"]";
		retorno += "\n\tCuerpo:\n" + cuerpo;
        console.log(retorno);
	}
	
    //Se ingresa la declaracion de una funcion sin sus posibles instrucciones internas, para estructurarlas
	function declararFuncion(declaracion_sin_cuerpo){

		//Se limpia el stack de instrucciones agregandolas a la funcion
		consumirStack(0);
        
		//imprimirDeclaracionFuncion(tipo, id, parametros, cuerpo_actual_funcion);
        
        //Se comprueba si existen instrucciones que anidar dentro de la funcion
        if(instrucciones_funcion_actual.length > 0){
            //Se crea el nodo no terminal con las instrucciones internas de la funcion
            let nodoInstrucciones = Parser.yy.utilidades.nuevasInstrucciones(instrucciones_funcion_actual, Parser.yy.listaErrores);
            declaracion_sin_cuerpo.agregarHijo(nodoInstrucciones);
        } 
        
        //Se agrega la declaracion al AST
        Parser.yy.ast.nuevaInstruccion(declaracion_sin_cuerpo);

		cuerpo_actual_funcion = "";
        instrucciones_funcion_actual = [];
        
	}
	
	function formatPara(variable,condicion,direccion){
		return "Para -> VarInicial:"+variable+"|Condicion:"+condicion+"|Direccion:"+direccion+"\n";
	}
    
    function formatSi(condicion){
        return "Si -> Condicion:"+condicion+"\n";
    }
    
    function formatMostrar(parametros){
        return "Mostrar -> Parametros:"+parametros+"\n";
    }
    
    function imprimirErrores(){
        console.log("\nErrores Encontrados:");
        console.log(Parser.yy.listaErrores.toString());
    }
    
    function agregarPrimeraInstruccion(instruccion){
        if(instruccion.tipoInstruccion == 14){
            agregarErrorSintactico("SINO", Parser.yy.utilidades.obtenerLineaNodo(instruccion), 0, "La instruccion SINO debe estar asociada a una instruccion SI");
        }

        stack_instrucciones.push(instruccion); 
        indentaciones_anteriores.push(indentacion_actual);
    }
	
	//Se decide que hacer con la instruccion obtenida mas reciente dependiendo de su indentacion
	function accionStack(instruccion){
		console.log("instr actual");
		console.log(instruccion);
        console.log("cosa"+stack_instrucciones.length)
        console.log(stack_instrucciones)

		let indentacion_anterior = indentaciones_anteriores[indentaciones_anteriores.length - 1];

		if ( indentacion_actual > indentacion_anterior ) { //En caso de que la indentacion de la instruccion obtenida sea mayor que la de la anterior
            if(instruccion.tipoInstruccion == 14){
                agregarErrorSintactico("SINO", Parser.yy.utilidades.obtenerLineaNodo(instruccion), 0, "La instruccion SINO debe estar asociada a una instruccion SI");
            }

			//Se agrega la instruccion y su indentacion al stack
			stack_instrucciones.push(instruccion);
			indentaciones_anteriores.push(indentacion_actual);

		} else if ( indentacion_actual === indentacion_anterior ) { //En caso de que la indentacion de la instruccion sea igual al de la instruccion anterior
        //NOTA: es necesario tomar el cuenta el caso especial de la instruccion SI, ya que esta puede esperar la instruccion SINO en la misma indentacion

            //Si la instruccion es un SINO con un SI anterior a ese se integrara el SINO dentro del SI y no se sacara al SI del stack
            if(stack_instrucciones[stack_instrucciones.length-1].tipoInstruccion==13 && instruccion.tipoInstruccion==14){
                console.log("Si y sino juntos")
            } else if(stack_instrucciones[stack_instrucciones.length-1].tipoInstruccion!=13 && instruccion.tipoInstruccion == 14){
                agregarErrorSintactico("SINO", Parser.yy.utilidades.obtenerLineaNodo(instruccion), 0, "La instruccion SINO debe estar asociada a una instruccion SI");
            }

			//La instruccion anterior es agregada a su instruccion padre
            //Se comprueba si la instruccion padre es una declaracion de funcion
            //Se comprueba si la instruccion padre acepta instrucciones anidadas
			if ( stack_instrucciones.length === 1 ) {
            //Si la instruccion padre es la declaracion de la funcion

                //Sacamos a la instruccion del stack
                let instruccion_anterior = stack_instrucciones.pop();
                
                //Agregamos la instruccion a la funcion
				cuerpo_actual_funcion += instruccion_anterior + "Fin scope " + instruccion_anterior.toString().split(' ')[0] + " stack vacio\n" ;
                instrucciones_funcion_actual.push(instruccion_anterior);
                
			} else {
            //Si la instruccion padre NO es la declaracion de la funcion
            console.log("stack");
            console.log(stack_instrucciones);
				
                //Sacamos a la instruccion y la indentacion de los stack
                let instruccion_anterior = stack_instrucciones.pop();

                console.log("instruccionanterior")
                console.log(instruccion_anterior)
                //Agregamos la instruccion a su instruccion padre
				//stack_instrucciones[stack_instrucciones.length-1] += instruccion_anterior  + "Fin scope " + instruccion_anterior.toString().split(" ")[0] + "\n";
                
                //Sacamos la instruccion padre para modificarla
                let instruccionPadre = stack_instrucciones.pop();
                console.log("instruccionpadre")
                console.log(instruccionPadre)
				instruccionPadre = agregarInstruccionAPadre(instruccionPadre, instruccion_anterior);
                console.log("instruccionpadre-post")
                console.log(instruccionPadre)
                stack_instrucciones.push(instruccionPadre);
			}
			
			stack_instrucciones.push(instruccion);
			
		} else if ( indentacion_actual < indentacion_anterior ) {   //En caso de que la indentacion de la instruccion obtenida sea menor a la de la anterior
            //console.log("indentacion menor: consumir stack");
        
            //Se consume el stack hasta que se encuente una instruccion con la misma indentacion o hasta vaciar el stack
            consumirStack(indentacion_actual);

            //Se pone en el stack la instruccion actual
            stack_instrucciones.push(instruccion);
            indentaciones_anteriores.push(indentacion_actual);
		}
		
	}
    
    function agregarInstruccionAPadre(padre, hijo){
        let tipoInstruccion = padre.tipoInstruccion;

        console.log("Tipo "+tipoInstruccion);
        console.log("Padre");
        console.log(padre);
        console.log("Hijo");
        console.log(hijo);
        //Se comprueba si la instruccion puede tener instrucciones anidadas, instrucciones 12-16
        if(tipoInstruccion >= 12 && tipoInstruccion <= 16){
            console.log("pasa");
            padre = Parser.yy.utilidades.agregarInstruccionAPadreInstruccion(padre, hijo, Parser.yy.listaErrores);
            console.log("Padre post")
            console.log(padre);
        } else {
            agregarErrorSintactico("INSTRUCCION", Parser.yy.utilidades.obtenerLineaNodo(hijo), 0, "No se esperaba indentacion");
        }
        return padre;
    }
	
    //Se consume el stack hasta que se encuentre una instruccion con la indentacion buscada
	function consumirStack(indentacionBuscada){
        /*
        console.log("indentacionbuscada "+indentacionBuscada);
        console.log("stack");
        console.log(stack_instrucciones);
        console.log("indentaciones anteriorres");
        console.log(indentaciones_anteriores);
        console.log(indentaciones_anteriores.length);
        */

        //Se guarda la indentacion mas reciente en el stack
		let temp_indentacion_actual = indentaciones_anteriores[indentaciones_anteriores.length - 1];			
        
        /*
        console.log("indentacion actual");
        console.log(temp_indentacion_actual);
        */



        //Se consumira el stack hasta que se encuentre una indentacion igual a la que se busca o se acabe el stack  
        //Las instrucciones encontradas seran instroducidas en su instruccion padre (si es posible) en el proceso
		while( ( temp_indentacion_actual >= indentacionBuscada ) && ( stack_instrucciones.length > 0 ) ) {

            //La instruccion anterior es agregada a su instruccion padre  (implica que el stack esta a punto de vaciarse)
            //Se comprueba si la instruccion padre es una declaracion de funcion
            //Se comprueba si su instruccion padre acepta instrucciones anidadas
            if ( stack_instrucciones.length === 1 ) {
                console.log("se consume");
                console.log(stack_instrucciones);
                
                //Se saca la instruccion y su indentacion del stack
                let temp_instruccion_anterior = stack_instrucciones.pop();
                indentaciones_anteriores.pop();

                //Se agrega la instruccion actual a la definicion de la funcion
                //let tipo_instruccion = temp_instruccion_anterior.toString().split(' ')[0];
                //cuerpo_actual_funcion += temp_instruccion_anterior + "Fin scope " + tipo_instruccion + " stack vacio\n" ;

                instrucciones_funcion_actual.push(temp_instruccion_anterior);
                
            } else {
                /*
                console.log("Agregado");
                */
                console.log("avanza");
                console.log(stack_instrucciones);

                //Se saca la instruccion y su indentacion del stack
                let temp_instruccion_anterior = stack_instrucciones.pop();
                indentaciones_anteriores.pop();

                //Se saca temporalmente la instruccion padre para su modificacion
                let temp = stack_instrucciones.pop();
                let tipo_instruccion = temp_instruccion_anterior.toString().split(' ')[0];

                /*
                console.log("temp");
                console.log(temp);
                console.log("instr anterior");
                console.log(temp_instruccion_anterior);
                console.log("tipo");
                console.log(tipo_instruccion);
                */

                //Se agrega la instruccion actual a su instruccion padre y se reintroduce al stack
                //temp += temp_instruccion_anterior + "Fin scope " + tipo_instruccion + "\n";
                
                temp = agregarInstruccionAPadre(temp, temp_instruccion_anterior);
                stack_instrucciones.push(temp);
            }
            
            //Se hace que la indentacion actual sea la indentacion mas reciente en el stack (undefined si se acabo el stack)
            temp_indentacion_actual = indentaciones_anteriores[indentaciones_anteriores.length - 1];			
            console.log(temp_indentacion_actual);
		}
	}
    
    function crearDeclaracionFuncion(tipo, identificador, parametros){
        console.log("se declara funcion")
        return Parser.yy.ast.nuevaDeclaracionFuncion(tipo, identificador, Parser.yy.utilidades.nuevaDeclaracionParametros(parametros)); 
    }
    
    function crearParteFuncion(identificador, parametros){
        let declaracion = [];
        declaracion.push(identificador);

        if(parametros != undefined){
            declaracion.push(parametros);
        }
        
        return declaracion;
    }
    
    function terminar(){
        stack = []; //Integer stack para guardar indentaciones encontradas

        stack_instrucciones = []
        indentaciones_anteriores = []
        indentacion_actual = 0;

        indentaciones_continuas = 0;

        cuerpo_actual_funcion = "";
        instrucciones_funcion_actual = [];

        esPrimerInstruccion = true;

        funcionActual = undefined;

        
        funcionActual = undefined
        if(Parser.yy.listaErrores.errores.length > 0){
            return {errores: Parser.yy.listaErrores.toString()};
        }
    }
    
%}


/* Asociación de operadores y precedencia */
%left 'SUMA' 'RESTA'
%left 'MULTIPLICACION' 'DIVISION' 'MODULO'
%right 'POTENCIA'
%left URESTA
%left 'IGUALDAD' 'DIFERENCIA' 'MENOR_QUE' 'MAYOR_QUE' 'MENOR_IGUAL_QUE' 'MAYOR_IGUAL_QUE' 'INCERTEZA'
%left 'OR'
%left 'XOR'
%left 'AND'
%left 'NOT'
%nonassoc GRUPO

%start ini

%% /* Definición de la gramática */

ini
    : encabezado instrucciones fin  { if(funcionActual != undefined) {declararFuncion(funcionActual)} console.log("fin,eof parseado"); imprimirErrores(); return terminar(); } 
    | encabezado fin                { console.log("fin,eof parseado"); imprimirErrores(); return terminar(); } 
	| instrucciones fin             { if(funcionActual != undefined) {declararFuncion(funcionActual)} console.log("fin,eof parseado"); imprimirErrores(); return terminar(); }
	| fin 							{ console.log("vacio, eof parseado"); return terminar(); }
	| SALTO ini 
;

fin 
    : EOF
    | DEDENT_EOF
;

encabezado 
    : importaciones incerteza	
	| importaciones			
	| incerteza
;

importaciones
	: importaciones importacion	{ imprimirImportacion($2); }
	| importacion				{ imprimirImportacion($1); }
	| importaciones SALTO		{ console.log("salto ignorado"); }
;

importacion
    : R_IMPORT NOMBRE_ARCHIVO SALTO	{ $$ = $2.toString(); Parser.yy.ast.nuevaImportacion(Parser.yy.utilidades.nuevoTerminal($2, @2.first_line, @2. first_column), Parser.yy.listaErrores); }
;

incerteza 
    : incerteza SALTO 
	| incertezad
;

incertezad 
    : R_INCERTEZA expresion_logica SALTO	{ imprimirIncerteza($2); Parser.yy.ast.nuevaIncerteza($2); }
;

instrucciones
	: instrucciones instruccion 	{ /*$1.push($2); $$ = $1;*/console.log("instruccion terminada"); }
	| instruccion					{ /*$$ = [$1];*/ console.log("instruccion terminada"); }
	| instrucciones SALTO			{ /*$$ = [$1];*/ console.log("salto ignorado"); }
;

instruccion
	: declaracion_variable SALTO                        { if(funcionActual!=undefined){ declararFuncion(funcionActual); funcionActual = undefined;} Parser.yy.ast.nuevaInstruccion($1); }

	| declaracion_funcion                               { if(funcionActual == undefined){funcionActual = $1; console.log("se guarda funcion")} else { declararFuncion(funcionActual); funcionActual = $1;}}

	| asignacion SALTO	                                { if(funcionActual!=undefined){ declararFuncion(funcionActual); funcionActual = undefined;} Parser.yy.ast.nuevaInstruccion($1); }
    
	| indentaciones instruccion_funcion	                { console.log("aquiinstruccion");if(esPrimerInstruccion){ esPrimerInstruccion=false; agregarPrimeraInstruccion($2);} else { accionStack($2);} }

	| error SALTO 
    { console.log("error "+this._$.first_line+" "+this._$.first_column);agregarErrorSintactico(yytext, this._$.first_line, this._$.first_column, "Instruccion declarada incorrectamente"); }
;

declaracion_variable
	: tipo_dato lista_variables                             { $$ = Parser.yy.utilidades.nuevaDeclaracionVariable($1, Parser.yy.utilidades.nuevasVariables($2)); }
	| tipo_dato lista_variables IGUAL expresion_logica      { $$ = Parser.yy.utilidades.nuevaDeclaracionVariable($1, Parser.yy.utilidades.nuevasVariables($2), $4); }
;

asignacion
    : VARIABLE_IDENTIFICADOR IGUAL expresion_logica         { $$ = Parser.yy.utilidades.nuevaAsignacion(Parser.yy.utilidades.nuevoTerminal($1,@1.first_line,@1.first_column), $3); }
;

tipo_dato 
	: R_INT		{ $$ = Parser.yy.utilidades.nuevoTerminalDato($1, @1.first_line, @1.first_column, 0); }
	| R_DOUBLE	{ $$ = Parser.yy.utilidades.nuevoTerminalDato($1, @1.first_line, @1.first_column, 1); }
	| R_STRING	{ $$ = Parser.yy.utilidades.nuevoTerminalDato($1, @1.first_line, @1.first_column, 2); }
	| R_CHAR	{ $$ = Parser.yy.utilidades.nuevoTerminalDato($1, @1.first_line, @1.first_column, 3); }
	| R_BOOLEAN	{ $$ = Parser.yy.utilidades.nuevoTerminalDato($1, @1.first_line, @1.first_column, 4); }
;

declaracion_funcion
	: R_VOID declaracion_funciond SALTO
    { $$ = crearDeclaracionFuncion(Parser.yy.utilidades.nuevoTerminalDato($1,@1.first_line,@1.first_column,5), $2[0], $2[1]); esPrimerInstruccion=true;}
    
	| tipo_dato declaracion_funciond SALTO
    { $$ = crearDeclaracionFuncion($1, $2[0], $2[1]); esPrimerInstruccion=true;}
/*
	| R_VOID declaracion_funciond instrucciones_funcion
    { $$ = crearDeclaracionFuncion(Parser.yy.utilidades.nuevoTerminalDato($1,@1.first_line,@1.first_column,5), $2[0], $2[1]); esPrimerInstruccion=true;}

	| tipo_dato declaracion_funciond instrucciones_funcion
    { $$ = crearDeclaracionFuncion($1, $2[0], $2[1]); esPrimerInstruccion=true;}
    */
;

declaracion_funciond
	: VARIABLE_IDENTIFICADOR PAR_IZQ PAR_DER DOS_PUNTOS
    { $$ = crearParteFuncion( Parser.yy.utilidades.nuevoTerminal($1, @1.first_line, @1.first_column), undefined ); }

	| VARIABLE_IDENTIFICADOR PAR_IZQ declaracion_parametros PAR_DER DOS_PUNTOS
    { $$ = crearParteFuncion( Parser.yy.utilidades.nuevoTerminal($1, @1.first_line, @1.first_column), $3 ); }
;

/*
instrucciones_funcion
	: instrucciones_funcion indentaciones instruccion_funcion	{ if(esPrimerInstruccion){ esPrimerInstruccion=false; agregarPrimeraInstruccion($3);} else { accionStack($3);} }
	| instrucciones_funcion indentaciones SALTO	                {}
	| indentaciones instruccion_funcion							{ esPrimerInstruccion=false; agregarPrimeraInstruccion($2); }
	| indentaciones SALTO							            {}
;
*/

instruccion_funcion
    : declaracion_variable SALTO 					        { $$ = $1; }

	| asignacion SALTO	                                    { $$ = $1; }

	| llamada_funcion SALTO		{ $$ = $1; console.log("llamada realizada"); }

	| R_MOSTRAR PAR_IZQ parametros_mostrar PAR_DER SALTO 	
    { $$ = Parser.yy.utilidades.nuevaInstruccionMostrar(Parser.yy.utilidades.nuevosParametrosMostrar($3)); }

    | R_D_AST PAR_IZQ VARIABLE_IDENTIFICADOR PAR_DER SALTO
    { $$ = Parser.yy.utilidades.nuevaInstruccionDibujarAST(Parser.yy.utilidades.nuevoTerminal($3, @3.first_line, @3.first_column)); }
    
    | R_D_EXP PAR_IZQ expresion_logica PAR_DER SALTO
    { $$ = Parser.yy.utilidades.nuevaInstruccionDibujarExpresion($3); }

    | R_D_TS PAR_IZQ PAR_DER SALTO
    { $$ = Parser.yy.utilidades.nuevaInstruccionDibujarTabla(); }
    
    | R_RETORNO SALTO
    { $$ = Parser.yy.utilidades.nuevaInstruccionRetorno(Parser.yy.utilidades.nuevoTerminal($1, @1.first_line, @1.first_column)); }

    | R_RETORNO expresion_logica SALTO
    { $$ = Parser.yy.utilidades.nuevaInstruccionRetorno(Parser.yy.utilidades.nuevoTerminal($1, @1.first_line, @1.first_column), $2); }

    | R_DETENER SALTO
    { $$ = Parser.yy.utilidades.nuevaInstruccionDetener(Parser.yy.utilidades.nuevoTerminal($1, @1.first_line, @1.first_column)); }

    | R_CONTINUAR SALTO
    { $$ = Parser.yy.utilidades.nuevaInstruccionContinuar(Parser.yy.utilidades.nuevoTerminal($1, @1.first_line, @1.first_column)); }
    
    | R_MIENTRAS PAR_IZQ expresion_logica PAR_DER DOS_PUNTOS SALTO
    { $$ = Parser.yy.utilidades.nuevaInstruccionMientras($3); }

	| R_PARA PAR_IZQ R_INT VARIABLE_IDENTIFICADOR IGUAL expresion_logica PUNTO_COMA expresion_logica PUNTO_COMA direccion_para PAR_DER DOS_PUNTOS SALTO
    { $$ = Parser.yy.utilidades.nuevaInstruccionPara(Parser.yy.utilidades.nuevaCondicionInicial(Parser.yy.utilidades.nuevoTerminal($4, @4.first_line, @4.first_column), $6), $8, $10); }

	| R_SI PAR_IZQ expresion_logica PAR_DER DOS_PUNTOS SALTO
    { $$ = Parser.yy.utilidades.nuevaInstruccionSi($3); }

	| R_SINO DOS_PUNTOS SALTO
    { $$ = Parser.yy.utilidades.nuevaInstruccionSino(Parser.yy.utilidades.nuevoTerminal($1,@1.first_line,@1.first_column)); }

    //por si acaso
	//| R_PARA PAR_IZQ R_INT VARIABLE_IDENTIFICADOR IGUAL expresion PUNTO_COMA expresion_logica PUNTO_COMA direccion_para PAR_DER DOS_PUNTOS SALTO
    //| R_D_EXP PAR_IZQ expresion PAR_DER SALTO
;

parametros_mostrar
	: parametros_mostrar COMA expresion_logica  { $1.push($3); $$ = $1; }
	| STRING                                    { let parametrosMostrar = []; parametrosMostrar.push(Parser.yy.utilidades.nuevoTerminalDato($1, @1.first_line, @1.first_column, 2)); $$ = parametrosMostrar; }
    
    //por si acaso
	//| parametros_mostrar COMA expresion  { $$ = $1+"|Parametro:"+$3; }
;

indentaciones 
	: indentaciones INDENTACION	{ indentacion_actual++; }
	| INDENTACION 				{ indentacion_actual = 1; }
;

direccion_para
	: SUMA SUMA		{ $$ = Parser.yy.utilidades.nuevoTerminal($1+$2, @1.first_line, @1.first_column); }
	| RESTA RESTA	{ $$ = Parser.yy.utilidades.nuevoTerminal($1+$2, @1.first_line, @1.first_column); }
;

declaracion_parametros 
	: declaracion_parametros COMA declaracion_parametro	{ $1.push($3); $$ = $1; }
	| declaracion_parametro							    { let declaracionesParametros = []; declaracionesParametros.push($1); $$ = declaracionesParametros; }
;

declaracion_parametro
	: tipo_dato VARIABLE_IDENTIFICADOR	{ $$ = Parser.yy.utilidades.nuevaDeclaracionParametro($1, Parser.yy.utilidades.nuevoTerminal($2,@2.first_line,@2.first_column)); }    //{ nuevaDeclaracionParametro($1, nuevoTerminal($2, @2.first_line, @2.first_column)); }
;

lista_variables
    : lista_variables COMA VARIABLE_IDENTIFICADOR   { $1.push(Parser.yy.utilidades.nuevoTerminal($3, @3.first_line, @3.first_column)); $$ = $1; }
    | VARIABLE_IDENTIFICADOR                        { let variables = []; variables.push(Parser.yy.utilidades.nuevoTerminal($1, @1.first_line, @1.first_column)); $$ = variables; }
;

llamada_funcion
	: VARIABLE_IDENTIFICADOR PAR_IZQ PAR_DER			{ $$ = Parser.yy.utilidades.nuevaLlamadaFuncion(Parser.yy.utilidades.nuevoTerminal($1, @1.first_line, @1.first_column)); }
	| VARIABLE_IDENTIFICADOR PAR_IZQ parametros PAR_DER	{ $$ = Parser.yy.utilidades.nuevaLlamadaFuncion(Parser.yy.utilidades.nuevoTerminal($1, @1.first_line, @1.first_column),Parser.yy.utilidades.nuevosParametros($3)); }
;

parametros
	: parametros COMA expresion_logica  { $1.push($3); $$ = $1; }
	| expresion_logica                  { let parametro = []; parametro.push($1); $$ = parametro; }
    
    //por si acaso
	//| parametros COMA expresion
	//| expresion
;
/*
expresion
	: RESTA expresion_logica %prec URESTA			        { $$ = "-("+$2+")";}				//{ $$ = nuevaExpresion(TipoExpresionMatematica.MenosUnitario, $2); }
	| expresion_logica SUMA expresion_logica				{ $$ = $1+"+"+$3;}					//{ $$ = nuevaExpresion(TipoExpresionMatematica.Suma, $1, $3); }
	| expresion_logica RESTA expresion_logica				{ $$ = $1+"-"+$3;}					//{ $$ = nuevaExpresion(TipoExpresionMatematica.Resta, $1, $3); }
	| expresion_logica MULTIPLICACION expresion_logica	    { $$ = $1+"*"+$3;} 					//{ $$ = nuevaExpresion(TipoExpresionMatematica.Multiplicacion, $1, $3); }
	| expresion_logica DIVISION expresion_relacional        { $$ = $1+"/"+$3;} 					//{ $$ = nuevaExpresion(TipoExpresionMatematica.Division, $1, $3); }
	| expresion_logica MODULO expresion_logica              { $$ = $1+"/"+$3;}					//{ $$ = nuevaExpresion(TipoExpresionMatematica.Modulo, $1, $3); }
	| expresion_logica POTENCIA expresion_logica	        { $$ = $1+"/"+$3;}					//{ $$ = nuevaExpresion(TipoExpresionMatematica.Potencia, $1, $3); }
	| INTEGER		    					{ $$ = $1.toString();}				//{ $$ = nuevoTerminalDato(yytext, this._$.first_line, this._$.first_column, TipoDato.Integer); }
	| DOUBLE								{ $$ = $1;}							//{ $$ = nuevoTerminalDato(yytext, this._$.first_line, this._$.first_column, TipoDato.Double);  }
	| VARIABLE_IDENTIFICADOR				{ $$ = $1.toString();}				//{ $$ = nuevoTerminal(yytext, this._$.first_line, this._$.first_column); }
    | STRING                                { $$ = "\""+$1.toString()+"\"";}	//{ $$ = nuevoTerminalDato(yytext, this._$.first_line, this._$.first_column, TipoDato.String); }
    | CHAR                                  { $$ = "\'"+$1.toString()+"\'";}	//{ $$ = nuevoTerminalDato(yytext, this._$.first_line, this._$.first_column, TipoDato.Char); }
    | BOOLEAN                               { $$ = $1.toString();}				//{ $$ = nuevoTerminalDato(yytext, this._$.first_line, this._$.first_column, TipoDato.Boolean); }
	| llamada_funcion                       { $$ = $1; }
    
*/
    //por si acaso
	//| PAR_IZQ expresion PAR_DER	%prec GRUPO	{ $$ = "("+$2+")"; /* $$ = nuevaExpresion(TipoExpresionMatematica.Grupo, $1); */ }
    /*
;

*/
/*
expresion_relacional
	: expresion_logica MAYOR_QUE expresion_logica		    { $$ = $1+">"+$3; }		//{ $$ = nuevaExpresion(TipoExpresionRelacional.MayorQue, $1, $3); }
	| expresion_logica MENOR_QUE expresion_logica		    { $$ = $1+"<"+$3; }		//{ $$ = nuevaExpresion(TipoExpresionRelacional.MenorQue, $1, $3); }
	| expresion_logica MAYOR_IGUAL_QUE expresion_logica	{ $$ = $1+">="+$3; }	//{ $$ = nuevaExpresion(TipoExpresionRelacional.MayorIgualQue, $1, $3); }
	| expresion_logica MENOR_IGUAL_QUE expresion_logica	{ $$ = $1+"<="+$3; }	//{ $$ = nuevaExpresion(TipoExpresionRelacional.MenorIgualQue, $1, $3); }
	| expresion_logica IGUALDAD expresion_logica			{ $$ = $1+"=="+$3; }	//{ $$ = nuevaExpresion(TipoExpresionRelacional.Igualdad, $1, $3); }
	| expresion_logica DIFERENCIA expresion_logica		{ $$ = $1+"!="+$3; }	//{ $$ = nuevaExpresion(TipoExpresionRelacional.Diferencia, $1, $3); }
	| expresion_logica INCERTEZA expresion_logica 		{ $$ = $1+"~"+$3; }		//{ $$ = nuevaExpresion(TipoExpresionRelacional.Incerteza, $1, $3); }
    | expresion_logica                             { $$ = $1; }
;

expresion_logica
	: expresion_relacional AND expresion_relacional     { $$ = $1+"&&"+$3; }	//{ $$ = nuevaExpresion(TipoExpresionLogica.And, $1, $3);}
	| expresion_relacional XOR expresion_relacional     { $$ = $1+"!&"+$3; }	//{ $$ = nuevaExpresion(TipoExpresionLogica.Xor, $1, $3);}
	| expresion_relacional OR expresion_relacional 		{ $$ = $1+"||"+$3; }	//{ $$ = nuevaExpresion(TipoExpresionLogica.Or, $1, $3);}
	| NOT expresion_relacional							{ $$ = "!"+$2; } 		//{ $$ = nuevaExpresion(TipoExpresionLogica.Not, $2); }
	| PAR_IZQ expresion_logica PAR_DER	%prec GRUPO	    { $$ = "("+$2+")"; }    //{ $$ = nuevaExpresion(TipoExpresionLogica.Grupo, $2); }
	| expresion_relacional								{ $$ = $1; }
;
*/
expresion_logica
	: expresion_logica SUMA expresion_logica				{ $$ = Parser.yy.utilidades.nuevaExpresion("SUMA", $1, $3); }
	| expresion_logica RESTA expresion_logica				{ $$ = Parser.yy.utilidades.nuevaExpresion("RESTA", $1, $3); }
	| expresion_logica MULTIPLICACION expresion_logica	    { $$ = Parser.yy.utilidades.nuevaExpresion("MULTIPLICACION", $1, $3); }
	| expresion_logica DIVISION expresion_logica            { $$ = Parser.yy.utilidades.nuevaExpresion("DIVISION", $1, $3); }
	| expresion_logica MODULO expresion_logica              { $$ = Parser.yy.utilidades.nuevaExpresion("MODULO", $1, $3); }
	| expresion_logica POTENCIA expresion_logica	        { $$ = Parser.yy.utilidades.nuevaExpresion("POTENCIA", $1, $3); }
	| RESTA expresion_logica %prec URESTA			        { $$ = Parser.yy.utilidades.nuevaExpresion("MENOS_U", $2); }
	| expresion_logica MAYOR_QUE expresion_logica		    { $$ = Parser.yy.utilidades.nuevaExpresionRelacional("MAYOR_QUE", $1, $3); }
	| expresion_logica MENOR_QUE expresion_logica		    { $$ = Parser.yy.utilidades.nuevaExpresionRelacional("MENOR_QUE", $1, $3); }
	| expresion_logica MAYOR_IGUAL_QUE expresion_logica	    { $$ = Parser.yy.utilidades.nuevaExpresionRelacional("MAYOR_IGUAL_QUE", $1, $3); }
	| expresion_logica MENOR_IGUAL_QUE expresion_logica	    { $$ = Parser.yy.utilidades.nuevaExpresionRelacional("MENOR_IGUAL_QUE", $1, $3); }
	| expresion_logica IGUALDAD expresion_logica			{ $$ = Parser.yy.utilidades.nuevaExpresionRelacional("IGUALDAD", $1, $3); }
	| expresion_logica DIFERENCIA expresion_logica		    { $$ = Parser.yy.utilidades.nuevaExpresionRelacional("DIFERENCIA", $1, $3); }
	| expresion_logica INCERTEZA expresion_logica 		    { $$ = Parser.yy.utilidades.nuevaExpresionRelacional("INCERTEZA", $1, $3); }
	| expresion_logica AND expresion_logica                 { $$ = Parser.yy.utilidades.nuevaExpresionLogica("AND", $1, $3);}
	| expresion_logica XOR expresion_logica                 { $$ = Parser.yy.utilidades.nuevaExpresionLogica("XOR", $1, $3);}
	| expresion_logica OR expresion_logica 		            { $$ = Parser.yy.utilidades.nuevaExpresionLogica("OR", $1, $3);}
	| NOT expresion_logica							        { $$ = Parser.yy.utilidades.nuevaExpresionLogica("NOT", $2); }
	| PAR_IZQ expresion_logica PAR_DER	%prec GRUPO	        { $$ = Parser.yy.utilidades.nuevaExpresion("GRUPO", $2); }
	| INTEGER		    					{ $$ = Parser.yy.utilidades.nuevoTerminalDato(yytext, this._$.first_line, this._$.first_column, 0); }
	| DOUBLE								{ $$ = Parser.yy.utilidades.nuevoTerminalDato(yytext, this._$.first_line, this._$.first_column, 1); }
	| VARIABLE_IDENTIFICADOR				{ $$ = Parser.yy.utilidades.nuevoTerminal(yytext, this._$.first_line, this._$.first_column); }
    | STRING                                { $$ = Parser.yy.utilidades.nuevoTerminalDato(yytext, this._$.first_line, this._$.first_column, 2); }
    | CHAR                                  { $$ = Parser.yy.utilidades.nuevoTerminalDato(yytext, this._$.first_line, this._$.first_column, 3); }
    | BOOLEAN                               { $$ = Parser.yy.utilidades.nuevoTerminalDato(yytext, this._$.first_line, this._$.first_column, 4); }
	| llamada_funcion                       { $$ = $1; }
;