/*global QUnit*/

sap.ui.define([
	"dev/facturas.copia/controller/facturasCopia.controller"
], function (Controller) {
	"use strict";

	QUnit.module("facturasCopia Controller");

	QUnit.test("I should test the facturasCopia controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
