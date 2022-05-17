/**
 * Gramatica Lexer/Parser Interpolation
 */

/* Lexer */
%lex

%x parametro_state

%%

"{"                     this.pushState("parametro_state");
<parametro_state>"}"    this.popState();
<parametro_state>[^}]+<<EOF>> Parser.yy.formato.push("{"+yytext);
<parametro_state>[^}]+  Parser.yy.formato.push([yytext]);

<<EOF>>	 //Se termina el string
[^{}]+   { Parser.yy.formato.push(yytext) }
\s  { Parser.yy.formato.push(yytext)}

/lex

%%
S:;
%%