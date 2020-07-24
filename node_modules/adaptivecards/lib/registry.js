"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardObjectRegistry = void 0;
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
var serialization_1 = require("./serialization");
var CardObjectRegistry = /** @class */ (function () {
    function CardObjectRegistry() {
        this._items = {};
    }
    CardObjectRegistry.prototype.findByName = function (typeName) {
        return this._items.hasOwnProperty(typeName) ? this._items[typeName] : undefined;
    };
    CardObjectRegistry.prototype.clear = function () {
        this._items = {};
    };
    CardObjectRegistry.prototype.register = function (typeName, objectType, schemaVersion) {
        if (schemaVersion === void 0) { schemaVersion = serialization_1.Versions.v1_0; }
        var registrationInfo = this.findByName(typeName);
        if (registrationInfo !== undefined) {
            registrationInfo.objectType = objectType;
        }
        else {
            registrationInfo = {
                typeName: typeName,
                objectType: objectType,
                schemaVersion: schemaVersion
            };
        }
        this._items[typeName] = registrationInfo;
    };
    CardObjectRegistry.prototype.unregister = function (typeName) {
        delete this._items[typeName];
    };
    CardObjectRegistry.prototype.createInstance = function (typeName, targetVersion) {
        var registrationInfo = this.findByName(typeName);
        return (registrationInfo && registrationInfo.schemaVersion.compareTo(targetVersion) <= 0) ? new registrationInfo.objectType() : undefined;
    };
    CardObjectRegistry.prototype.getItemCount = function () {
        return Object.keys(this._items).length;
    };
    CardObjectRegistry.prototype.getItemAt = function (index) {
        return Object.values(this._items)[index];
    };
    return CardObjectRegistry;
}());
exports.CardObjectRegistry = CardObjectRegistry;
//# sourceMappingURL=registry.js.map