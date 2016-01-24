var IO_SERVICE = 'f000aa64-0451-4000-b000-000000000000';
var DATA_CHARACTERISTIC = 'f000aa65-0451-4000-b000-000000000000';
var CONFIGURATION_CHARACTERISTIC = 'f000aa66-0451-4000-b000-000000000000';

var app = {
    initialize: function() {
        this.bindEvents();
        this.showMainPage();
    },
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        document.addEventListener('backbutton', this.onBackButton, false);
        deviceList.addEventListener('click', this.connect, false);
        refreshButton.addEventListener('click', this.refreshDeviceList, false);
        redCheckbox.addEventListener('click', this.optionsChanged, false);
        greenCheckbox.addEventListener('click', this.optionsChanged, false);
        buzzerCheckbox.addEventListener('click', this.optionsChanged, false);
        disconnectButton.addEventListener('click', this.disconnect, false);
    },
    onDeviceReady: function() {
        FastClick.attach(document.body); // https://github.com/ftlabs/fastclick
        app.refreshDeviceList();
    },
    refreshDeviceList: function() {
        deviceList.innerHTML = ''; // empty the list
        ble.scan(['AA80'], 5, app.onDiscoverDevice, app.onError);
    },
    onDiscoverDevice: function(device) {
        var listItem = document.createElement('li');
        listItem.innerHTML = device.name + '<br/>' +
            device.id + '<br/>' +
            'RSSI: ' + device.rssi;
        listItem.dataset.deviceId = device.id;
        deviceList.appendChild(listItem);
    },
    connect: function(e) {
        var deviceId = e.target.dataset.deviceId;
        redCheckbox.checked = false;
        greenCheckbox.checked = false;
        buzzerCheckbox.checked = false;
        ble.connect(deviceId, app.onConnect, app.onError);
    },
    onConnect: function(peripheral) {
        app.peripheral = peripheral;
        app.turnLedOff();

        // enable the io service
        ble.write(
            peripheral.id,
            IO_SERVICE,
            CONFIGURATION_CHARACTERISTIC,
            new Uint8Array([1]).buffer,
            app.showDetailPage,
            app.onError
        );
    },
    turnLedOff: function() {
        app.setDataValue(0);
    },
    optionsChanged: function() {
        // when one checkbox changes, read all the values and set the data characteristic

        // bitmask
        var RED_LED = 1;   // 0001
        var GREEN_LED = 2; // 0010
        var BUZZER = 4;    // 0100

        var data = 0;

        if (redCheckbox.checked) {
            data = data | RED_LED;
        }

        if (greenCheckbox.checked) {
            data = data | GREEN_LED;
        }

        if (buzzerCheckbox.checked) {
            data = data | BUZZER;
        }

        app.setDataValue(data);
    },
    setDataValue: function(value) {
        var success = function() {
            console.log('Set data value to ' + value);
        };

        if (app.peripheral && app.peripheral.id) {
            var data = new Uint8Array(1); // size === 1
            data[0] = value;
            ble.write(
                app.peripheral.id,
                IO_SERVICE,
                DATA_CHARACTERISTIC,
                data.buffer,
                success,
                app.onError
            );
        }
    },
    disconnect: function(e) {
        if (app.peripheral && app.peripheral.id) {
            ble.disconnect(app.peripheral.id, app.showMainPage, app.onError);
        }
    },
    showMainPage: function() {
        mainPage.hidden = false;
        detailPage.hidden = true;
    },
    showDetailPage: function() {
        mainPage.hidden = true;
        detailPage.hidden = false;
    },
    onBackButton: function() {
        if (mainPage.hidden) {
            app.disconnect();
        } else {
            navigator.app.exitApp();
        }
    },
    onError: function(reason) {
        navigator.notification.alert(reason, app.showMainPage, 'Error');
    }
};

app.initialize();
