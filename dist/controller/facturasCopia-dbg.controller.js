sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
],
    function (Controller, _JSONModel, Filter, FilterOperator) {
        "use strict";

        var self;

        return Controller.extend("dev.facturas.controller.Facturas", {

            onInit: function () {
                sap.ui.getCore().getConfiguration().setLanguage("es");
                self = this;
            },

            onShowPdfPress: function (oEvent) {
                // Obtener el ID del archivo desde el contexto del botón
                var pdf_id = oEvent.getSource().getBindingContext().getObject().id_archivo;
                var oData = oEvent.getSource().getBindingContext().getObject();
            
                if (!pdf_id) {
                    sap.m.MessageToast.show("No se encontró la factura asociada.");
                    return;
                }
            
                // Concatenar el número de factura
                var factura = oData.punto_venta.padStart(5, "0") + oData.letra + oData.numero_comprobante.padStart(8, "0");
            
                this._getPdf(pdf_id, factura);
            },
            
            _getPdf: function(pdf_id, factura) {
                var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");              
                var appPath = appId.replaceAll(".", "/");              
                var appModulePath = jQuery.sap.getModulePath(appPath);
                var path = `${appModulePath}/DMS/?objectId=${pdf_id}`;
                var pathLocal = `/DMS/?objectId=${pdf_id}`;
            
                path = `${appModulePath}/DMS/?objectId=pGKBHKJli_RwRVCZ6JKrBzdFrFrYSlZiJBh0qNXmLWE`;
            
                jQuery.ajax({
                    url: path,
                    method: "GET",
                    /*headers:{ "Content-Type": "application/pdf" },*/
                    xhrFields: { responseType: 'blob' },
                    success: (data) => {
                        this._openPdf(data, factura);
                    },
                    error: (e) => {
                        sap.m.MessageToast.show("No se encontró la factura asociada.");
                        console.log(e);
                    }
                });
            },
            
            _openPdf: function (data, factura) {
                const blob = new Blob([data], { type: 'application/pdf' }); 
                const pdfURL = URL.createObjectURL(blob);
            
                // Crear un iframe para mostrar el PDF en un diálogo modal
                if (!this.oDialog) {
                    this.oDialog = new sap.m.Dialog({
                        title: `Factura: ${factura}`, // Título del diálogo con el número de factura
                        contentWidth: "60%",
                        contentHeight: "100%",
                        verticalScrolling: false,
                        horizontalScrolling: false,
                        resizable: true,
                        content: new sap.ui.core.HTML({
                            content: `<iframe src='${pdfURL}' width='100%' height='100%' style='border:none;' title='Factura: ${factura}'></iframe>`
                        }),
                        endButton: new sap.m.Button({
                            text: "Cerrar",
                            press: function () {
                                this.oDialog.close();
                            }.bind(this)
                        })
                    });
                } else {
                    // Actualizar el contenido del iframe y el título en caso de que el diálogo ya exista
                    this.oDialog.setTitle(`Factura: ${factura}`);
                    this.oDialog.getContent()[0].setContent(`<iframe src='${pdfURL}' width='100%' height='100%' style='border:none;' title='Factura: ${factura}'></iframe>`);
                }
            
                this.oDialog.open();
            },                            

            onFilter: function (_oEvent) {
                let filters = [];
                let oView = this.getView();                
                let invoiceNumber = oView.byId("invoiceNumber");
            
                // Filtro por número de factura
                if (invoiceNumber.getValue() !== "") {
                    const factura = invoiceNumber.getValue();
                    const puntoVenta = factura.slice(0, 5);
                    const letra = factura.slice(5, 6);
                    const numeroComprobante = factura.slice(6);
            
                    const combinedFilter = new Filter({
                        filters: [
                            new Filter("punto_venta", FilterOperator.EQ, puntoVenta),
                            new Filter("letra", FilterOperator.EQ, letra),
                            new Filter("numero_comprobante", FilterOperator.EQ, numeroComprobante)
                        ],
                        and: true
                    });
            
                    filters.push(combinedFilter);
                }
            
                // Filtros de fecha
                let oDateFrom = this.byId("dateFrom").getDateValue();
                let oDateTo = this.byId("dateTo").getDateValue();
            
                if (oDateFrom && oDateTo) {
                    // Convertir fechas a formato ISO
                    let sDateFromISO = oDateFrom.toISOString().split("T")[0] + "T00:00:00Z";
                    let sDateToISO = oDateTo.toISOString().split("T")[0] + "T23:59:59Z";
            
                    filters.push(
                        new Filter("fecha_emision", FilterOperator.GE, sDateFromISO),
                        new Filter("fecha_emision", FilterOperator.LE, sDateToISO)
                    );
                }
            
                // Aplicar todos los filtros
                const oList = this.getView().byId("invoicesList");
                const oBinding = oList.getBinding("rows");
                oBinding.filter(filters.length > 0 ? new Filter(filters, true) : []);
            },                             

            onSort: function (oEvent) {
                var oTable = this.byId("invoicesList");
                var oBinding = oTable.getBinding("rows");
                var oColumn = oEvent.getParameter("column");
                var sSortProperty = oColumn.getSortProperty();
                var bDescending = oEvent.getParameter("sortOrder") === "Descending";
            
                // Crear sorter
                var oSorter = new sap.ui.model.Sorter(sSortProperty, bDescending);
            
                // Aplicar sorter
                oBinding.sort(oSorter);
            
                // Asegurarse de que la columna tiene el icono de orden activo
                oTable.getColumns().forEach(function (col) {
                    col.setSorted(false);
                });
                oColumn.setSorted(true);
                oColumn.setSortOrder(bDescending ? "Descending" : "Ascending");
            },
            
            onStatusFilterChange: function (oEvent) {
                const selectedKey = oEvent.getParameter("selectedItem").getKey(); // Obtiene el valor seleccionado
                const oList = this.getView().byId("invoicesList"); // Obtén la lista de facturas
                const oBinding = oList.getBinding("rows"); // Obtén el binding de los ítems de la lista
                const aFilters = [];

                // Si el usuario selecciona un estado específico, agregamos un filtro
                if (selectedKey) {
                    aFilters.push(new sap.ui.model.Filter("estado", sap.ui.model.FilterOperator.EQ, selectedKey));
                }

                // Aplica el filtro a la lista
                oBinding.filter(aFilters);
            },

            onClearFilter: function () {
                let oView = this.getView();
            
                // Limpiar los valores de los filtros
                const dateFrom = oView.byId("dateFrom");
                if (dateFrom) {
                    dateFrom.setDateValue(null); // Limpiar la fecha
                }
            
                const dateTo = oView.byId("dateTo");
                if (dateTo) {
                    dateTo.setDateValue(null); // Limpiar la fecha
                }
            
                const invoiceNumber = oView.byId("invoiceNumber");
                if (invoiceNumber) {
                    invoiceNumber.setValue("");
                }
            
                // Reiniciar el filtro de estado a "Todos"
                const statusFilter = oView.byId("statusFilter");
                if (statusFilter) {
                    statusFilter.setSelectedKey("estado"); // Selecciona "Todos" en el dropdown
                }
            
                // Obtener la lista y su binding
                const oTable = oView.byId("invoicesList");
                const oBinding = oTable.getBinding("rows");
            
                if (oBinding) {
                    // Aplicar un filtro vacío para limpiar la lista
                    oBinding.filter([]);
            
                    // Limpiar la ordenación
                    oBinding.sort(null);
            
                    // Opcional: Mostrar mensaje indicando que se limpiaron los filtros y la ordenación
                    sap.m.MessageToast.show("Filtros y ordenación limpiados.");
                }
            },
            
            concatenarValores: function (puntoVenta, letra, numeroComprobante) {
                return `${puntoVenta}-${letra}-${numeroComprobante}`;
            },

        });
    }
);