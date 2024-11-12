sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
],
    function (Controller, JSONModel, Filter, FilterOperator) {
        "use strict";

        return Controller.extend("dev.facturas.controller.Facturas", {

            onInit: function () {

            },

            postData: function () {
                let oView = this.getView();

                // Verificar si el modelo está disponible
                var oModelPDF = oView.getModel();
                var oModelDatos = oView.getModel();

                // Verificar si es el modelo correcto
                if (!oModelPDF || !oModelDatos) {
                    console.error("No se pudo obtener el modelo OData. Verifique la configuración del modelo.");
                    return;
                }

                let listaPDF = [];
                let listaDatos = [];

                // Obtener el binding de la lista para OData V4
                try {
                    var oListBindingPDF = oModelPDF.bindList("/Consulta_PDF");
                    var oListBindingDatos = oModelDatos.bindList("/Consulta_Datos");
                } catch (error) {
                    console.error("Error al obtener el binding de la lista: ", error);
                    return;
                }

                // Ejecutar ambas solicitudes usando Promise.all para esperar a que ambas terminen
                Promise.all([
                    oListBindingPDF.requestContexts().then(function (aContextsPDF) {
                        listaPDF = aContextsPDF.map(function (oContext) {
                            return oContext.getObject(); // Devolver el objeto completo
                        });
                    }),
                    oListBindingDatos.requestContexts().then(function (aContextsDatos) {
                        listaDatos = aContextsDatos.map(function (oContext) {
                            return oContext.getObject(); // Devolver el objeto completo
                        });
                    })
                ]).then(() => {
                    console.log('Lista PDF:', listaPDF);
                    console.log('Lista Datos:', listaDatos);

                    let finalList = this.combinarListas(listaPDF, listaDatos);

                    console.log('Lista final combinada:', finalList);

                    let oJSONModel = new JSONModel();
                    oJSONModel.setData({ facturasCombinadas: finalList });

                    oView.setModel(oJSONModel, "invoicesModel");

                }).catch(function (oError) {
                    console.error("Error al obtener los datos:", oError);
                });
            },

            // Función para combinar las listas
            combinarListas: function (lista1, lista2) {
                const listaFiltrada = [];

                // Iterar sobre la primera lista (facturas)
                lista1.forEach(item1 => {
                    // Buscar el elemento en la segunda lista (documentos) que tenga el mismo ID
                    const item2 = lista2.find(item2 => item1.Datos === item2.ID);

                    // Crear un nuevo objeto con datos de item1 y, si existe, datos de item2
                    const nuevoObjeto = {
                          Descripcion: item1.Descripcion,
                          Fecha: item1.Fecha,
                          Estado: item1.Estado,
                          Arch_String: item1.Arch_String,
                          GrossAmount: item2 ? item2.GrossAmount : null,
                          InvoiceNumber: item2 ? item2.InvoiceNumber : null
                        };

                    // Añadir el nuevo objeto a la lista filtrada
                    listaFiltrada.push(nuevoObjeto);
                });

                // Agregar elementos de lista2 que no tienen coincidencias en lista1
                lista2.forEach(item2 => {
                    // Verificar si ya existe en listaFiltrada por ID
                    const existeEnListaFiltrada = listaFiltrada.some(item => item.InvoiceNumber === item2.InvoiceNumber);

                    // Si no existe, añadirlo con valores de lista2 y null en campos de lista1
                    if (!existeEnListaFiltrada) {
                        listaFiltrada.push({
                            Descripcion: null,
                            Fecha: null,
                            Estado: null,
                            Arch_String: null,
                            GrossAmount: item2.GrossAmount,
                            InvoiceNumber: item2.InvoiceNumber
                        });
                    }
                });

                return listaFiltrada;
            },

            onAfterRendering: function () {
                this.postData(); // Llamar a postData después de que la vista ha sido renderizada
            },

            // Filtrado: Lo mantengo exactamente como estaba
            onFilter: function (oEvent) {
                let filters = [];
                let oView = this.getView();
                let shipName = oView.byId("shipName");
                let invoiceNumber = oView.byId("invoiceNumber")
                let filterDate = oView.byId("filterDate");

                if (shipName.getValue() !== "") {
                    filters.push(new Filter("Descripcion", FilterOperator.Contains, shipName.getValue()));
                }

                if (invoiceNumber.getValue() !== "") {
                    filters.push(new Filter("InvoiceNumber", FilterOperator.EQ, invoiceNumber.getValue()));
                }

                if (filterDate && filterDate.getDateValue()) {
                    let oDate = filterDate.getDateValue(); // Obtener el valor de la fecha seleccionada
                    let day = String(oDate.getDate()).padStart(2, '0');
                    let month = String(oDate.getMonth() + 1).padStart(2, '0'); // Enero es 0
                    let year = oDate.getFullYear();
                    let formattedDate = `${day}/${month}/${year}`; // Formatear la fecha a dd/mm/aaaa

                    filters.push(new Filter("Fecha", FilterOperator.EQ, formattedDate)); // Filtro para la fecha
                }

                const oList = this.getView().byId("invoicesList");
                const oBinding = oList.getBinding("items");
                oBinding.filter(filters);
            },

            // Limpieza de filtros: Lo mantengo exactamente como estaba
            onClearFilter: function () {
                let oView = this.getView();
                const shipNameInput = oView.byId("shipName");
                if (shipNameInput) {
                    shipNameInput.setValue(""); // Limpiar el valor del control shipName
                }

                const filterDate = oView.byId("filterDate");
                if (filterDate) {
                    filterDate.setDateValue(null); // Limpiar la fecha
                }

                const invoiceNumber = oView.byId("invoiceNumber");
                if (invoiceNumber) {
                    invoiceNumber.setValue("");
                }

                // Reiniciar el filtro de estado a "Todos"
                const statusFilter = oView.byId("statusFilter");
                if (statusFilter) {
                    statusFilter.setSelectedKey("Estado"); // Selecciona "Todos" en el dropdown
                }

                // Obtener la lista y su binding
                const oList = oView.byId("invoicesList");
                const oBinding = oList.getBinding("items");

                // Aplicar un filtro vacío para limpiar la lista
                oBinding.filter([]);
                oBinding.sort(null);
            },

            // Método para manejar el evento de mostrar PDF
            onShowPdfPress: function (oEvent) {
                // Obtener la codificación Base64 desde el CustomData del botón
                var sPdfBase64 = oEvent.getSource().data("pdfBase64");

                if (!sPdfBase64) {
                    MessageToast.show("No se encontró el PDF para esta factura.");
                    return;
                }

                // Crear la URL del PDF en formato base64
                var sPdfUrl = "data:application/pdf;base64," + sPdfBase64;

                // Crear un iframe para mostrar el PDF en un diálogo modal
                if (!this.oDialog) {
                    this.oDialog = new sap.m.Dialog({
                        title: "Vista Previa de la Factura",
                        contentWidth: "100%",
                        contentHeight: "100%",
                        verticalScrolling: false,
                        horizontalScrolling: false,
                        resizable: true,
                        content: new sap.ui.core.HTML({
                            content: "<iframe src='" + sPdfUrl + "' width='100%' height='100%' style='border:none;'></iframe>"
                        }),
                        endButton: new sap.m.Button({
                            text: "Cerrar",
                            press: function () {
                                this.oDialog.close();
                            }.bind(this)
                        })
                    });
                } else {
                    // Actualizar el contenido del iframe en caso de que el diálogo ya exista
                    this.oDialog.getContent()[0].setContent("<iframe src='" + sPdfUrl + "' width='100%' height='100%' style='border:none;'></iframe>");
                }

                this.oDialog.open();
            },

            removeFileExtension: function (fileName) {
                return fileName.substring(0, fileName.lastIndexOf('.'));
            },

            onOpenSortOptions: function (oEvent) {
                // Crear el ActionSheet solo la primera vez que se necesita
                if (!this.sortOptionsSheet) {
                    this.sortOptionsSheet = new sap.m.ActionSheet({
                        title: "Ordenar Por",
                        showCancelButton: true,
                        buttons: [
                            new sap.m.Button({
                                text: "Mayor a Menor",
                                press: this.onSortDescending.bind(this)
                            }),
                            new sap.m.Button({
                                text: "Menor a Mayor",
                                press: this.onSortAscending.bind(this)
                            })
                        ]
                    });

                    // Agregar el ActionSheet a la vista actual para el ciclo de vida
                    this.getView().addDependent(this.sortOptionsSheet);
                }

                // Abrir el ActionSheet en el botón que activó el evento
                this.sortOptionsSheet.openBy(oEvent.getSource());
            },

            onSortDescending: function () {
                const oList = this.getView().byId("invoicesList");
                const oBinding = oList.getBinding("items");

                // Crear un sorter que ordene en orden descendente
                const oSorter = new sap.ui.model.Sorter("GrossAmount", true);
                oBinding.sort(oSorter);
            },

            onSortAscending: function () {
                const oList = this.getView().byId("invoicesList");
                const oBinding = oList.getBinding("items");

                // Crear un sorter que ordene en orden ascendente
                const oSorter = new sap.ui.model.Sorter("GrossAmount", false);
                oBinding.sort(oSorter);
            },

            onStatusFilterChange: function (oEvent) {
                const selectedKey = oEvent.getParameter("selectedItem").getKey(); // Obtiene el valor seleccionado
                const oList = this.getView().byId("invoicesList"); // Obtén la lista de facturas
                const oBinding = oList.getBinding("items"); // Obtén el binding de los ítems de la lista
                const aFilters = [];

                // Si el usuario selecciona un estado específico, agregamos un filtro
                if (selectedKey) {
                    aFilters.push(new sap.ui.model.Filter("Estado", sap.ui.model.FilterOperator.EQ, selectedKey));
                }

                // Aplica el filtro a la lista
                oBinding.filter(aFilters);
            }

        });
    }
);