sap.ui.define([
	"at/clouddna/training/FioriDeepDive/controller/BaseController",
	"sap/m/MessageBox",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/Fragment",
	"sap/ui/model/json/JSONModel"
], function (BaseController, MessageBox, Filter, FilterOperator, Fragment, JSONModel) {
	"use strict";

	return BaseController.extend("at.clouddna.training.FioriDeepDive.controller.Master", {

		onInit: function () {
			this.getRouter().getRoute("Master").attachPatternMatched(this._onPatternMatched, this);
		},

		_onPatternMatched: function () {
			let sCurrentLocale = sap.ui.getCore().getConfiguration().getLanguage(),
				oLanguageModel = new JSONModel({
					currentLanguage: sCurrentLocale
				});

			oLanguageModel.attachPropertyChange(function (oProperty) {
				let oLanguage = oProperty.getParameter("value"),
					sFormatLocale = sap.ui.getCore().getConfiguration().getFormatLocale();

				sap.ui.getCore().getConfiguration().setLanguage(oLanguage);
				sap.ui.getCore().getConfiguration().setFormatLocale(sFormatLocale);

			});

			this.setModel(oLanguageModel, "languageModel");
		},

		onTableSortPress: function (oEvent) {
			/*
			this._oDialog = sap.ui.xmlfragment("at.clouddna.training.FioriDeepDive.view.TableSettingsDialog", this);
			this._oDialog.setModel(this.getModel("i18n"), "i18n");
			this._oDialog.open();
			*/
			let oView = this.getView();

			if (!this.byId("dialog_tablesetting")) {
				Fragment.load({
					id: oView.getId(),
					name: "at.clouddna.training.FioriDeepDive.view.TableSettingsDialog",
					controller: this
				}).then(function (oDialog) {
					oView.addDependent(oDialog);
					oDialog.open();
				});
			} else {
				this.byId("dialog_tablesetting").open();
			}
		},

		onSortDialogConfirm: function (oEvent) {
			let oTable = this.getView().byId("master_table"),
				mParams = oEvent.getParameters(),
				oBinding = oTable.getBinding("items"),
				sPath,
				bDescending,
				aSorters = [];

			sPath = mParams.sortItem.getKey();
			bDescending = mParams.sortDescending;
			aSorters.push(new sap.ui.model.Sorter(sPath, bDescending));

			oBinding.sort(aSorters);
		},

		onTableFilter: function (oEvent) {
			let aEnteredFilters = oEvent.getParameters().selectionSet,
				aColumnNames = ["Firstname", "Lastname", "Gender", "Email"],
				oTable = this.getView().byId("master_table"),
				oBindings = oTable.getBinding("items"),
				aFilters = [];

			for (let h = 0; h < aEnteredFilters.length; h++) {
				if (aEnteredFilters[h].hasOwnProperty("_lastValue")) {
					if (aEnteredFilters[h]._lastValue !== "") {
						aFilters.push(new Filter(aColumnNames[h], FilterOperator.Contains,
							aEnteredFilters[h]._lastValue));
					}
				} else {
					if (aEnteredFilters[h].getProperty("selectedKey") !== "") {
						aFilters.push(new Filter(aColumnNames[h], FilterOperator.Contains,
							aEnteredFilters[h].getProperty("selectedKey")));
					}
				}
			}
			oBindings.filter(aFilters);
		},

		onClearFilters: function (oEvent) {

		},

		onCustomerPress: function (oEvent) {
			let sCustomerID = oEvent.getSource().getBindingContext().sPath.split("'")[1];

			this.getRouter().navTo("Customer", {
				customerid: sCustomerID
			}, false);
		},

		onNewCustomerPress: function (oEvent) {
			this.getRouter().navTo("Customer", {
				customerid: "create"
			}, false);
		},

		onDeleteCustomerPress: function (oEvent) {
			let sCustomerPath = oEvent.getSource().getBindingContext().sPath,
				oModel = this.getModel();

			let oTable = this.byId("master_table");
			oTable.setBusy(true);

			MessageBox.show(this.geti18nText("dialog.delete"), {
				icon: MessageBox.Icon.WARNING,
				title: "",
				actions: [MessageBox.Action.YES, MessageBox.Action.NO],
				onClose: function (sAnswer) {
					if (sAnswer === MessageBox.Action.YES) {
						oModel.remove(sCustomerPath, {
							success: function (oData, response) {
								oModel.updateBindings(true);
								oTable.setBusy(false);
								MessageBox.information(this.geti18nText("dialog.delete.success"));
							}.bind(this),
							error: function (oError) {
								oTable.setBusy(false);
								MessageBox.error(oError.message);
							}
						});
					}
				}.bind(this)
			});
		}
	});

});