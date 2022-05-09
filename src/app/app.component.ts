import { Component } from '@angular/core';
import { FormControl, FormsModule, NgModel } from '@angular/forms';
import * as CodeMirror from 'codemirror';
import { ErrorList } from "./services/parser/manejo_error/ErrorList";
import { AST, UtilidadesAST } from "./services/parser/ast/AST";

import "codemirror/addon/mode/simple"

declare var require: NodeRequire;


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Proyecto2OLC1-app';
  
  area_codigo = new FormControl('');
  content = {};  
  
  constructor(){
    this.area_codigo.disabled
    this.content = "";
  }

  manejoTab(event:any) {
      if (event.key == 'Tab') {
          event.preventDefault();
          var start = event.target.selectionStart;
          var end = event.target.selectionEnd;
          event.target.value = event.target.value.substring(0, start) + '\t' + event.target.value.substring(end);
          event.target.selectionStart = event.target.selectionEnd = start + 1;
      }
  }
  
  compilar(contenido: string){
    //Se limpia la consola de su anterior uso
    this.limpiarOutput();
    
    //Se invoca una instancia del parser
    const parser = require("./services/parser/crl_parser.js")
    
    //Se agrega la lista de errores, el ast, y la tabla de simbolos al parser
    let listadoErrores = new ErrorList();
    let ast = new AST();
    let astUtilidades = new UtilidadesAST();

    parser.Parser.yy = { listaErrores: listadoErrores, ast: ast, utilidades: astUtilidades }
    
    //Se agrega un salto de linea al final para facilitar el parseo si es necesario
    if (contenido.charAt(contenido.length-1) != '\n') {
      contenido += '\n';
    }
    
    //Se imprimer informacion
    this.agregarOutputResaltado("Realizando Compilacion");
    
    //Se parsea el contenido
    parser.parser.parse(contenido);
    
    if (listadoErrores.errores.length > 0) {
      this.agregarOutput("Se encontraron los siguientes errores:", true);
      listadoErrores.errores.forEach(error => {
        this.agregarOutput(error.toString(), false);
      });
      this.agregarOutputResaltado("Compilacion Fallida");
    } else {
      this.agregarOutputResaltado("Compilacion Exitosa");
    }

    this.agregarOutput("AST obtenido",true);
    this.agregarOutput(ast.obtenerRecorrido(),false);
  }
  
  agregarOutput(nuevoOutput: string, indentacion: boolean){
    var textoActual = this.area_codigo.value;
    if (indentacion) {
      this.area_codigo.setValue(textoActual+">>>"+nuevoOutput+"\n");
    } else {
      this.area_codigo.setValue(textoActual+nuevoOutput+"\n");
    }
  }
  
  agregarOutputResaltado(nuevoOutput: string){
    this.agregarOutput("========= "+nuevoOutput+" ==========", false);
  }
  
  limpiarOutput(){
    this.area_codigo.setValue('');
  }
}

CodeMirror.defineSimpleMode("clr", {
 // The start state contains the rules that are initially used
  start: [

    {regex: /!!.*/, token: "comment"},

    // A next property will cause the mode to move to a different state
    {regex: /'''/, token: "comment", next: "comment"},

    // The regex matches the token, the token property contains the type
    {regex: /"(?:[^\\]|\\.)*?(?:"|$)/, token: "string"},
    // You can match multiple tokens at once. Note that the captured
    // groups must span the whole string in this case
    {regex: /(function)(\s+)([a-z$][\w$]*)/,
     token: ["keyword", "", "variable-2"]},
     
    // Rules are matched in the order in which they appear, so there is
    // no ambiguity between this one and the one above
    {regex: /(?:Int|Void|String|Retorno|Continuar|Para|Mientras|Si|Sino|Detener|Boolean|Char|Double|Mostrar|Importar|Incerteza)\b/,
     token: "keyword"},
    {regex: /true|false/, token: "atom"},
    {regex: /0x[a-f\d]+|[-+]?(?:\.\d+|\d+\.?\d*)/,
     token: "number"},
    {regex: /\/\/.*/, token: "comment"},
    {regex: /\/(?:[^\\]|\\.)*?\//, token: "variable-3"},

    {regex: /[-+\/*=<>!]+/, token: "operator"},

    // indent and dedent properties guide autoindentation
    //{regex: /[\{\[\(]/, indent: false},
    //{regex: /[\}\]\)]/, dedent: false},
    {regex: /[a-z$][\w$]*/, token: "variable"},
    
    // You can embed other modes with the mode property. This rule
    // causes all code between << and >> to be highlighted with the XML
    // mode.
  ],
  // The multi-line comment state.
  comment: [
    {regex: /.*?'''/, token: "comment", next: "start"},
    {regex: /.*/, token: "comment"}
  ],
});