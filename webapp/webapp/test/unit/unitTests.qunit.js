/* global QUnit */
// https://api.qunitjs.com/config/autostart/
QUnit.config.autostart = false;

sap.ui.require([
	"dev/facturas.copia/test/unit/AllTests"
], function (Controller) {
	"use strict";
	QUnit.start();
});