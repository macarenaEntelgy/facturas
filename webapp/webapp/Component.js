sap.ui.define([
    "sap/ui/core/UIComponent",
    "dev/facturas/copia/model/models"
], (UIComponent, models) => {
    "use strict";

    return UIComponent.extend("dev.facturas.copia.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        /**
         * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
         * @public
         * @override
         */
        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // enable routing
            this.getRouter().initialize();

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

        }
    });
});