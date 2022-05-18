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
import { AdministradorProcesos } from './services/parser/interpreter/AdministrarProcesos';

declare var require: NodeRequire;

export interface DialogFile {
  file: any;
}

export class ArchivoPreinterpretado{
  nombreArchivo: string;
  ast: AST
  tablaDeSimbolos: TablaDeSimbolos|undefined;
  presenciaDePrincipal: boolean;
  archivosImportados:string[]|undefined;

  constructor(nombreArchivo:string, ast:AST, tablaDeSimbolos?:TablaDeSimbolos, presenciaDePrincipal:boolean = false, archivosImportados?:string[]){
    this.nombreArchivo = nombreArchivo;
    this.ast = ast;
    this.tablaDeSimbolos= tablaDeSimbolos;
    this.presenciaDePrincipal = presenciaDePrincipal;
    this.archivosImportados = archivosImportados;
  }
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
  
  archivosProyecto: ArchivoPreinterpretado[] = []
  
  colaImportaciones: string[] = []
  
  

  @ViewChild('astCanvas') ast!: ElementRef;
  @ViewChild('linkDescargaAST') linkDescargaAST!: ElementRef;
  @ViewChild('expresionesCanvas') expresiones!: ElementRef;
  @ViewChild('linkDescargaExpresiones') linkDescargaExpresiones!: ElementRef;
  @ViewChild('tablasCanvas') tablas!: ElementRef;
  @ViewChild('linkDescargaExpresiones') linkDescargaTablas!: ElementRef;

  @ViewChild('editorTabs') editorTabs!: EditorTabsComponent;

  static archivosEditor:string[] = []

  constructor(public dialogCarga: MatDialog){
    this.area_programa.disabled
    this.area_interprete.disabled
  }
  
  obtenerArchivo(nombre:string){
    for (let i = 0; i < this.archivosProyecto.length; i++) {
      const archivo = this.archivosProyecto[i];
      if (archivo.nombreArchivo == nombre) {
        return archivo;
      }
    }
    return undefined;
  }
  
