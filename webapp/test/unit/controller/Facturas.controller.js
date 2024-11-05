/*global QUnit*/

sap.ui.define([
	"dev/facturas/controller/Facturas.controller"
], function (Controller) {
	"use strict";

	QUnit.module("Facturas Controller");

	QUnit.test("I should test the Facturas controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
