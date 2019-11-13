sap.ui.define([
	"at/clouddna/training/FioriDeepDive/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/ui/core/routing/History",
	"sap/m/UploadCollectionParameter"
], function (BaseController, JSONModel, MessageBox, History, UploadCollectionParameter) {
	"use strict";

	return BaseController.extend("at.clouddna.training.FioriDeepDive.controller.Customer", {

		_formFragments: {},
		_sMode: "",
		_oSmartForm: null,

		onInit: function () {
			this.getRouter().getRoute("Customer").attachPatternMatched(this._onPatternMatched, this);
		},

		_onPatternMatched: function (oEvent) {
			let sCustomerID = oEvent.getParameter("arguments").customerid,
				editModel = new JSONModel({
					editmode: false
				});

			this.getView().unbindElement();
			this.setModel(editModel, "editModel");

			this._oUploadCollection = this.getView().byId("customer_uploadcollection");
			this._sUploadUrl = "";
			//this._oUploadCollection.setUploadUrl("/sap/opu/odata/sap/ZHOFIO_CUSTOMER_SRV/CustomerDocumentSet");
			this._oSmartForm = this.getView().byId("customer_smartform");
			this._oSmartForm.attachEditToggled(function (oControlEvent) {
				editModel.setProperty("/editmode", oControlEvent.getParameter("editable"));
			}, this);

			this._oSmartForm.setEditable(false);
			if (sCustomerID === "create") {
				this._oUploadCollection.setVisible(false);
				this._oSmartForm.setEditable(true);
				this._sMode = "create";
				this.getView().byId("customer_button_cancel").setEnabled(false);
				this._oContext = this.getModel().createEntry("/CustomerSet");
				this.getView().setBindingContext(this._oContext);
				this._oSmartForm.check();
			} else {
				this._sMode = "display";
				this._oUploadCollection.setVisible(true);
				this.getView().byId("customer_button_cancel").setEnabled(true);
				this.getView().bindElement("/CustomerSet(guid'" + sCustomerID + "')");
				this._sUploadUrl = "/sap/opu/odata/sap/ZHOFIO_CUSTOMER_SRV/CustomerSet(guid'" + sCustomerID + "')/Documents";
				this._oUploadCollection.setUploadUrl(this._sUploadUrl);
			}
		},

		_toggleButtonsAndView: function (bEdit) {
			let editModel = this.getModel("editModel"),
				bMode = !editModel.getProperty("/editmode");

			editModel.setProperty("/editmode", bMode);

			this._showFormFragment(bMode ? "EditCustomer" : "DisplayCustomer");
		},

		_showFormFragment: function (sName) {
			var oPage = this.byId("customer_page");

			oPage.removeAllContent();
			oPage.insertContent(this._getFormFragment(sName));
		},

		_getFormFragment: function (sFragmentName) {
			var oFormFragment = this._formFragments[sFragmentName];

			if (oFormFragment) {
				return oFormFragment;
			}

			oFormFragment = sap.ui.xmlfragment(this.getView().getId(), "at.clouddna.training.FioriDeepDive.view." + sFragmentName);

			this._formFragments[sFragmentName] = oFormFragment;
			return this._formFragments[sFragmentName];
		},

		onEditPress: function (oEvent) {
			this._toggleButtonsAndView();
		},

		onCancelPress: function (oEvent) {
			let oSmartForm = this.getView().byId("customer_smartform");

			oSmartForm.check();
			if (this._isFormValid()) {
				oSmartForm.setEditable(false);

				if (this.getModel().hasPendingChanges()) {
					this.getModel().resetChanges();
				}
			}
		},

		onSavePress: function (oEvent) {
			let oSmartForm = this.getView().byId("customer_smartform");

			oSmartForm.check();
			if (this._isFormValid()) {
				oSmartForm.setEditable(false);

				if (this.getModel().hasPendingChanges()) {
					this.getModel().submitChanges();

					if (this._sMode === "create") {
						MessageBox.information(this.geti18nText("dialog.create.success"), {
							onClose: function (oEvent) {
								this.onNavBack();
							}.bind(this)
						});
						this.onNavBack();
					} else {
						MessageBox.information(this.geti18nText("dialog.update.success"));
					}
				}
			}

		},

		onExit: function () {
			for (var sPropertyName in this._formFragments) {
				if (!this._formFragments.hasOwnProperty(sPropertyName) || this._formFragments[sPropertyName] === null) {
					return;
				}

				this._formFragments[sPropertyName].destroy();
				this._formFragments[sPropertyName] = null;
			}
		},

		onEmailChanged: function (oEvent) {
			let oControl = oEvent.getSource();
			let oValue = oEvent.getParameter("newValue");
			let regex =
				/^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

			if (regex.test(oValue)) {
				oControl.setValueState("None");
				oControl.setValueStateText("");
			} else {
				oControl.setValueState("Error");
				oControl.setValueStateText(this.geti18nText("validate.email.error"));
			}
		},

		onGenderChanged: function (oEvent) {
			let oValue = oEvent.getParameter("newValue"),
				oControl = oEvent.getSource();

			if (oValue !== "M" && oValue !== "F") {
				oControl.setValueState("Error");
				oControl.setValueStateText(this.geti18nText("validate.gender.error"));
			} else {
				oControl.setValueState("None");
				oControl.setValueStateText("");
			}
		},

		_isFormValid: function () {
			let oSmartForm = this.getView().byId("customer_smartform"),
				oGroups = oSmartForm.getGroups(),
				oGroupElements = [],
				oElements = [];

			oGroups.forEach(function (oGroup) {
				let oItems = oGroup.getGroupElements();

				oItems.forEach(function (oItem) {
					oGroupElements.push(oItem);
				});
			});

			oGroupElements.forEach(function (oGroupElement) {
				let oItems = oGroupElement.getElements();

				oItems.forEach(function (oItem) {
					oElements.push(oItem);
				});
			});

			return oElements.every(function (oElement) {
				return oElement.getValueState() === "None";
			});
		},

		onBeforeUploadStarts: function (oEvent) {
			let oCustomerHeaderSlug = new UploadCollectionParameter({
				name: "slug",
				value: oEvent.getParameter("fileName")
			});
			oEvent.getParameters().addHeaderParameter(oCustomerHeaderSlug);
			this._oUploadCollection.setBusy(true);
		},

		onUploadComplete: function (oEvent) {
			this._oUploadCollection.setBusy(false);
			this.getModel().refresh();
		},

		onUploadChange: function (oEvent) {
			let oCustomerHeaderToken = new UploadCollectionParameter({
				name: "x-csrf-token",
				value: this.getModel().getSecurityToken()
			});

			this._oUploadCollection.addHeaderParameter(oCustomerHeaderToken);
		},

		onDocumentPress: function (oEvent) {
			var sPath = oEvent.getSource().getBindingContext().sPath;
			this.getModel().read(sPath, {
				success: function (oData, response) {
					if (oData.DocumentType === "application/pdf") {
						let pdfViewer = new sap.m.PDFViewer();

						pdfViewer.setSource(sPath + "/$value");
						pdfViewer.setTitle(oData.DocumentName);
						pdfViewer.open();
					} else {
						sap.m.URLHelper.redirect(sPath + "/$value");
					}
				}
			});
		},

		onDocumentDelete: function (oEvent) {
			let aDocumentPath = oEvent.getParameter("documentId").split(","),
				sDocId = aDocumentPath[0],
				sCustomerId = aDocumentPath[1],
				oModel = this.getModel(),
				oUploadCollection = this.getView().byId("customer_uploadcollection");

			oUploadCollection.setBusy(true);

			oModel.remove(
				"/CustomerDocumentSet(DocId=guid'" + sDocId + "',CustomerId=guid'" + sCustomerId + "')", {
					success: function (oData, response) {
						oUploadCollection.setBusy(false);
						MessageBox.information(this.geti18nText("dialog.delete.file.success"));
					}.bind(this),
					error: function (oError) {
						oUploadCollection.setBusy(false);
						MessageBox.error(oError.message);
					}
				});
		}

	});

});