  cambiarArchivo(nombre:string, nuevoValor:ArchivoPreinterpretado){
    for (let i = 0; i < this.archivosProyecto.length; i++) {
      const archivo = this.archivosProyecto[i];
      if (archivo.nombreArchivo == nombre) {
        this.archivosProyecto[i] = nuevoValor;
      }
    }
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
  
  listadoErrores:ErrorList = new ErrorList();
  hayErrores:boolean = false;
  
  archivosCantidadImportaciones: Map<string,number> = new Map();

  public analizar_archivo(nombreArchivo:string){
    this.listadoErrores = new ErrorList();
    let contenidoArchivo:string|undefined = undefined;
    let archivosImportados:string[] = []
    for (let i = 0; i < this.editorTabs.tabs.length; i++) {
      const tab = this.editorTabs.tabs[i];
      if (tab["label"] == nombreArchivo) {
        contenidoArchivo = tab["content"]

        //Se agrega un salto de linea al final para facilitar el parseo si es necesario
        if (contenidoArchivo.charAt(contenidoArchivo.length-1) != '\n') {
          contenidoArchivo += '\n';
        }
        break;
      }
    }
    if (contenidoArchivo == undefined) {
      this.listadoErrores.agregarErrorExterno("No se encontro el archivo: "+nombreArchivo);
    } else {
      let controlConsola = new ControlConsola(this.area_interprete);
      this.listaASTFunciones = []
      this.datosTablas = []
      this.expresionesDibujo = []

      //Se invoca una instancia del parser
      const parser = require("./services/parser/crl_parser.js")
      
      //Se agrega la lista de errores, el ast, y la tabla de simbolos al parser
      let ast = new AST(archivosImportados, nombreArchivo);
      let astUtilidades = new UtilidadesAST();

      parser.Parser.yy = { listaErrores: this.listadoErrores, ast: ast, utilidades: astUtilidades }
      
      //Se imprimer informacion
      controlConsola.agregarOutputResaltado("Realizando Analisis Lexico/Sintactico de: "+nombreArchivo);
      
      try{
        //Se parsea el contenido
        parser.parser.parse(contenidoArchivo);
      } catch(error) {
        this.listadoErrores.agregarErrorParametros("EOF",0,0,"Error irrecuperable encontrado o comentario sin cerrar al final del archivo");
      }
      
      if (this.listadoErrores.errores.length > 0) {
        this.hayErrores = true;
        controlConsola.agregarOutput("Se encontraron los siguientes errores lexicos y sintacticos:", true);
        this.listadoErrores.errores.forEach(error => {
          controlConsola.agregarOutput(error.toString(), false);
        });
      } 
      controlConsola.agregarOutput("AST Generado",true);
      this.archivosProyecto.push(new ArchivoPreinterpretado(nombreArchivo, ast))
      
      controlConsola.agregarOutput("---------------------------------------------------------------------------------",false);
      
      this.colaImportaciones.push(...archivosImportados);
      this.archivosCantidadImportaciones.set(nombreArchivo, archivosImportados.length);
      archivosImportados.forEach(archivoImportado => {
        this.analizar_archivo(archivoImportado);
      });
    }
  }
  
  reset_compilador(){
    let controlOutput = new ControlConsola(this.area_programa);
    controlOutput.limpiarOutput()
    this.archivosCantidadImportaciones = new Map();
    this.archivosProyecto = []
    this.colaImportaciones = [];
    this.hayErrores = false;
    this.guardarArchivosEditor();
    this.listaASTFunciones = []
    this.datosTablas = []
    this.expresionesDibujo = []
    this.listadoErrores = new ErrorList();
  }
  
  compilar(){
    this.reset_compilador();
    let contenido = this.editorTabs.tabs[this.editorTabs.selected.value]["content"];
    let nombreArchivoEjecutar = this.editorTabs.tabs[this.editorTabs.selected.value]["label"];
    let controlConsola = new ControlConsola(this.area_interprete);
    let archivosImportados:string[] = []

    //Se limpia la consola de su anterior uso
    controlConsola.limpiarOutput();
    
    //Se invoca una instancia del parser
    const parser = require("./services/parser/crl_parser.js")
    
    //Se agrega la lista de errores, el ast, y la tabla de simbolos al parser
    let ast = new AST(archivosImportados, nombreArchivoEjecutar);
    let astUtilidades = new UtilidadesAST();

    parser.Parser.yy = { listaErrores: this.listadoErrores, ast: ast, utilidades: astUtilidades }
    
    //Se agrega un salto de linea al final para facilitar el parseo si es necesario
    if (contenido.charAt(contenido.length-1) != '\n') {
      contenido += '\n';
    }
    
    //Se imprimer informacion
    controlConsola.agregarOutputResaltado("Realizando Analisis Lexico/Sintactico de: "+nombreArchivoEjecutar);
    
    try{
      //Se parsea el contenido
      parser.parser.parse(contenido);
    } catch(error) {
      this.listadoErrores.agregarErrorParametros("EOF",0,0,"Error irrecuperable encontrado o comentario sin cerrar al final del archivo");
      console.log(error)
    }
    
    if (this.listadoErrores.errores.length > 0) {
      this.hayErrores = true;
      controlConsola.agregarOutput("Se encontraron los siguientes errores durante el analisis lexico y sintactico:", true);
      this.listadoErrores.errores.forEach(error => {
        controlConsola.agregarOutput(error.toString(), false);
      });
    } 
    controlConsola.agregarOutput("AST Generado",true);
    controlConsola.agregarOutput("---------------------------------------------------------------------------------",false);
    
    this.archivosProyecto.push(new ArchivoPreinterpretado(nombreArchivoEjecutar, ast))
    
    this.colaImportaciones.push(...archivosImportados);
    this.archivosCantidadImportaciones.set(nombreArchivoEjecutar, archivosImportados.length);
    archivosImportados.forEach(archivoImportado => {
      this.analizar_archivo(archivoImportado);
    });
    
    this.colaImportaciones.unshift(nombreArchivoEjecutar);

    let temp = new Map([...this.archivosCantidadImportaciones.entries()].sort((a, b) => b[1] - a[1]));
    this.archivosCantidadImportaciones = temp;
    this.colaImportaciones = Array.from(this.archivosCantidadImportaciones.keys());


    
    //TODO:quitar
    controlConsola.agregarOutput("Importaciones",false)
    this.colaImportaciones.forEach(importacion => {
      controlConsola.agregarOutput(importacion,true)
    });
    


    
      

    console.log("errores "+this.hayErrores)
    //Se realiza el analisis semantico
    this.analisis_semantico();
    console.log("semanticoerrores "+this.hayErrores)
    
    if (!this.hayErrores) {
      this.interpretar(nombreArchivoEjecutar);
    } 
    /*
    this.listadoErrores = new ErrorList();
    controlConsola.agregarOutput("Realizando Analisis Semantico",true);
    
    let tablaSimbolos = new TablaDeSimbolos();
    let analizadorSemantico = new SemanticAnalyzer(ast, tablaSimbolos, this.listadoErrores, this.archivosProyecto, nombreArchivoEjecutar, this.colaImportaciones);
    analizadorSemantico.analizarAST();
    controlConsola.agregarOutputResaltado("Analisis Semantico Finalizado");
    if (this.listadoErrores.errores.length > 0) {
      controlConsola.agregarOutput("Se encontraron los siguientes errores:", true);
      this.listadoErrores.errores.forEach(error => {
        controlConsola.agregarOutput(error.toString(), false);
      });
    } else {
      controlConsola.agregarOutputResaltado("Analisis Semantico Exitoso");
    }

    console.log(tablaSimbolos)
    
    //En caso de que no existan errores se realizara la interpretacion, caso contrario no se hara
    if (this.listadoErrores.errores.length == 0) {
      controlConsola.agregarOutputResaltado("Iniciando Interpretacion");
      this.listadoErrores = new ErrorList();

      //this.interpretar();
    } 
    console.log(tablaSimbolos);
    */
  }
  
  analisis_semantico(){
    let controlConsola = new ControlConsola(this.area_interprete);
    //Se realiza el analisis semantico a la cola de importaciones de manera inversa siendo el archivo ejecutado el ultimo en ser analizado
    for (let i = this.colaImportaciones.length-1; i >= 0; i--) {
      const archivoActual = this.colaImportaciones[i]

      this.listadoErrores = new ErrorList();
      controlConsola.agregarOutputResaltado("Realizando Analisis Semantico de: "+archivoActual);
      let archivoPreInterpretado = this.obtenerArchivo(archivoActual);
      
      let semanticAnalyzer = new SemanticAnalyzer(archivoPreInterpretado!, new TablaDeSimbolos(), this.listadoErrores, this.archivosProyecto);
      let archivoObtenido = semanticAnalyzer.analizarAST();
      this.cambiarArchivo(archivoActual, archivoObtenido);
      console.log(archivoObtenido.tablaDeSimbolos);
      if (this.listadoErrores.errores.length > 0) {
        this.hayErrores = true;
        controlConsola.agregarOutput("Se encontraron los siguientes errores durante el analisis semantico:", true);
        this.listadoErrores.errores.forEach(error => {
          controlConsola.agregarOutput(error.toString(), false);
        });
      } 
      controlConsola.agregarOutput("---------------------------------------------------------------------------------",false);
    }
    let archivosPrincipal:string[] = [];
    this.archivosProyecto.forEach(archivo => {
      if (archivo.presenciaDePrincipal) {
        archivosPrincipal.push(archivo.nombreArchivo);
      }
    });
    this.listadoErrores = new ErrorList();
    if (!this.archivosProyecto[0].presenciaDePrincipal) {
      this.listadoErrores.agregarErrorExterno("El metodo Principal no esta presente en el archivo ejecutado");
    }
    if (archivosPrincipal.length>1) {
      this.listadoErrores.agregarErrorExterno("Hay mas de un archivo con metodos Principal: "+archivosPrincipal.toString());
    }
    if (this.listadoErrores.errores.length > 0) {
      this.hayErrores = true;
      this.listadoErrores.errores.forEach(error => {
        controlConsola.agregarOutput(error.toString(), false);
      });
    } 
  }
  
  interpretar(archivoPrincipal:string){
      let controlConsola = new ControlConsola(this.area_interprete);
      let controlOutput = new ControlConsola(this.area_programa);
      controlOutput.limpiarOutput();
      let administradorProcesos = new AdministradorProcesos(this.archivosProyecto, this.listadoErrores, controlOutput, 
                                                            [this.listaASTFunciones,this.datosTablas,this.expresionesDibujo])
      
      //Se preanalizan las variables globales e incertezas
      this.archivosProyecto.forEach(archivo => {
        let interprete = new Interpreter(archivo.ast, archivo.tablaDeSimbolos!, controlOutput, this.listadoErrores, 
                                        [this.listaASTFunciones,this.datosTablas,this.expresionesDibujo], this.archivosProyecto, archivo, administradorProcesos);
        interprete.interpretar_ast();
      });
      
      if (this.listadoErrores.errores.length > 0) {
        controlConsola.agregarOutput("Se encontraron los siguientes errores en pre-interpretacion:", true);
        this.listadoErrores.errores.forEach(error => {
          controlConsola.agregarOutput(error.toString(), false);
        });
      } else {
        this.listadoErrores = new ErrorList();
        controlConsola.agregarOutputResaltado("Iniciando Interpretacion");
        administradorProcesos.llamarProcedimiento(archivoPrincipal, "&Principal|", new Map())
        controlConsola.agregarOutputResaltado("Interpretacion Finalizada");
      }
  }

  guardarArchivosEditor(){
    AppComponent.archivosEditor = [];
    this.editorTabs.tabs.forEach(tab => {
      AppComponent.archivosEditor.push(tab["label"]);
    });
  }

  static buscarArchivo(archivoBuscar:string){
    let contenidoArchivo:string|undefined = undefined;
    for (let i = 0; i < AppComponent.archivosEditor.length; i++) {
      const archivo = AppComponent.archivosEditor[i];
      if (archivo == archivoBuscar) {
        return true;
      }
    }
    return false;
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