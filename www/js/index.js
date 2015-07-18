// (c) 2014 Don Coleman
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/* global mainPage, deviceList, refreshButton */
/* global detailPage, batteryState, batteryStateButton, disconnectButton */
/* global ble  */
/* jshint browser: true , devel: true*/
'use strict';

// returns advertising data as hashmap of byte arrays keyed by type
// advertising data is length, type, data
// https://www.bluetooth.org/en-us/specification/assigned-numbers/generic-access-profile
function parseAdvertisingData(bytes) {
    var length, type, data, i = 0, advertisementData = {};

    while (length !== 0) {

        length = bytes[i] & 0xFF;
        i++;

        type = bytes[i] & 0xFF;
        i++;

        data = bytes.slice(i, i + length - 1); // length includes type byte, but not length byte
        i += length - 2;  // move to end of data
        i++;

        advertisementData[type] = data;
    }

    return advertisementData;
}

// Convert ArrayBuffer to int[] for easier processing.
// If Uint8Array.slice worked, this would be unnecessary
var arrayBufferToIntArray = function(buffer) {
    var result;

    if (buffer) {
        var typedArray = new Uint8Array(buffer);
        result = [];
        for (var i = 0; i < typedArray.length; i++) {
            result[i] = typedArray[i];
        }
    }

    return result;
};

var battery = {
    service: "180F",
    level: "2A19"
};

var app = {
    initialize: function() {
        this.bindEvents();
        detailPage.hidden = true;
    },
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        refreshButton.addEventListener('touchstart', this.refreshDeviceList, false);
        batteryStateButton.addEventListener('touchstart', this.readBatteryState, false);
        disconnectButton.addEventListener('touchstart', this.disconnect, false);
        deviceList.addEventListener('touchstart', this.connect, false); // assume not scrolling
    },
    onDeviceReady: function() {
        app.refreshDeviceList();
    },
    refreshDeviceList: function() {
        deviceList.innerHTML = ''; // empties the list
        // scan for all devices
        ble.scan([], 5, app.onDiscoverDevice, app.onError);
    },
    onDiscoverDevice: function(device) {

        debugger;
        var adData = new Uint8Array(device.advertising);
        var hexData = [];
        for (var i=0; i<adData.length; i++) {
            hexData.push(adData[i].toString(16))
        }
        //[2, 1, 26, 26, 255, 76, 0, 2, 21, 226, 197, 109, 181, 223, 251, 72, 210, 176, 96, 208, 245, 167, 16, 150, 224, 0, 0, 0, 0, 197, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        console.log(JSON.stringify(device));
        var listItem = document.createElement('li'),
            html = '<b>' + device.name + '</b><br/>' +
                'RSSI: ' + device.rssi + '&nbsp;|&nbsp;' +
                device.id;

        listItem.dataset.deviceId = device.id;  // TODO
        listItem.innerHTML = html;
        deviceList.appendChild(listItem);

    },
    connect: function(e) {
        var deviceId = e.target.dataset.deviceId,
            onConnect = function() {

                // TODO check if we have the battery service
                // TODO check if the battery service can notify us
                //ble.notify(deviceId, battery.service, battery.level, app.onBatteryLevelChange, app.onError);
                batteryStateButton.dataset.deviceId = deviceId;
                disconnectButton.dataset.deviceId = deviceId;
                app.showDetailPage();
            };

        ble.connect(deviceId, onConnect, app.onError);
    },
    onBatteryLevelChange: function(data) {
        console.log(data);
        var message;
        var a = new Uint8Array(data);
        batteryState.innerHTML = a[0];
    },
    readBatteryState: function(event) {
        console.log("readBatteryState");
        var deviceId = event.target.dataset.deviceId;
        ble.read(deviceId, battery.service, battery.level, app.onReadBatteryLevel, app.onError);
    },
    onReadBatteryLevel: function(data) {
        console.log(data);
        var message;
        var a = new Uint8Array(data);
        batteryState.innerHTML = a[0];
    },
    disconnect: function(event) {
        var deviceId = event.target.dataset.deviceId;
        ble.disconnect(deviceId, app.showMainPage, app.onError);
    },
    showMainPage: function() {
        mainPage.hidden = false;
        detailPage.hidden = true;
    },
    showDetailPage: function() {
        mainPage.hidden = true;
        detailPage.hidden = false;
    },
    onError: function(reason) {
        alert("ERROR: " + reason); // real apps should use notification.alert
    }
};
