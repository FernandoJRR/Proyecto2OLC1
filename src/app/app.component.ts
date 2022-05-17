import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { Form, FormControl, FormsModule, NgModel } from '@angular/forms';
import * as CodeMirror from 'codemirror';
import { ErrorList } from "./services/parser/manejo_error/ErrorList";
import { AST, UtilidadesAST } from "./services/parser/ast/AST";

import "codemirror/addon/mode/simple"
import { SemanticAnalyzer } from './services/parser/interpreter/SemanticAnalyzer';
import { TablaDeSimbolos } from './services/parser/tabla_de_simbolos/TablaDeSimbolos';
import { Interpreter } from './services/parser/interpreter/Interpreter';
import html2canvas from 'html2canvas';
import { EditorTabsComponent } from './editor-tabs/editor-tabs.component';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

declare var require: NodeRequire;

export interface DialogFile {
  file: any;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Proyecto2OLC1-app';
  
  area_programa = new FormControl('');
  area_interprete = new FormControl('');
  content = {};  
  
  listaASTFunciones: any = []
  
  datosTablas: any = []
  columnasTabla: string[] = ["item","contenido"]
  expresionesDibujo: any = []
  

  @ViewChild('astCanvas') ast!: ElementRef;
  @ViewChild('linkDescargaAST') linkDescargaAST!: ElementRef;
  @ViewChild('expresionesCanvas') expresiones!: ElementRef;
  @ViewChild('linkDescargaExpresiones') linkDescargaExpresiones!: ElementRef;
  @ViewChild('tablasCanvas') tablas!: ElementRef;
  @ViewChild('linkDescargaExpresiones') linkDescargaTablas!: ElementRef;

  @ViewChild('editorTabs') editorTabs!: EditorTabsComponent;

  constructor(public dialogCarga: MatDialog){
    this.area_programa.disabled
    this.area_interprete.disabled
  }
  
