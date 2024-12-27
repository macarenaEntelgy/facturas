sap.ui.define(["sap/ui/core/mvc/Controller","sap/ui/model/json/JSONModel","sap/ui/model/Filter","sap/ui/model/FilterOperator"],function(e,t,o,n){"use strict";var i;return e.extend("dev.facturas.controller.Facturas",{onInit:function(){sap.ui.getCore().getConfiguration().setLanguage("es");i=this},onShowPdfPress:function(e){var t=e.getSource().getBindingContext().getObject().id_archivo;var o=e.getSource().getBindingContext().getObject();if(!t){sap.m.MessageToast.show("No se encontró la factura asociada.");return}var n=o.punto_venta.padStart(5,"0")+o.letra+o.numero_comprobante.padStart(8,"0");this._getPdf(t,n)},_getPdf:function(e,t){var o=this.getOwnerComponent().getManifestEntry("/sap.app/id");var n=o.replaceAll(".","/");var i=jQuery.sap.getModulePath(n);var s=`${i}/DMS/?objectId=${e}`;var r=`/DMS/?objectId=${e}`;s=`${i}/DMS/?objectId=pGKBHKJli_RwRVCZ6JKrBzdFrFrYSlZiJBh0qNXmLWE`;jQuery.ajax({url:s,method:"GET",xhrFields:{responseType:"blob"},success:e=>{this._openPdf(e,t)},error:e=>{sap.m.MessageToast.show("No se encontró la factura asociada.");console.log(e)}})},_openPdf:function(e,t){const o=new Blob([e],{type:"application/pdf"});const n=URL.createObjectURL(o);if(!this.oDialog){this.oDialog=new sap.m.Dialog({title:`Factura: ${t}`,contentWidth:"60%",contentHeight:"100%",verticalScrolling:false,horizontalScrolling:false,resizable:true,content:new sap.ui.core.HTML({content:`<iframe src='${n}' width='100%' height='100%' style='border:none;' title='Factura: ${t}'></iframe>`}),endButton:new sap.m.Button({text:"Cerrar",press:function(){this.oDialog.close()}.bind(this)})})}else{this.oDialog.setTitle(`Factura: ${t}`);this.oDialog.getContent()[0].setContent(`<iframe src='${n}' width='100%' height='100%' style='border:none;' title='Factura: ${t}'></iframe>`)}this.oDialog.open()},onFilter:function(e){let t=[];let i=this.getView();let s=i.byId("invoiceNumber");if(s.getValue()!==""){const e=s.getValue();const i=e.slice(0,5);const r=e.slice(5,6);const a=e.slice(6);const l=new o({filters:[new o("punto_venta",n.EQ,i),new o("letra",n.EQ,r),new o("numero_comprobante",n.EQ,a)],and:true});t.push(l)}let r=this.byId("dateFrom").getDateValue();let a=this.byId("dateTo").getDateValue();if(r&&a){let e=r.toISOString().split("T")[0]+"T00:00:00Z";let i=a.toISOString().split("T")[0]+"T23:59:59Z";t.push(new o("fecha_emision",n.GE,e),new o("fecha_emision",n.LE,i))}const l=this.getView().byId("invoicesList");const c=l.getBinding("rows");c.filter(t.length>0?new o(t,true):[])},onSort:function(e){var t=this.byId("invoicesList");var o=t.getBinding("rows");var n=e.getParameter("column");var i=n.getSortProperty();var s=e.getParameter("sortOrder")==="Descending";var r=new sap.ui.model.Sorter(i,s);o.sort(r);t.getColumns().forEach(function(e){e.setSorted(false)});n.setSorted(true);n.setSortOrder(s?"Descending":"Ascending")},onStatusFilterChange:function(e){const t=e.getParameter("selectedItem").getKey();const o=this.getView().byId("invoicesList");const n=o.getBinding("rows");const i=[];if(t){i.push(new sap.ui.model.Filter("estado",sap.ui.model.FilterOperator.EQ,t))}n.filter(i)},onClearFilter:function(){let e=this.getView();const t=e.byId("dateFrom");if(t){t.setDateValue(null)}const o=e.byId("dateTo");if(o){o.setDateValue(null)}const n=e.byId("invoiceNumber");if(n){n.setValue("")}const i=e.byId("statusFilter");if(i){i.setSelectedKey("estado")}const s=e.byId("invoicesList");const r=s.getBinding("rows");if(r){r.filter([]);r.sort(null);sap.m.MessageToast.show("Filtros y ordenación limpiados.")}},concatenarValores:function(e,t,o){return`${e}-${t}-${o}`}})});
//# sourceMappingURL=facturasCopia.controller.js.map