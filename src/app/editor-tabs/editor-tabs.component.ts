import { Component, Inject, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import * as CodeMirror from 'codemirror';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

export interface DialogData {
  name: string;
}

@Component({
  selector: 'app-editor-tabs',
  templateUrl: './editor-tabs.component.html',
  styleUrls: ['./editor-tabs.component.css']
})
export class EditorTabsComponent implements OnInit {
  tabs = [{ label: 'main.crl', content: ""}];
  selected = new FormControl(0);

  ngOnInit(): void {
  }
  constructor(public dialog: MatDialog){}

  agregarTab(selectAfterAdding: boolean, label: string = 'new'+(this.tabs.length+1)+".crl", contenido: string = "") {
    this.tabs.push({ label: label, content:contenido });

    if (selectAfterAdding) {
      this.selected.setValue(this.tabs.length - 1);
    }
  }

  deleteTab() {
    this.tabs.splice(this.selected.value, 1);
  }
  
  cambiarNombre(){
    const dialogRef = this.dialog.open(DialogCambiarNombre, {
      width: '20%',
      data: {name: this.tabs[this.selected.value]["label"]},
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result[1] == 'OK') {
        this.tabs[this.selected.value]["label"] = result[0];
      }
    });
  }
}

@Component({
  selector: 'cambiar-nombre-dialog',
  templateUrl: './cambiar-nombre-dialog.html',
})
export class DialogCambiarNombre {
constructor(
    public dialogRef: MatDialogRef<DialogCambiarNombre>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}

CodeMirror.defineSimpleMode("crl", {
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
    {regex: /[a-zA-Z$][\w$]*/, token: "variable"},
    
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