  cargarArchivo(){
    const dialogRef = this.dialogCarga.open(DialogCargarArchivo, {
      width: '20%',
      data: {file: ""},
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result[1] == 'OK') {
        let fileReader = new FileReader();
        fileReader.onload = (e) => {
          this.editorTabs.agregarTab(true, result[0].name, fileReader.result as string);
        }
        fileReader.readAsText(result[0]);
      }
    });
  }
  
  descargarArchivo(){
      var textFileAsBlob = new Blob([this.editorTabs.tabs[this.editorTabs.selected.value]["content"]], {type:'text/plain'}); 
    	var downloadLink = document.createElement("a");
    	downloadLink.download = this.editorTabs.tabs[this.editorTabs.selected.value]["label"];
    	downloadLink.innerHTML = "Download File";
    	if (window.webkitURL != null){
    		// Chrome allows the link to be clicked
    		// without actually adding it to the DOM.
    		downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
    	} else {
    		// Firefox requires the link to be added to the DOM
    		// before it can be clicked.
    		downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
    		downloadLink.onclick = destroyComponente;
    		downloadLink.style.display = "none";
    		document.body.appendChild(downloadLink);
    	}

    	downloadLink.click();
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

  descargarAST(){
    html2canvas(this.ast.nativeElement).then(canvas => {
      this.linkDescargaAST.nativeElement.href = canvas.toDataURL('image/png');
      this.linkDescargaAST.nativeElement.download = 'ast_dibujo.png';
      this.linkDescargaAST.nativeElement.click();
    })
  }

  descargarTablas(){
    html2canvas(this.tablas.nativeElement).then(canvas => {
      this.linkDescargaTablas.nativeElement.href = canvas.toDataURL('image/png');
      this.linkDescargaTablas.nativeElement.download = 'tablas_dibujo.png';
      this.linkDescargaTablas.nativeElement.click();
    })
  }

  descargarExpresiones(){
    html2canvas(this.expresiones.nativeElement).then(canvas => {
      this.linkDescargaExpresiones.nativeElement.href = canvas.toDataURL('image/png');
      this.linkDescargaExpresiones.nativeElement.download = 'expresiones_dibujo.png';
      this.linkDescargaExpresiones.nativeElement.click();
    })
  }
  
  compilar(){
    let contenido = this.editorTabs.tabs[this.editorTabs.selected.value]["content"];
    let controlConsola = new ControlConsola(this.area_interprete);
    let controlOutput = new ControlConsola(this.area_programa);
    this.listaASTFunciones = []
    this.datosTablas = []
    this.expresionesDibujo = []

    //Se limpia la consola de su anterior uso
    controlConsola.limpiarOutput();
    
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
    controlConsola.agregarOutputResaltado("Realizando Analisis");
    
    try{
      //Se parsea el contenido
      parser.parser.parse(contenido);
    } catch(error) {
      listadoErrores.agregarErrorParametros("EOF",0,0,"Error irrecuperable encontrado o comentario sin cerrar al final del archivo");
    }
    
    if (listadoErrores.errores.length > 0) {
      controlConsola.agregarOutput("Se encontraron los siguientes errores lexicos y sintacticos:", true);
      listadoErrores.errores.forEach(error => {
        controlConsola.agregarOutput(error.toString(), false);
      });
    } 
    controlConsola.agregarOutput("AST Generado",true);
    let nodosAST = []
    nodosAST.push(ast.obtenerRecorrido());
    
    //Se realiza el analisis semantico
    listadoErrores = new ErrorList();
    controlConsola.agregarOutput("Realizando Analisis Semantico",true);
    
    let tablaSimbolos = new TablaDeSimbolos();
    let analizadorSemantico = new SemanticAnalyzer(ast, tablaSimbolos, listadoErrores);
    analizadorSemantico.analizarAST();
    controlConsola.agregarOutputResaltado("Analisis Semantico Finalizado");
    if (listadoErrores.errores.length > 0) {
      controlConsola.agregarOutput("Se encontraron los siguientes errores:", true);
      listadoErrores.errores.forEach(error => {
        controlConsola.agregarOutput(error.toString(), false);
      });
    } else {
      controlConsola.agregarOutputResaltado("Analisis Semantico Exitoso");
    }

    console.log(tablaSimbolos)
    
    //En caso de que no existan errores se realizara la interpretacion, caso contrario no se hara
    if (listadoErrores.errores.length == 0) {
      controlConsola.agregarOutputResaltado("Iniciando Interpretacion");
      listadoErrores = new ErrorList();
      
      controlOutput.limpiarOutput();
      let interprete = new Interpreter(ast, tablaSimbolos, controlOutput, listadoErrores, [this.listaASTFunciones,this.datosTablas,this.expresionesDibujo]);
      interprete.interpretar_ast();
      console.log("funcionesast")
      console.log(this.listaASTFunciones)
      
      if (listadoErrores.errores.length > 0) {
        controlConsola.agregarOutput("Se encontraron los siguientes errores:", true);
        listadoErrores.errores.forEach(error => {
          controlConsola.agregarOutput(error.toString(), false);
        });
      } else {
        controlConsola.agregarOutputResaltado("Interpretacion Exitosa");
      }

    } else {
            
    }

    console.log(tablaSimbolos);
  }


}

function destroyComponente(e: any){
    document.body.removeChild(e.target);
  }
export class ControlConsola{
  consola: FormControl;
  
  constructor(consola: FormControl){
    this.consola = consola;
  }

  agregarOutput(nuevoOutput: string, indentacion: boolean){
    var textoActual = this.consola.value;
    if (indentacion) {
      this.consola.setValue(textoActual+">>>"+nuevoOutput+"\n");
    } else {
      this.consola.setValue(textoActual+nuevoOutput+"\n");
    }
  }
  
  agregarOutputResaltado(nuevoOutput: string){
    this.agregarOutput("========= "+nuevoOutput+" ==========", false);
  }
  
  limpiarOutput(){
    this.consola.setValue('');
  }
}

@Component({
  selector: 'cargar-archivo',
  templateUrl: './cargar-archivo.html',
})
export class DialogCargarArchivo {
constructor(
    public dialogRef: MatDialogRef<DialogCargarArchivo>,
    @Inject(MAT_DIALOG_DATA) public data: DialogFile,
  ) {}
  
  procesarSeleccion(event: any){
    this.data.file = event.target!.files[0]   
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}